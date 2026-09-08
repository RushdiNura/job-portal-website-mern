import asyncHandler from "express-async-handler";
import path from "path";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Notification from "../models/Notification.js";
import sendEmail from "../utils/sendEmail.js";
import { recordEvent } from "../utils/analytics.js";

// @desc  Apply for a job (with resume upload)
// @route POST /api/applications/:jobId
// @access Private/Seeker
export const applyForJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (job.status !== "open") {
    res.status(400);
    throw new Error("This job is no longer accepting applications");
  }

  const existing = await Application.findOne({ job: job._id, applicant: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error("You have already applied for this job");
  }

  let resumeUrl = req.user.resumeUrl;
  let resumeFileName = req.user.resumeFileName;

  if (req.file) {
    resumeUrl = `/uploads/resumes/${req.file.filename}`;
    resumeFileName = req.file.originalname;
  }

  if (!resumeUrl) {
    res.status(400);
    throw new Error("A resume is required. Upload one or add it to your profile first.");
  }

  const application = await Application.create({
    job: job._id,
    applicant: req.user._id,
    employer: job.employer,
    resumeUrl,
    resumeFileName,
    coverLetter: req.body.coverLetter || "",
    statusHistory: [{ status: "Applied" }],
  });

  job.applicantsCount += 1;
  await job.save();

  await Notification.create({
    user: job.employer,
    type: "new_applicant",
    title: "New job application",
    message: `${req.user.name} applied for ${job.title}`,
    link: `/employer/jobs/${job._id}/applicants`,
  });

  await recordEvent("application_submitted", { job: job._id, application: application._id, actor: req.user._id });

  try {
    const employer = await job.populate("employer", "name email");
    await sendEmail({
      to: employer.employer.email,
      subject: `New application: ${job.title}`,
      html: `<p>${req.user.name} just applied for <strong>${job.title}</strong>.</p>`,
    });
  } catch (err) {
    console.error("Email notification failed (non-fatal):", err.message);
  }

  res.status(201).json({ success: true, application });
});

// @desc  Get applications submitted by the logged-in seeker
// @route GET /api/applications/mine
// @access Private/Seeker
export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate({
      path: "job",
      populate: { path: "company", select: "name logoUrl location" },
    })
    .sort({ createdAt: -1 });

  res.json({ success: true, applications });
});

// @desc  Get applicants for a specific job (employer)
// @route GET /api/applications/job/:jobId
// @access Private/Employer
export const getApplicantsForJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }
  if (job.employer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to view these applicants");
  }

  const applications = await Application.find({ job: job._id })
    .populate("applicant", "name email phone location skills headline resumeUrl")
    .sort({ createdAt: -1 });

  res.json({ success: true, applications });
});

// @desc  Get all applicants across all of an employer's jobs
// @route GET /api/applications/employer/all
// @access Private/Employer
export const getAllApplicantsForEmployer = asyncHandler(async (req, res) => {
  const applications = await Application.find({ employer: req.user._id })
    .populate("applicant", "name email phone skills headline resumeUrl")
    .populate("job", "title location type")
    .sort({ createdAt: -1 });

  res.json({ success: true, applications });
});

// @desc  Update application status (employer)
// @route PUT /api/applications/:id/status
// @access Private/Employer
const VALID_STATUSES = [
  "Applied", "Under Review", "Shortlisted", "Interview Scheduled",
  "Offer", "Hired", "Rejected", "Withdrawn",
];

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    res.status(400);
    throw new Error("Invalid status value");
  }

  const application = await Application.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  if (application.employer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to update this application");
  }

  application.status = status;
  application.statusHistory.push({ status });
  await application.save();

  const job = await Job.findById(application.job);

  await Notification.create({
    user: application.applicant,
    type: "application_status",
    title: "Application status updated",
    message: `Your application for ${job ? job.title : "a job"} is now: ${status}`,
    link: `/seeker/applications`,
  });

  await recordEvent("application_status_changed", { job: job?._id, application: application._id, meta: { status } });

  // Email is best-effort: a failure here must never fail the status update itself
  try {
    const applicant = await application.populate("applicant", "name email");
    await sendEmail({
      to: applicant.applicant.email,
      subject: `Your application status changed: ${status}`,
      html: `<p>Hi ${applicant.applicant.name},</p><p>Your application for <strong>${job ? job.title : "a job"}</strong> is now: <strong>${status}</strong>.</p>`,
    });
  } catch (err) {
    console.error("Email notification failed (non-fatal):", err.message);
  }

  res.json({ success: true, application });
});

// @desc  Candidate withdraws their own application
// @route PUT /api/applications/:id/withdraw
// @access Private/Seeker
export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }
  if (application.applicant.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to withdraw this application");
  }
  if (["Hired", "Rejected", "Withdrawn"].includes(application.status)) {
    res.status(400);
    throw new Error(`Cannot withdraw an application that is already ${application.status}`);
  }

  application.status = "Withdrawn";
  application.statusHistory.push({ status: "Withdrawn" });
  await application.save();

  res.json({ success: true, application });
});

// @desc  Download a resume file (employer viewing an applicant's resume)
// @route GET /api/applications/:id/resume
// @access Private/Employer
export const downloadResume = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }
  if (application.employer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to access this resume");
  }

  const filePath = path.resolve("." + application.resumeUrl);
  res.download(filePath, application.resumeFileName || "resume");
});
