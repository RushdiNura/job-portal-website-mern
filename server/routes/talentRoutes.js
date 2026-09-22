import express from "express";
import {
  searchTalent, getTalentProfile, saveToTalentPool, removeFromTalentPool, getMyTalentPool,
} from "../controllers/talentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, authorize("employer"));

router.get("/pool/mine", getMyTalentPool);
router.get("/", searchTalent);
router.get("/:id", getTalentProfile);
router.post("/pool/:candidateId", saveToTalentPool);
router.delete("/pool/:candidateId", removeFromTalentPool);

export default router;
