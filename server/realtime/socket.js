import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";

let ioInstance = null;

export const getIO = () => ioInstance;

/**
 * Initializes Socket.IO on top of the existing HTTP server.
 *
 * Security: every socket connection must present a valid JWT (same token used
 * for REST auth) via the handshake `auth.token`. Unauthenticated sockets are
 * rejected. A socket may only join a conversation room after the server
 * verifies, on every join request, that the connected user is actually a
 * participant in that conversation (employer or candidate on the underlying
 * application) - this prevents any user from listening in on conversations
 * that are not theirs, even if they know or guess the conversation id.
 */
export const initSocket = (httpServer, clientUrl) => {
  ioInstance = new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) return next(new Error("Authentication required"));
      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error("Authentication required"));
    }
  });

  ioInstance.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on("join_conversation", async (conversationId, ack) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        const isParticipant =
          conversation &&
          [conversation.employer.toString(), conversation.candidate.toString()].includes(socket.userId);

        if (!isParticipant) {
          ack?.({ ok: false, error: "Not authorized for this conversation" });
          return;
        }
        socket.join(`conversation:${conversationId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: "Unable to join conversation" });
      }
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("typing", { userId: socket.userId, isTyping });
    });
  });

  return ioInstance;
};
