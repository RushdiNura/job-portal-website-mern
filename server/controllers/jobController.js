import asyncHandler from "express-async-handler";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import Application from "../models/Application.js";
import { recordEvent } from "../utils/analytics.js";

// @desc  Get jobs with search, filters, sort, pagination
// @route GET /api/jobs
// @access Public
export const getJobs = asyncHandler(async (req, res) => {
  const {
    keyword,
    location,
    type,
    experience,
    remote,
    salaryMin,
    salaryMax,
    category,
    sort = "newest",
    page = 1,
    limit = 10,
  } = req.query;

  const query = { status: "open" };

  if (keyword) {
    query.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { skills: { $regex: keyword, $options: "i" } },
      { category: { $regex: keyword, $options: "i" } },
    ];
  }

  if (location) query.location = { $regex: location, $options: "i" };
  if (type) query.type = type;
  if (experience) query.experience = experience;
  if (remote === "true") query.remote = true;
  if (category) query.category = { $regex: category, $options: "i" };

  if (salaryMin || salaryMax) {
    query.salaryMax = {};
    if (salaryMin) query.salaryMax.$gte = Number(salaryMin);
  }
  if (salaryMax) {
    query.salaryMin = { ...(query.salaryMin || {}), $lte: Number(salaryMax) };
  }

  let sortOption = { createdAt: -1 };
  if (sort === "salary_high") sortOption = { salaryMax: -1 };
  if (sort === "salary_low") sortOption = { salaryMin: 1 };
  if (sort === "oldest") sortOption = { createdAt: 1 };

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate("company", "name logoUrl location")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum),
    Job.countDocuments(query),
  ]);

  res.json({
    success: true,
    jobs,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    totalResults: total,
  });
});

// @desc  Get single job by id
// @route GET /api/jobs/:id
// @access Public
export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("company").populate("employer", "name email");

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  job.views += 1;
  await job.save();
  await recordEvent("job_viewed", { job: job._id, employer: job.employer });

  res.json({ success: true, job });
});

// @desc  Create a job posting
// @route POST /api/jobs
// @access Private/Employer
export const createJob = asyncHandler(async (req, res) => {
  const employer = req.user;

  if (!employer.company) {
    res.status(400);
    throw new Error("Please set up your company profile before posting jobs");
  }

  const {
    title,
    description,
    responsibilities,
    requirements,
    location,
    latitude,
    longitude,
    remote,
    salaryMin,
    salaryMax,
    currency,
    experience,
    type,
    category,
    skills,
  } = req.body;

  if (!title || !description || !location) {
    res.status(400);
    throw new Error("Title, description, and location are required");
  }

  const job = await Job.create({
    title,
    description,
    responsibilities: responsibilities || [],
    requirements: requirements || [],
    location,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    remote: !!remote,
    salaryMin: salaryMin || 0,
    salaryMax: salaryMax || 0,
    currency: currency || "USD",
    experience,
    type,
    category,
    skills: skills || [],
    company: employer.company,
    employer: employer._id,
  });

  res.status(201).json({ success: true, job });
});

// @desc  Update a job posting
// @route PUT /api/jobs/:id
// @access Private/Employer (owner only)
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (job.employer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  const fields = [
    "title", "description", "responsibilities", "requirements", "location",
    "latitude", "longitude", "remote", "salaryMin", "salaryMax", "currency",
    "experience", "type", "category", "skills", "status",
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) job[f] = req.body[f];
  });

  await job.save();
  res.json({ success: true, job });
});

// @desc  Delete a job posting
// @route DELETE /api/jobs/:id
// @access Private/Employer (owner only)
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (job.employer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to delete this job");
  }

  await Application.deleteMany({ job: job._id });
  await job.deleteOne();

  res.json({ success: true, message: "Job deleted successfully" });
});

// @desc  Get jobs posted by the logged-in employer
// @route GET /api/jobs/employer/mine
// @access Private/Employer
export const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ employer: req.user._id })
    .populate("company", "name logoUrl")
    .sort({ createdAt: -1 });

  res.json({ success: true, jobs });
});

// @desc  Toggle save/unsave job for a seeker
// @route POST /api/jobs/:id/save
// @access Private/Seeker
export const toggleSaveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const user = req.user;
  const idx = user.savedJobs.findIndex((j) => j.toString() === job._id.toString());
  let saved;
  if (idx > -1) {
    user.savedJobs.splice(idx, 1);
    saved = false;
  } else {
    user.savedJobs.push(job._id);
    saved = true;
  }
  await user.save();
  await recordEvent(saved ? "job_saved" : "job_unsaved", { job: job._id, employer: job.employer, actor: user._id });

  res.json({ success: true, saved });
});

// @desc  Get saved jobs for logged-in seeker
// @route GET /api/jobs/saved/mine
// @access Private/Seeker
export const getSavedJobs = asyncHandler(async (req, res) => {
  const user = await req.user.populate({
    path: "savedJobs",
    populate: { path: "company", select: "name logoUrl location" },
  });
  res.json({ success: true, jobs: user.savedJobs });
});
