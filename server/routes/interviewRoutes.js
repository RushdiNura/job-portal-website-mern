import express from "express";
import { scheduleInterview, getMyInterviews, updateInterview } from "../controllers/interviewController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, authorize("employer"), scheduleInterview);
router.get("/mine", protect, getMyInterviews);
router.put("/:id", protect, updateInterview);

export default router;
