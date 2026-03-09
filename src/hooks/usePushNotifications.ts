// ── Web Push Notification Hook ─────────────────────────────────
// Updated: saves subscription to backend for server-side push

import { savePushSubscription, deletePushSubscription } from '@/lib/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output  = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

export async function registerPushNotifications(userId: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission denied');
    return null;
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // ── Save to backend so server-side push works ──
  try {
    await savePushSubscription(userId, subscription);
    console.log('[GRIK AI] Push subscription saved to backend');
  } catch (e) {
    console.error('[GRIK AI] Failed to save subscription to backend:', e);
  }

  return subscription;
}

export async function unregisterPushNotifications(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await deletePushSubscription(subscription.endpoint);
    await subscription.unsubscribe();
    console.log('[GRIK AI] Push subscription removed');
  }
}

// ── Local notification (instant, no server needed) ────────────
export async function sendLocalNotification(title: string, body: string, url = '/dashboard') {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  registration.showNotification(title, {
    body,
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    tag:   'deadline-reminder',
    data:  { url },
  } as NotificationOptions);
}