// Minimal service worker for Web Push notifications.
// Registered from src/services/push.js — enablePushNotifications().

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "JobNest", message: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "JobNest", {
      body: payload.message || "",
      icon: "/briefcase.svg",
      badge: "/briefcase.svg",
      data: { link: payload.link || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(clients.openWindow(link));
});
