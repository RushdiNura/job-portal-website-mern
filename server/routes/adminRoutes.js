import express from "express";
import {
  getPlatformAnalytics, listUsers, setUserStatus, listAllJobs, setJobStatus,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/analytics", getPlatformAnalytics);
router.get("/users", listUsers);
router.put("/users/:id/status", setUserStatus);
router.get("/jobs", listAllJobs);
router.put("/jobs/:id/status", setJobStatus);

export default router;
