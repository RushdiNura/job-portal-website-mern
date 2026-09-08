import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import Interview from "../models/Interview.js";

// @desc  Platform-wide analytics for admins - every figure is a real aggregation
// @route GET /api/admin/analytics
// @access Private/Admin
export const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const [
    candidateCount,
    employerCount,
    companyCount,
    jobCount,
    openJobCount,
    applicationCount,
    interviewCount,
    hiredCount,
    categoryBreakdown,
  ] = await Promise.all([
    User.countDocuments({ role: "seeker" }),
    User.countDocuments({ role: "employer" }),
    Company.countDocuments(),
    Job.countDocuments(),
    Job.countDocuments({ status: "open" }),
    Application.countDocuments(),
    Interview.countDocuments(),
    Application.countDocuments({ status: "Hired" }),
    Job.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  res.json({
    success: true,
    analytics: {
      candidates: candidateCount,
      employers: employerCount,
      companies: companyCount,
      jobs: jobCount,
      openJobs: openJobCount,
      applications: applicationCount,
      interviews: interviewCount,
      hires: hiredCount,
      popularCategories: categoryBreakdown.map((c) => ({ category: c._id || "Uncategorized", count: c.count })),
    },
  });
});

// @desc  List users with basic filtering (for user management)
// @route GET /api/admin/users
// @access Private/Admin
export const listUsers = asyncHandler(async (req, res) => {
  const { role, q, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, users, page: pageNum, totalPages: Math.ceil(total / limitNum) || 1, totalResults: total });
});

// @desc  Activate or deactivate a user account
// @route PUT /api/admin/users/:id/status
// @access Private/Admin
export const setUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") {
    res.status(400);
    throw new Error("isActive must be a boolean");
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.role === "admin") {
    res.status(403);
    throw new Error("Admin accounts cannot be deactivated through this endpoint");
  }

  user.isActive = isActive;
  await user.save();

  res.json({ success: true, user: user.toSafeObject() });
});

// @desc  List all jobs for moderation (including closed ones)
// @route GET /api/admin/jobs
// @access Private/Admin
export const listAllJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const [jobs, total] = await Promise.all([
    Job.find()
      .populate("company", "name")
      .populate("employer", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Job.countDocuments(),
  ]);

  res.json({ success: true, jobs, page: pageNum, totalPages: Math.ceil(total / limitNum) || 1, totalResults: total });
});

// @desc  Admin can close/reopen any job on the platform (moderation)
// @route PUT /api/admin/jobs/:id/status
// @access Private/Admin
export const setJobStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["open", "closed"].includes(status)) {
    res.status(400);
    throw new Error("status must be 'open' or 'closed'");
  }
  const job = await Job.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }
  job.status = status;
  await job.save();
  res.json({ success: true, job });
});
