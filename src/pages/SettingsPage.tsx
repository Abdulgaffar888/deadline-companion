import { useEffect } from 'react';
import { useTaskStore } from '@/stores/useTaskStore';
import { getUpcomingReminders, sendTestNotification, rescheduleAllReminders } from '@/services/notificationService';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function SettingsPage() {
  const {
    tasks,
    notificationsEnabled,
    reminderIntervals,
    toggleNotifications,
    toggleReminderInterval,
  } = useTaskStore();

  // Reschedule on app load / page mount (restores timers after refresh)
  useEffect(() => {
    rescheduleAllReminders(tasks, reminderIntervals, notificationsEnabled);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const upcomingReminders = notificationsEnabled
    ? getUpcomingReminders(tasks, reminderIntervals).slice(0, 10)
    : [];

  return (
    <div className="min-h-screen bg-app pb-28">

      {/* HEADER */}
      <div
        className="sticky top-0 z-20 px-4 pt-10 pb-4"
        style={{ background: "rgb(var(--bg))", borderBottom: "1px solid rgb(var(--border))" }}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ background: "rgb(var(--accent-2))", color: "rgb(var(--accent))" }}
          >
            GRIK AI
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-primary">Settings</h1>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* Notification master toggle */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2 px-0.5">
            Notifications
          </p>
          <div className="card px-3.5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{
                  background: notificationsEnabled ? "rgb(var(--accent-2))" : "rgb(var(--surface-2))",
                }}
              >
                {notificationsEnabled
                  ? <Bell size={15} style={{ color: "rgb(var(--accent))" }} />
                  : <BellOff size={15} className="text-muted" />
                }
              </div>
              <div>
                <Label htmlFor="notifications" className="text-sm font-medium text-primary cursor-pointer">
                  Push Notifications
                </Label>
                <p className="text-xs text-muted">
                  {notificationsEnabled ? "Active — you'll be reminded" : "Disabled"}
                </p>
              </div>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={toggleNotifications}
            />
          </div>
        </div>

        {/* Reminder intervals */}
        {notificationsEnabled && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2 px-0.5">
              Remind me before deadline
            </p>
            <div className="card divide-y" style={{ borderColor: "rgb(var(--border))" }}>
              {reminderIntervals.map((interval) => (
                <div key={interval.id} className="flex items-center justify-between px-3.5 py-3">
                  <Label htmlFor={interval.id} className="text-sm text-primary cursor-pointer">
                    {interval.label}
                  </Label>
                  <Switch
                    id={interval.id}
                    checked={interval.enabled}
                    onCheckedChange={v => toggleReminderInterval(interval.id, v)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test notification button */}
        {notificationsEnabled && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2 px-0.5">
              Test
            </p>
            <button
              onClick={sendTestNotification}
              className="card w-full px-3.5 py-3 flex items-center gap-3 text-left active:opacity-70 transition-opacity"
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgb(var(--accent-2))" }}
              >
                <Zap size={15} style={{ color: "rgb(var(--accent))" }} />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Send Test Notification</p>
                <p className="text-xs text-muted">Verify notifications are working</p>
              </div>
            </button>
          </div>
        )}

        {/* Upcoming reminders list */}
        {notificationsEnabled && upcomingReminders.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2 px-0.5 flex items-center gap-1.5">
              <Clock size={10} /> Scheduled Reminders
            </p>
            <div className="card divide-y" style={{ borderColor: "rgb(var(--border))" }}>
              {upcomingReminders.map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-3.5 py-3">
                  <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "rgb(var(--accent))" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{r.task.title}</p>
                    <p className="text-xs text-muted">{r.label}</p>
                  </div>
                  <span
                    className="text-[11px] font-mono flex-shrink-0"
                    style={{ color: "rgb(var(--text-3))" }}
                  >
                    {format(r.date, 'MMM d, h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* App info */}
        <div className="card px-3.5 py-3" style={{ marginTop: "24px" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">GRIK AI</p>
              <p className="text-xs text-muted">Version 1.0.0 · Built for compliance teams</p>
            </div>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ background: "rgb(var(--surface-2))", color: "rgb(var(--text-3))" }}
            >
              v1.0
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
