import { Task, ReminderInterval } from '@/types/task';
import { getReminderDates } from '@/utils/date';
import { format } from 'date-fns';
import { sendLocalNotification } from '@/hooks/usePushNotifications';

// ── Timeout registry — lets us cancel scheduled notifications ──
const scheduledTimeouts: Map<string, ReturnType<typeof setTimeout>[]> = new Map();

// ── Schedule reminders for a single task ──────────────────────
export function scheduleTaskReminders(task: Task, intervals: ReminderInterval[]): void {
  // Cancel any existing timers for this task first
  cancelTaskReminders(task.id);

  const enabledIntervals = intervals.filter((i) => i.enabled);
  if (!enabledIntervals.length) return;

  const enabledDays = enabledIntervals.map((i) => i.daysBefore);
  const reminderDates = getReminderDates(task.dueDate, enabledDays);
  const now = new Date();
  const timers: ReturnType<typeof setTimeout>[] = [];

  reminderDates.forEach((date, index) => {
    const msUntil = date.getTime() - now.getTime();
    if (msUntil <= 0) return; // already past

    const interval = enabledIntervals[index];
    const body = getReminderText(task, interval.daysBefore);

    console.log(
      `[GRIK AI] Scheduling: "${task.title}" → ${format(date, 'MMM d, h:mm a')} (in ${Math.round(msUntil / 60000)} min)`
    );

    const timer = setTimeout(() => {
      sendLocalNotification(`⏰ ${interval.label}`, body, '/dashboard');
    }, msUntil);

    timers.push(timer);
  });

  if (timers.length) {
    scheduledTimeouts.set(task.id, timers);
  }
}

// ── Cancel all timers for a task ──────────────────────────────
export function cancelTaskReminders(taskId: string): void {
  const timers = scheduledTimeouts.get(taskId);
  if (timers) {
    timers.forEach(clearTimeout);
    scheduledTimeouts.delete(taskId);
    console.log(`[GRIK AI] Cancelled reminders for task ${taskId}`);
  }
}

// ── Reschedule all tasks — call this on app load and when settings change ──
export function rescheduleAllReminders(tasks: Task[], intervals: ReminderInterval[], enabled: boolean): void {
  // Cancel everything first
  scheduledTimeouts.forEach((timers) => timers.forEach(clearTimeout));
  scheduledTimeouts.clear();

  if (!enabled) {
    console.log('[GRIK AI] Notifications disabled — all reminders cleared');
    return;
  }

  const activeTasks = tasks.filter((t) => !t.completed);
  console.log(`[GRIK AI] Rescheduling reminders for ${activeTasks.length} tasks`);
  activeTasks.forEach((task) => scheduleTaskReminders(task, intervals));
}

// ── Send a test notification immediately ──────────────────────
export async function sendTestNotification(): Promise<void> {
  const permission = Notification.permission;
  if (permission !== 'granted') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') {
      alert('Please allow notifications first.');
      return;
    }
  }
  await sendLocalNotification(
    '🪄 GRIK AI — Test',
    'Reminders are working! You\'ll be notified before every deadline.',
    '/dashboard'
  );
}

// ── Reminder body text ────────────────────────────────────────
function getReminderText(task: Task, daysBefore: number): string {
  const category = task.category?.toLowerCase() ?? 'task';
  if (daysBefore === 0) return `Today — ${category}: "${task.title}" is due now.`;
  if (daysBefore === 1) return `1 day left — ${category}: "${task.title}" is due tomorrow.`;
  return `${daysBefore} days left — ${category}: "${task.title}" is coming up.`;
}

// ── Upcoming reminders list (for Settings UI) ─────────────────
export function getUpcomingReminders(
  tasks: Task[],
  intervals: ReminderInterval[]
): { task: Task; date: Date; label: string }[] {
  const now = new Date();
  const reminders: { task: Task; date: Date; label: string }[] = [];

  tasks.forEach((task) => {
    if (task.completed) return;
    const enabledIntervals = intervals.filter((i) => i.enabled);
    const dates = getReminderDates(task.dueDate, enabledIntervals.map((i) => i.daysBefore));

    dates.forEach((date, i) => {
      if (date > now) {
        reminders.push({ task, date, label: enabledIntervals[i].label });
      }
    });
  });

  return reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
}