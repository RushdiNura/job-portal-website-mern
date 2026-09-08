import express from "express";
import { getRecommendations } from "../controllers/recommendationController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, authorize("seeker"), getRecommendations);

export default router;
