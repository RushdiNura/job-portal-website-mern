import asyncHandler from "express-async-handler";
import Notification from "../models/Notification.js";

// @desc  Get logged-in user's notifications
// @route GET /api/notifications
// @access Private
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, notifications });
});

// @desc  Mark a notification as read
// @route PUT /api/notifications/:id/read
// @access Private
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  notification.read = true;
  await notification.save();
  res.json({ success: true, notification });
});

// @desc  Mark all notifications as read
// @route PUT /api/notifications/read-all
// @access Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});
