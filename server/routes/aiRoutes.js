import express from "express";
import { analyzeResume } from "../controllers/aiController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/analyze-resume", protect, authorize("seeker"), analyzeResume);

export default router;
