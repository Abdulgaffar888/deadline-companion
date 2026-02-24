import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeadlines } from "@/context/DeadlineContext";
import { NotificationPrompt } from "@/components/NotificationPrompt";

const STEPS = [
  {
    icon: "📋",
    title: "How it works",
    desc: "You share anything with a date — we turn it into a tracked deadline with automatic reminders.",
    demo: [
      { icon: "📧", bg: "rgba(239,68,68,0.1)",   title: "Fee Payment Notice",     sub: "Due: Mar 15 · ₹24,500", badge: "OVERDUE",  bc: "#EF4444", bb: "rgba(239,68,68,0.1)"  },
      { icon: "📝", bg: "rgba(245,158,11,0.1)",  title: "Assignment Submission",  sub: "Due: Tomorrow · CS301", badge: "DUE SOON", bc: "#F59E0B", bb: "rgba(245,158,11,0.1)" },
      { icon: "📅", bg: "rgba(99,102,241,0.1)",  title: "Audit Report Filing",    sub: "Due: Apr 3 · Finance",  badge: "ON TRACK", bc: "#22C55E", bb: "rgba(34,197,94,0.1)"  },
    ],
  },
  {
    icon: "🤖",
    title: "AI reads everything",
    desc: "Paste a WhatsApp message, email, or exam notice — AI finds every date and deadline automatically.",
    demo: [
      { icon: "💬", bg: "rgba(99,102,241,0.1)",  title: "WhatsApp messages",  sub: '"Your assignment is due Monday..."', badge: "DETECTED", bc: "#818CF8", bb: "rgba(99,102,241,0.1)"  },
      { icon: "📨", bg: "rgba(34,197,94,0.1)",   title: "Emails & notices",   sub: "Fee notices, circulars, reminders", badge: "DETECTED", bc: "#22C55E", bb: "rgba(34,197,94,0.1)"  },
      { icon: "📄", bg: "rgba(245,158,11,0.1)",  title: "PDF documents",      sub: "Contracts, audit reports, forms",  badge: "PRO",      bc: "#F59E0B", bb: "rgba(245,158,11,0.1)" },
    ],
  },
  {
    icon: "🔔",
    title: "We remind you",
    desc: "Get notified 7 days, 3 days, and 1 day before every deadline. Never scramble at the last minute.",
    demo: [
      { icon: "⏰", bg: "rgba(239,68,68,0.1)",  title: "Day before reminder", sub: '"Fee due tomorrow — ₹24,500"',    badge: "URGENT",  bc: "#EF4444", bb: "rgba(239,68,68,0.1)"  },
      { icon: "📅", bg: "rgba(245,158,11,0.1)", title: "3 days before",       sub: '"Assignment due in 3 days"',      badge: "SOON",    bc: "#F59E0B", bb: "rgba(245,158,11,0.1)" },
      { icon: "🗓️", bg: "rgba(34,197,94,0.1)",  title: "Week reminder",       sub: '"7 days to audit filing"',        badge: "PLANNED", bc: "#22C55E", bb: "rgba(34,197,94,0.1)"  },
    ],
  },
];

const SAMPLE_DEADLINES = [
  { title: "College Fee Payment",        due_date: "2024-02-05",                                                              amount: 24500, confidence: 0.99 },
  { title: "CS301 Assignment Submission",due_date: new Date(Date.now() +  1 * 86400000).toISOString().split("T")[0],         amount: null,  confidence: 0.95 },
  { title: "GST Return — Q3",            due_date: "2025-01-20",                                                              amount: null,  confidence: 0.98 },
  { title: "Audit Report Submission",    due_date: new Date(Date.now() +  3 * 86400000).toISOString().split("T")[0],         amount: null,  confidence: 0.92 },
  { title: "Library Book Return",        due_date: new Date(Date.now() +  5 * 86400000).toISOString().split("T")[0],         amount: null,  confidence: 0.88 },
  { title: "Exam Registration",          due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],         amount: 500,   confidence: 0.91 },
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const { addDeadlines } = useDeadlines();
  const [step, setStep] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem("dp_onboarded", "true");
      addDeadlines(SAMPLE_DEADLINES as any);
      setShowNotif(true); // show notification prompt before dashboard
    }
  }

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{
      minHeight: "100dvh", background: "#09090B",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: "60px 24px 40px",
      display: "flex", flexDirection: "column",
    }}>

      {/* Progress dots — identical to HTML prototype */}
      <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "40px" }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            height: "6px", borderRadius: "3px",
            background: i <= step ? "#6366F1" : "#27272A",
            width: i === step ? "24px" : "6px",
            transition: "all 0.3s",
          }} />
        ))}
      </div>

      {/* Step icon */}
      <div key={step} style={{
        width: "72px", height: "72px", borderRadius: "20px",
        background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "32px", margin: "0 auto 24px",
        boxShadow: "0 0 40px rgba(99,102,241,0.1)",
        animation: "obIn 0.35s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        {s.icon}
      </div>

      <h2 style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: "26px", fontWeight: 400, color: "#FAFAFA",
        textAlign: "center", margin: "0 0 12px", letterSpacing: "-0.01em",
        animation: "obIn 0.35s cubic-bezier(0.22,1,0.36,1) 0.05s both",
      }}>
        {s.title}
      </h2>

      <p style={{
        fontSize: "14px", color: "#71717A", textAlign: "center",
        lineHeight: 1.65, marginBottom: "28px",
        animation: "obIn 0.35s cubic-bezier(0.22,1,0.36,1) 0.08s both",
      }}>
        {s.desc}
      </p>

      {/* Demo cards — identical style to HTML prototype */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        {s.demo.map((d, i) => (
          <div key={`${step}-${i}`} style={{
            display: "flex", alignItems: "center", gap: "12px",
            background: "#141417", border: "1px solid #27272A",
            borderRadius: "12px", padding: "12px 14px",
            animation: `obIn 0.35s cubic-bezier(0.22,1,0.36,1) ${0.12 + i * 0.07}s both`,
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: d.bg, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "16px", flexShrink: 0,
            }}>{d.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#FAFAFA" }}>{d.title}</div>
              <div style={{ fontSize: "11px", color: "#52525B", marginTop: "2px", fontFamily: "'DM Mono', monospace" }}>{d.sub}</div>
            </div>
            <span style={{
              fontSize: "10px", fontWeight: 700, fontFamily: "'DM Mono', monospace",
              padding: "2px 8px", borderRadius: "20px", flexShrink: 0,
              background: d.bb, color: d.bc,
            }}>{d.badge}</span>
          </div>
        ))}
      </div>

      {/* Next button */}
      <div style={{ marginTop: "32px" }}>
        <button onClick={next} style={{
          width: "100%", padding: "14px",
          background: "linear-gradient(135deg, #6366F1, #818CF8)",
          border: "none", borderRadius: "14px",
          color: "white", fontSize: "14px", fontWeight: 600,
          fontFamily: "inherit", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          boxShadow: "0 6px 24px rgba(99,102,241,0.35)",
        }}>
          {isLast ? "Let's get started →" : `Next · ${step + 1}/${STEPS.length}`}
        </button>

        <p onClick={() => {
          localStorage.setItem("dp_onboarded", "true");
          addDeadlines(SAMPLE_DEADLINES as any);
          setShowNotif(true);
        }} style={{
          textAlign: "center", marginTop: "14px",
          fontSize: "12px", color: "#3F3F46", cursor: "pointer",
        }}>
          Skip intro
        </p>
      </div>

      {showNotif && <NotificationPrompt onDone={() => navigate("/dashboard")} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes obIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// Note: import NotificationPrompt at top of file and add this state:
// const [showNotifPrompt, setShowNotifPrompt] = useState(false);
// Then in finish() set showNotifPrompt(true) before navigate
// And render: {showNotifPrompt && <NotificationPrompt onDone={() => navigate("/dashboard")} />}
