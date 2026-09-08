import express from "express";
import { getEmployerAnalytics } from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/employer", protect, authorize("employer"), getEmployerAnalytics);

export default router;
