import logging
from datetime import datetime, timezone, timedelta
from database import get_conn
from push_service import send_push
from pywebpush import WebPushException

logger = logging.getLogger(__name__)


def check_and_send_reminders():
    """
    Called by GET /send-reminders (triggered by Render cron every 5 min).
    Checks all incomplete deadlines and sends push notifications
    for each enabled reminder interval that hasn't been sent yet.
    """
    now = datetime.now(timezone.utc)
    sent_count = 0
    error_count = 0

    with get_conn() as conn:
        with conn.cursor() as cur:

            # Fetch all incomplete deadlines with their reminder intervals
            cur.execute("""
                SELECT id, user_id, title, due_date, category, reminder_intervals
                FROM deadlines
                WHERE completed = FALSE
                  AND due_date > NOW() - INTERVAL '1 day'
                ORDER BY due_date ASC
            """)
            deadlines = cur.fetchall()

            for deadline in deadlines:
                deadline_id   = deadline["id"]
                user_id       = deadline["user_id"]
                title         = deadline["title"]
                due_date      = deadline["due_date"]
                category      = deadline["category"] or "task"
                intervals_str = deadline["reminder_intervals"] or "7,3,1,0"

                intervals = [int(x.strip()) for x in intervals_str.split(",") if x.strip().isdigit()]

                for days_before in intervals:
                    # Reminder fires at 8:00 AM local (we use UTC, adjust if needed)
                    reminder_time = due_date - timedelta(days=days_before)
                    reminder_time = reminder_time.replace(hour=8, minute=0, second=0, microsecond=0)

                    # Check if within the current 5-min window
                    window_start = now - timedelta(minutes=5)
                    if not (window_start <= reminder_time <= now):
                        continue

                    # Check if already sent
                    cur.execute("""
                        SELECT 1 FROM sent_reminders
                        WHERE deadline_id = %s AND days_before = %s
                    """, (deadline_id, days_before))
                    if cur.fetchone():
                        continue

                    # Build notification copy
                    if days_before == 0:
                        body = f'"{title}" is due today. Don\'t miss it.'
                        label = "Due today"
                    elif days_before == 1:
                        body = f'"{title}" is due tomorrow.'
                        label = "Due tomorrow"
                    else:
                        body = f'"{title}" is due in {days_before} days.'
                        label = f"{days_before} days left"

                    push_title = f"⏰ {label} — {category.capitalize()}"

                    # Fetch all subscriptions for this user
                    cur.execute("""
                        SELECT endpoint, p256dh, auth
                        FROM push_subscriptions
                        WHERE user_id = %s
                    """, (user_id,))
                    subscriptions = cur.fetchall()

                    if not subscriptions:
                        logger.info(f"[GRIK AI] No subscriptions for user {user_id}, skipping")
                        continue

                    push_ok = False
                    for sub in subscriptions:
                        try:
                            ok = send_push(dict(sub), push_title, body)
                            if ok:
                                push_ok = True
                                sent_count += 1
                        except WebPushException:
                            # 410 expired subscription — remove it
                            cur.execute("""
                                DELETE FROM push_subscriptions WHERE endpoint = %s
                            """, (sub["endpoint"],))
                            error_count += 1

                    # Mark as sent so we don't double-fire
                    if push_ok:
                        cur.execute("""
                            INSERT INTO sent_reminders (deadline_id, days_before)
                            VALUES (%s, %s)
                            ON CONFLICT DO NOTHING
                        """, (deadline_id, days_before))

            conn.commit()

    logger.info(f"[GRIK AI] Reminder check done — sent: {sent_count}, errors: {error_count}")
    return {"sent": sent_count, "errors": error_count}