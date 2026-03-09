// ── Notification Permission Prompt ─────────────────────
// Shows after onboarding — asks user to enable notifications
// Styled to match the app's dark theme

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { registerPushNotifications } from "@/hooks/usePushNotifications";

interface Props {
  onDone: () => void;
}

export function NotificationPrompt({ onDone }: Props) {
  const { user } = useAuth0();
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false);

  async function handleEnable() {
    if (!user?.sub) {
      console.warn("[GRIK AI] No Auth0 user ID available");
      return;
    }
    setLoading(true);
    const sub = await registerPushNotifications(user.sub);
    setLoading(false);
    if (sub) {
      setGranted(true);
      setTimeout(onDone, 1200);
    }
  }

  if (granted) return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "24px",
    }}>
      <div style={{
        background: "#141417", border: "1px solid #27272A",
        borderRadius: "20px", padding: "32px 24px", textAlign: "center",
        maxWidth: "320px", width: "100%",
        animation: "popIn 0.3s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
        <h3 style={{ color: "#FAFAFA", fontSize: "17px", fontWeight: 600, marginBottom: "6px" }}>
          Notifications enabled!
        </h3>
        <p style={{ color: "#71717A", fontSize: "13px" }}>
          We'll remind you before every deadline.
        </p>
      </div>
      <style>{`@keyframes popIn { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 9999, padding: "0 0 24px",
    }}>
      <div style={{
        background: "#141417", border: "1px solid #27272A",
        borderRadius: "20px 20px 20px 20px", padding: "28px 24px",
        maxWidth: "400px", width: "calc(100% - 32px)",
        animation: "slideUp 0.35s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "14px",
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bell size={22} style={{ color: "#818CF8" }} />
          </div>
          <button onClick={onDone} style={{
            background: "#1C1C22", border: "1px solid #27272A",
            borderRadius: "8px", width: "32px", height: "32px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#52525B",
          }}>
            <X size={14} />
          </button>
        </div>

        <h3 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: "22px", fontWeight: 400, color: "#FAFAFA",
          marginBottom: "8px", letterSpacing: "-0.01em",
        }}>
          Never miss a deadline
        </h3>
        <p style={{ fontSize: "13px", color: "#71717A", lineHeight: 1.6, marginBottom: "20px" }}>
          Get notified 7 days, 3 days, and 1 day before every deadline — even when the app is closed.
        </p>

        {/* Preview */}
        <div style={{
          background: "#0F0F12", border: "1px solid #27272A",
          borderRadius: "12px", padding: "12px 14px", marginBottom: "20px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontSize: "20px" }}>🪄</span>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#FAFAFA", margin: 0 }}>
              ⏰ Deadline due tomorrow
            </p>
            <p style={{ fontSize: "11px", color: "#52525B", margin: "2px 0 0", fontFamily: "'DM Mono', monospace" }}>
              "Fee Payment" is due tomorrow. — GRIK AI
            </p>
          </div>
        </div>

        <button onClick={handleEnable} disabled={loading} style={{
          width: "100%", padding: "13px",
          background: loading ? "#1C1C22" : "linear-gradient(135deg, #6366F1, #818CF8)",
          border: "none", borderRadius: "12px",
          color: "white", fontSize: "14px", fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif", cursor: loading ? "wait" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.35)",
          marginBottom: "10px",
        }}>
          {loading
            ? <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
            : <><Bell size={15} /> Enable Notifications</>
          }
        </button>

        <button onClick={onDone} style={{
          width: "100%", padding: "11px",
          background: "none", border: "none",
          color: "#52525B", fontSize: "13px", cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Maybe later
        </button>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Sans:wght@500;600&family=DM+Mono:wght@400&display=swap');
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
