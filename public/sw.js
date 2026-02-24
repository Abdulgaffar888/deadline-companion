// ── Service Worker for Web Push Notifications ──────────
// File: public/sw.js
// Handles push events and shows notifications on device

self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  const title   = data.title   || 'GRIK AI';
  const options = {
    body:    data.body    || 'You have a deadline coming up.',
    icon:    data.icon    || '/icon-192.png',
    badge:   data.badge   || '/icon-192.png',
    tag:     data.tag     || 'GRIK AI Reminder',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/' },
    actions: [
      { action: 'view',    title: '📅 View Deadline' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Activate immediately — don't wait for page refresh
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});
