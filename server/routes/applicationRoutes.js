import express from "express";
import {
  applyForJob, getMyApplications, getApplicantsForJob,
  getAllApplicantsForEmployer, updateApplicationStatus, downloadResume, withdrawApplication,
  rescreenApplication,
} from "../controllers/applicationController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/:jobId", protect, authorize("seeker"), upload.single("resume"), applyForJob);
router.get("/mine", protect, authorize("seeker"), getMyApplications);
router.get("/job/:jobId", protect, authorize("employer"), getApplicantsForJob);
router.get("/employer/all", protect, authorize("employer"), getAllApplicantsForEmployer);
router.put("/:id/status", protect, authorize("employer"), updateApplicationStatus);
router.put("/:id/withdraw", protect, authorize("seeker"), withdrawApplication);
router.get("/:id/resume", protect, authorize("employer"), downloadResume);
router.post("/:id/rescreen", protect, authorize("employer"), rescreenApplication);

export default router;
