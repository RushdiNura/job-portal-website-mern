import asyncHandler from "express-async-handler";
import { isPushConfigured } from "../utils/push.js";

// @desc  Get public VAPID key + whether push is configured on this server
// @route GET /api/push/config
// @access Public
export const getPushConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    configured: isPushConfigured(),
    publicKey: isPushConfigured() ? process.env.VAPID_PUBLIC_KEY : null,
  });
});

// @desc  Save a browser push subscription for the logged-in user
// @route POST /api/push/subscribe
// @access Private
export const subscribe = asyncHandler(async (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint) {
    res.status(400);
    throw new Error("A valid push subscription object is required");
  }

  const alreadyExists = req.user.pushSubscriptions.some((s) => s.endpoint === subscription.endpoint);
  if (!alreadyExists) {
    req.user.pushSubscriptions.push(subscription);
    await req.user.save();
  }

  res.json({ success: true });
});

// @desc  Remove a push subscription (e.g. user disabled notifications)
// @route POST /api/push/unsubscribe
// @access Private
export const unsubscribe = asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  req.user.pushSubscriptions = req.user.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
  await req.user.save();
  res.json({ success: true });
});

// @desc  Update notification preferences
// @route PUT /api/push/preferences
// @access Private
export const updatePreferences = asyncHandler(async (req, res) => {
  const { email, push } = req.body;
  if (email !== undefined) req.user.notificationPrefs.email = !!email;
  if (push !== undefined) req.user.notificationPrefs.push = !!push;
  await req.user.save();
  res.json({ success: true, notificationPrefs: req.user.notificationPrefs });
});
