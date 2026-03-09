from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime

from ai_engine import analyze_pdf_with_ai, analyze_text_with_ai
from schemas import ExtractionResult
from database import init_db, get_conn
from reminder_scheduler import check_and_send_reminders
from push_service import send_push

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# ── Init DB on startup ─────────────────────────────────────────
@app.on_event("startup")
async def startup():
    init_db()

# ── CORS ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://grik-ai.vercel.app",
        "http://localhost:5173",
        "http://localhost:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic models ────────────────────────────────────────────
class TextInput(BaseModel):
    content: str

class PushSubscriptionInput(BaseModel):
    user_id: str
    endpoint: str
    p256dh: str
    auth: str

class DeadlineInput(BaseModel):
    id: str
    user_id: str
    title: str
    due_date: str              # ISO string e.g. "2025-03-15T08:00:00Z"
    category: Optional[str] = "general"
    completed: Optional[bool] = False
    reminder_intervals: Optional[str] = "7,3,1,0"  # comma-separated days

class DeadlineSyncInput(BaseModel):
    user_id: str
    deadlines: List[DeadlineInput]

# ── Existing routes ────────────────────────────────────────────
@app.get("/")
async def health():
    return {"status": "ok", "service": "GRIK AI API"}

@app.get("/ping")
async def ping():
    return {"status": "alive", "time": datetime.utcnow().isoformat()}

@app.post("/analyze-text", response_model=ExtractionResult)
async def analyze_text(input: TextInput):
    return analyze_text_with_ai(input.content)

@app.post("/analyze-document", response_model=ExtractionResult)
async def analyze_document(file: UploadFile = File(...)):
    file_bytes = await file.read()
    return analyze_pdf_with_ai(file_bytes, file.filename)

# ── Push subscription ──────────────────────────────────────────
@app.post("/save-subscription")
async def save_subscription(data: PushSubscriptionInput):
    """
    Called from frontend after push permission granted.
    Saves the subscription so backend can send pushes later.
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (endpoint) DO UPDATE
                SET user_id = EXCLUDED.user_id,
                    p256dh  = EXCLUDED.p256dh,
                    auth    = EXCLUDED.auth
            """, (data.user_id, data.endpoint, data.p256dh, data.auth))
        conn.commit()
    logger.info(f"[GRIK AI] Subscription saved for user {data.user_id}")
    return {"status": "saved"}

@app.delete("/delete-subscription")
async def delete_subscription(endpoint: str):
    """Called when user disables notifications."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM push_subscriptions WHERE endpoint = %s", (endpoint,))
        conn.commit()
    return {"status": "deleted"}

# ── Deadline sync ──────────────────────────────────────────────
@app.post("/sync-deadlines")
async def sync_deadlines(data: DeadlineSyncInput):
    """
    Frontend syncs all deadlines on add/update/delete.
    Full replace for this user — simple and reliable.
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            # Delete old deadlines for this user
            cur.execute("DELETE FROM deadlines WHERE user_id = %s", (data.user_id,))

            # Insert current state
            for d in data.deadlines:
                if d.completed:
                    continue  # don't store completed deadlines
                cur.execute("""
                    INSERT INTO deadlines (id, user_id, title, due_date, category, completed, reminder_intervals)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        title              = EXCLUDED.title,
                        due_date           = EXCLUDED.due_date,
                        category           = EXCLUDED.category,
                        completed          = EXCLUDED.completed,
                        reminder_intervals = EXCLUDED.reminder_intervals
                """, (
                    d.id, d.user_id, d.title, d.due_date,
                    d.category, d.completed, d.reminder_intervals
                ))
        conn.commit()
    logger.info(f"[GRIK AI] Synced {len(data.deadlines)} deadlines for user {data.user_id}")
    return {"status": "synced", "count": len(data.deadlines)}

# ── Cron endpoint — called by Render cron every 5 min ─────────
@app.get("/send-reminders")
async def send_reminders():
    """
    Render cron job hits this every 5 minutes.
    Checks deadlines and sends push notifications.
    """
    result = check_and_send_reminders()
    return {"status": "ok", **result}

# ── Test push — dev only ───────────────────────────────────────
@app.post("/test-push")
async def test_push(data: PushSubscriptionInput):
    """Send an immediate test push to a specific subscription."""
    ok = send_push(
        {"endpoint": data.endpoint, "p256dh": data.p256dh, "auth": data.auth},
        "🪄 GRIK AI — Test",
        "Background notifications are working!",
        "/dashboard"
    )
    return {"status": "sent" if ok else "failed"}