// ── Web Push Notification Hook ─────────────────────────
// Works as a website on Android Chrome + iOS 16.4+ (when added to home screen)

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string) {
  const padding  = '='.repeat((4 - base64String.length % 4) % 4);
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData  = window.atob(base64);
  const output   = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

export async function registerPushNotifications(): Promise<PushSubscription | null> {
  // Check browser support
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported in this browser');
    return null;
  }

  // Register service worker
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission denied');
    return null;
  }

  // Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Send subscription to your backend so it can send pushes later
  // TODO: uncomment when backend endpoint is ready
  // await fetch(`${import.meta.env.VITE_API_URL}/save-push-subscription`, {
  //   method:  'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body:    JSON.stringify(subscription),
  // });

  console.log('Push subscription active:', subscription.endpoint);
  return subscription;
}

// ── Send a local notification immediately (no server needed) ──
// Great for deadline reminders that are scheduled client-side
export async function sendLocalNotification(title: string, body: string, url = '/dashboard') {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  registration.showNotification(title, {
    body,
    icon:    '/icon-192.png',
    badge:   '/icon-192.png',
    tag:     'deadline-reminder',
    data:    { url },
  } as NotificationOptions);
}

// ── Schedule deadline reminders (runs on app open) ────
export function scheduleDeadlineReminders(deadlines: any[]) {
  const now = Date.now();

  deadlines.forEach(deadline => {
    if (!deadline.due_date) return;

    const dueMs   = new Date(deadline.due_date).getTime();
    const daysLeft = (dueMs - now) / (1000 * 60 * 60 * 24);

    // Remind at 7 days, 3 days, 1 day, day-of
    const checkpoints = [
      { days: 7, label: '7 days left'   },
      { days: 3, label: '3 days left'   },
      { days: 1, label: 'due tomorrow'  },
      { days: 0, label: 'due TODAY'     },
    ];

    checkpoints.forEach(({ days, label }) => {
      const diff = daysLeft - days;
      // If within 1 hour of a checkpoint, fire the notification
      if (diff >= 0 && diff < 0.04) {
        sendLocalNotification(
          `⏰ Deadline ${label}`,
          `"${deadline.title}" is ${label}.`,
          '/dashboard'
        );
      }
    });
  });
}
