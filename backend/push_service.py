import os
import json
import logging
from pywebpush import webpush, WebPushException

logger = logging.getLogger(__name__)

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY  = os.environ.get("VAPID_PUBLIC_KEY")
VAPID_EMAIL       = os.environ.get("VAPID_EMAIL", "mailto:admin@grikai.app")


def send_push(subscription: dict, title: str, body: str, url: str = "/dashboard") -> bool:
    """
    Send a single web push notification.
    subscription: { endpoint, keys: { p256dh, auth } }
    Returns True on success, False on failure.
    """
    payload = json.dumps({
        "title": title,
        "body":  body,
        "icon":  "/icon-192.png",
        "badge": "/icon-192.png",
        "url":   url,
        "tag":   "grik-deadline-reminder",
    })

    try:
        webpush(
            subscription_info={
                "endpoint": subscription["endpoint"],
                "keys": {
                    "p256dh": subscription["p256dh"],
                    "auth":   subscription["auth"],
                },
            },
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={
                "sub": VAPID_EMAIL,
                "aud": _get_audience(subscription["endpoint"]),
            },
        )
        logger.info(f"[GRIK AI] Push sent → {subscription['endpoint'][:40]}...")
        return True

    except WebPushException as e:
        status = e.response.status_code if e.response is not None else "unknown"
        logger.warning(f"[GRIK AI] Push failed (HTTP {status}): {e}")
        # 410 Gone = subscription expired/revoked — caller should delete it
        if e.response is not None and e.response.status_code == 410:
            raise
        return False


def _get_audience(endpoint: str) -> str:
    from urllib.parse import urlparse
    parsed = urlparse(endpoint)
    return f"{parsed.scheme}://{parsed.netloc}"