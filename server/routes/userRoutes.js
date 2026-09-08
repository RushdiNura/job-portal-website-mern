import express from "express";
import { updateProfile, uploadResume, changePassword } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.put("/me", protect, updateProfile);
router.post("/me/resume", protect, upload.single("resume"), uploadResume);
router.put("/me/password", protect, changePassword);

export default router;
