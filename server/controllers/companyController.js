import asyncHandler from "express-async-handler";
import Company from "../models/Company.js";

// @desc  Get logged-in employer's company profile
// @route GET /api/companies/mine
// @access Private/Employer
export const getMyCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ owner: req.user._id });
  if (!company) {
    res.status(404);
    throw new Error("Company profile not found");
  }
  res.json({ success: true, company });
});

// @desc  Update logged-in employer's company profile
// @route PUT /api/companies/mine
// @access Private/Employer
export const updateMyCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ owner: req.user._id });
  if (!company) {
    res.status(404);
    throw new Error("Company profile not found");
  }

  const fields = ["name", "logoUrl", "website", "industry", "size", "location", "description"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) company[f] = req.body[f];
  });

  await company.save();
  res.json({ success: true, company });
});

// @desc  Get a public company profile with its open jobs count
// @route GET /api/companies/:id
// @access Public
export const getCompanyById = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error("Company not found");
  }
  res.json({ success: true, company });
});
