// ─── swap this one line when your Render URL changes ───
const API_BASE = import.meta.env.VITE_API_URL ?? "https://grik-ai.onrender.com";

export async function analyzeText(content: string) {
  const res = await fetch(`${API_BASE}/analyze-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}

export async function analyzePDF(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/analyze-document`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}

// ── Add these functions to your existing src/lib/api.ts ──────────────────────
// Drop these into your existing api.ts file alongside the existing functions.

const API_URL = import.meta.env.VITE_API_URL;

// ── Save push subscription to backend ────────────────────────
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscription
): Promise<void> {
  const key = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');

  if (!key || !auth) throw new Error('Invalid push subscription keys');

  await fetch(`${API_URL}/save-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id:  userId,
      endpoint: subscription.endpoint,
      p256dh:   btoa(String.fromCharCode(...new Uint8Array(key))),
      auth:     btoa(String.fromCharCode(...new Uint8Array(auth))),
    }),
  });
}

// ── Delete push subscription from backend (on notifications disable) ──
export async function deletePushSubscription(endpoint: string): Promise<void> {
  await fetch(`${API_URL}/delete-subscription?endpoint=${encodeURIComponent(endpoint)}`, {
    method: 'DELETE',
  });
}

// ── Sync all deadlines to backend ────────────────────────────
// Call this after addTask, updateTask, deleteTask, toggleComplete
export async function syncDeadlines(
  userId: string,
  tasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    category?: string;
    completed?: boolean;
    reminderIntervals?: string; // e.g. "7,3,1,0"
  }>
): Promise<void> {
  const deadlines = tasks.map((t) => ({
    id:                 t.id,
    user_id:            userId,
    title:              t.title,
    due_date:           new Date(t.dueDate).toISOString(),
    category:           t.category ?? 'general',
    completed:          t.completed ?? false,
    reminder_intervals: t.reminderIntervals ?? '7,3,1,0',
  }));

  await fetch(`${API_URL}/sync-deadlines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, deadlines }),
  });
}