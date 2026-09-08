import express from "express";
import { getMyCompany, updateMyCompany, getCompanyById } from "../controllers/companyController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/mine", protect, authorize("employer"), getMyCompany);
router.put("/mine", protect, authorize("employer"), updateMyCompany);
router.get("/:id", getCompanyById);

export default router;
