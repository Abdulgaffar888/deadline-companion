import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, ReminderInterval, DEFAULT_REMINDER_INTERVALS } from '@/types/task';
import { rescheduleAllReminders } from '@/services/notificationService';

interface TaskState {
  tasks: Task[];
  notificationsEnabled: boolean;
  reminderIntervals: ReminderInterval[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleNotifications: (enabled: boolean) => void;
  toggleReminderInterval: (intervalId: string, enabled: boolean) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      notificationsEnabled: true,
      reminderIntervals: DEFAULT_REMINDER_INTERVALS,

      addTask: (task) =>
        set((state) => {
          const tasks = [...state.tasks, task];
          rescheduleAllReminders(tasks, state.reminderIntervals, state.notificationsEnabled);
          return { tasks };
        }),

      updateTask: (id, updates) =>
        set((state) => {
          const tasks = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
          rescheduleAllReminders(tasks, state.reminderIntervals, state.notificationsEnabled);
          return { tasks };
        }),

      deleteTask: (id) =>
        set((state) => {
          const tasks = state.tasks.filter((t) => t.id !== id);
          rescheduleAllReminders(tasks, state.reminderIntervals, state.notificationsEnabled);
          return { tasks };
        }),

      toggleNotifications: (enabled) =>
        set((state) => {
          rescheduleAllReminders(state.tasks, state.reminderIntervals, enabled);
          return { notificationsEnabled: enabled };
        }),

      toggleReminderInterval: (intervalId, enabled) =>
        set((state) => {
          const reminderIntervals = state.reminderIntervals.map((r) =>
            r.id === intervalId ? { ...r, enabled } : r
          );
          rescheduleAllReminders(state.tasks, reminderIntervals, state.notificationsEnabled);
          return { reminderIntervals };
        }),
    }),
    { name: 'deadline-assistant-tasks' }
  )
);