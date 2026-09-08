import webpush from "web-push";

/**
 * Web Push notification helper (VAPID-based, no third-party push service needed).
 *
 * Setup:
 *   1. Generate a VAPID key pair once:
 *        npx web-push generate-vapid-keys
 *   2. Put the keys in server/.env:
 *        VAPID_PUBLIC_KEY=...
 *        VAPID_PRIVATE_KEY=...
 *        VAPID_CONTACT_EMAIL=mailto:you@example.com
 *   3. The client subscribes via the browser Push API (see client push.js) and
 *      posts the subscription to POST /api/push/subscribe, which is stored on
 *      the user's `pushSubscriptions` array.
 *
 * If VAPID keys are not configured, sendPush() is a safe no-op - it will never
 * throw or block the calling code path (e.g. an application status change).
 */
let configured = false;

export const isPushConfigured = () => configured;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  configured = true;
}

export const sendPush = async (user, payload) => {
  if (!configured) return { sent: false, reason: "not_configured" };
  if (!user?.notificationPrefs?.push) return { sent: false, reason: "user_opted_out" };
  if (!user.pushSubscriptions?.length) return { sent: false, reason: "no_subscriptions" };

  const results = await Promise.allSettled(
    user.pushSubscriptions.map((sub) => webpush.sendNotification(sub, JSON.stringify(payload)))
  );

  // Best-effort cleanup of subscriptions the browser has revoked (410 Gone)
  const stillValid = user.pushSubscriptions.filter((_, i) => results[i].status === "fulfilled");
  if (stillValid.length !== user.pushSubscriptions.length) {
    user.pushSubscriptions = stillValid;
    await user.save();
  }

  return { sent: true, delivered: results.filter((r) => r.status === "fulfilled").length };
};
