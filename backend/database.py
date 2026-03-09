import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")


def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def init_db():
    with get_conn() as conn:
        with conn.cursor() as cur:
            # Push subscriptions — one row per device per user
            cur.execute("""
                CREATE TABLE IF NOT EXISTS push_subscriptions (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    endpoint TEXT NOT NULL UNIQUE,
                    p256dh TEXT NOT NULL,
                    auth TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # Deadlines — synced from frontend
            cur.execute("""
                CREATE TABLE IF NOT EXISTS deadlines (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    due_date TIMESTAMPTZ NOT NULL,
                    category TEXT DEFAULT 'general',
                    completed BOOLEAN DEFAULT FALSE,
                    reminder_intervals TEXT DEFAULT '7,3,1,0',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # Sent reminders — prevents duplicate pushes
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sent_reminders (
                    id SERIAL PRIMARY KEY,
                    deadline_id TEXT NOT NULL,
                    days_before INT NOT NULL,
                    sent_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(deadline_id, days_before)
                );
            """)
        conn.commit()
    print("[GRIK AI] Database initialised")