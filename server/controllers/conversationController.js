import asyncHandler from "express-async-handler";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import { getIO } from "../realtime/socket.js";

// @desc  Start (or fetch existing) conversation for an application
// @route POST /api/conversations/start
// @access Private (must be the applicant or the hiring employer on that application)
export const startConversation = asyncHandler(async (req, res) => {
  const { applicationId } = req.body;
  if (!applicationId) {
    res.status(400);
    throw new Error("applicationId is required");
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  const userId = req.user._id.toString();
  const isApplicant = application.applicant.toString() === userId;
  const isEmployer = application.employer.toString() === userId;
  if (!isApplicant && !isEmployer) {
    res.status(403);
    throw new Error("You are not part of this application and cannot start this conversation");
  }

  let conversation = await Conversation.findOne({ application: application._id });
  if (!conversation) {
    conversation = await Conversation.create({
      application: application._id,
      job: application.job,
      employer: application.employer,
      candidate: application.applicant,
    });
  }

  res.status(201).json({ success: true, conversation });
});

// @desc  List conversations for the logged-in user
// @route GET /api/conversations/mine
// @access Private
export const getMyConversations = asyncHandler(async (req, res) => {
  const filter = req.user.role === "employer" ? { employer: req.user._id } : { candidate: req.user._id };

  const conversations = await Conversation.find(filter)
    .populate("job", "title")
    .populate("employer", "name")
    .populate("candidate", "name")
    .sort({ lastMessageAt: -1 });

  // Real unread counts - never fake.
  const withUnread = await Promise.all(
    conversations.map(async (c) => {
      const unreadCount = await Message.countDocuments({
        conversation: c._id,
        sender: { $ne: req.user._id },
        read: false,
      });
      return { ...c.toObject(), unreadCount };
    })
  );

  res.json({ success: true, conversations: withUnread });
});

const assertParticipant = (conversation, userId) => {
  const uid = userId.toString();
  return conversation.employer.toString() === uid || conversation.candidate.toString() === uid;
};

// @desc  Get messages for a conversation
// @route GET /api/conversations/:id/messages
// @access Private (participants only)
export const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }
  if (!assertParticipant(conversation, req.user._id)) {
    res.status(403);
    throw new Error("You do not have access to this conversation");
  }

  const messages = await Message.find({ conversation: conversation._id })
    .populate("sender", "name role")
    .sort({ createdAt: 1 })
    .limit(200);

  res.json({ success: true, messages });
});

// @desc  Send a message in a conversation
// @route POST /api/conversations/:id/messages
// @access Private (participants only)
export const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Message text is required");
  }

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }
  if (!assertParticipant(conversation, req.user._id)) {
    res.status(403);
    throw new Error("You do not have access to this conversation");
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: text.trim(),
  });

  conversation.lastMessageAt = new Date();
  conversation.lastMessagePreview = text.trim().slice(0, 140);
  await conversation.save();

  const recipientId = conversation.employer.toString() === req.user._id.toString()
    ? conversation.candidate
    : conversation.employer;

  await Notification.create({
    user: recipientId,
    type: "message",
    title: "New message",
    message: `${req.user.name}: ${message.text.slice(0, 80)}`,
    link: `/messages/${conversation._id}`,
  });

  // Real-time push to the conversation room, if Socket.IO is initialized.
  const io = getIO();
  if (io) {
    const populated = await message.populate("sender", "name role");
    io.to(`conversation:${conversation._id}`).emit("new_message", populated);
    io.to(`user:${recipientId}`).emit("notification", { type: "message", conversationId: conversation._id });
  }

  res.status(201).json({ success: true, message });
});

// @desc  Mark all messages in a conversation as read
// @route PUT /api/conversations/:id/read
// @access Private (participants only)
export const markConversationRead = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }
  if (!assertParticipant(conversation, req.user._id)) {
    res.status(403);
    throw new Error("You do not have access to this conversation");
  }

  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: req.user._id }, read: false },
    { read: true }
  );

  res.json({ success: true });
});
