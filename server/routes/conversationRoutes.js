import express from "express";
import {
  startConversation, getMyConversations, getMessages, sendMessage, markConversationRead,
} from "../controllers/conversationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/start", protect, startConversation);
router.get("/mine", protect, getMyConversations);
router.get("/:id/messages", protect, getMessages);
router.post("/:id/messages", protect, sendMessage);
router.put("/:id/read", protect, markConversationRead);

export default router;
