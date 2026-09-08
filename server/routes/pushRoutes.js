import express from "express";
import { getPushConfig, subscribe, unsubscribe, updatePreferences } from "../controllers/pushController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/config", getPushConfig);
router.post("/subscribe", protect, subscribe);
router.post("/unsubscribe", protect, unsubscribe);
router.put("/preferences", protect, updatePreferences);

export default router;
