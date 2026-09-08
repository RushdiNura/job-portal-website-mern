import express from "express";
import {
  getJobs, getJobById, createJob, updateJob, deleteJob,
  getMyJobs, toggleSaveJob, getSavedJobs,
} from "../controllers/jobController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getJobs);
router.get("/employer/mine", protect, authorize("employer"), getMyJobs);
router.get("/saved/mine", protect, authorize("seeker"), getSavedJobs);
router.get("/:id", getJobById);
router.post("/", protect, authorize("employer"), createJob);
router.put("/:id", protect, authorize("employer"), updateJob);
router.delete("/:id", protect, authorize("employer"), deleteJob);
router.post("/:id/save", protect, authorize("seeker"), toggleSaveJob);

export default router;
