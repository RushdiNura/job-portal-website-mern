import asyncHandler from "express-async-handler";
import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import sendEmail from "../utils/sendEmail.js";
import { createVideoMeeting } from "../utils/videoMeeting.js";
import { recordEvent } from "../utils/analytics.js";

// Overlap check: does [startA, endA) intersect [startB, endB)?
const overlaps = (startA, endA, startB, endB) => startA < endB && startB < endA;

// Backend conflict validation - checked for BOTH the employer and the candidate,
// since either side double-booked is a real scheduling conflict. This is the
// authoritative check; the frontend may also warn, but this is what's enforced.
const hasConflict = async ({ employer, candidate, scheduledAt, durationMinutes, excludeId }) => {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  // Look at same-day interviews for either party to keep the query cheap, then
  // check exact overlap in JS.
  const dayStart = new Date(start); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(start); dayEnd.setHours(23, 59, 59, 999);

  const query = {
    scheduledAt: { $gte: dayStart, $lte: dayEnd },
    status: { $in: ["Scheduled", "Confirmed", "Rescheduled"] },
    $or: [{ employer }, { candidate }],
  };
  if (excludeId) query._id = { $ne: excludeId };

  const candidates = await Interview.find(query);
  return candidates.some((iv) => {
    const ivStart = new Date(iv.scheduledAt);
    const ivEnd = new Date(ivStart.getTime() + iv.durationMinutes * 60000);
    return overlaps(start, end, ivStart, ivEnd);
  });
};

// @desc  Schedule an interview for an application
// @route POST /api/interviews
// @access Private/Employer
export const scheduleInterview = asyncHandler(async (req, res) => {
  const { applicationId, scheduledAt, durationMinutes = 30, type = "Video", location = "", notes = "" } = req.body;

  if (!applicationId || !scheduledAt) {
    res.status(400);
    throw new Error("applicationId and scheduledAt are required");
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
    res.status(400);
    throw new Error("scheduledAt must be a valid future date/time");
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }
  if (application.employer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to schedule interviews for this application");
  }

  const conflict = await hasConflict({
    employer: application.employer,
    candidate: application.applicant,
    scheduledAt: scheduledDate,
    durationMinutes,
  });
  if (conflict) {
    res.status(409);
    throw new Error("This time conflicts with an existing interview for the employer or candidate");
  }

  const { meetingUrl, meetingProvider } = type === "Video"
    ? await createVideoMeeting({ interviewId: applicationId, scheduledAt: scheduledDate, durationMinutes })
    : { meetingUrl: "", meetingProvider: "" };

  const interview = await Interview.create({
    application: application._id,
    job: application.job,
    employer: application.employer,
    candidate: application.applicant,
    scheduledAt: scheduledDate,
    durationMinutes,
    type,
    location,
    notes,
    meetingUrl,
    meetingProvider,
  });

  application.status = "Interview Scheduled";
  application.statusHistory.push({ status: "Interview Scheduled" });
  await application.save();

  await Notification.create({
    user: application.applicant,
    type: "interview",
    title: "Interview scheduled",
    message: `An interview has been scheduled for ${scheduledDate.toLocaleString()}`,
    link: "/seeker/interviews",
  });

  await recordEvent("interview_scheduled", { job: application.job, application: application._id, employer: application.employer });

  try {
    const populated = await interview.populate("candidate", "name email");
    await sendEmail({
      to: populated.candidate.email,
      subject: "Interview scheduled",
      html: `<p>Your interview is scheduled for <strong>${scheduledDate.toLocaleString()}</strong> (${type}).</p>${notes ? `<p>Notes: ${notes}</p>` : ""}`,
    });
  } catch (err) {
    console.error("Email notification failed (non-fatal):", err.message);
  }

  res.status(201).json({ success: true, interview });
});

// @desc  Get interviews for the logged-in user (employer or candidate)
// @route GET /api/interviews/mine
// @access Private
export const getMyInterviews = asyncHandler(async (req, res) => {
  const filter = req.user.role === "employer" ? { employer: req.user._id } : { candidate: req.user._id };

  const interviews = await Interview.find(filter)
    .populate("job", "title location")
    .populate("candidate", "name email")
    .populate({ path: "application", select: "status" })
    .sort({ scheduledAt: 1 });

  res.json({ success: true, interviews });
});

// @desc  Update interview status (confirm / cancel / reschedule / complete)
// @route PUT /api/interviews/:id
// @access Private (employer who owns it, or candidate for confirm/cancel)
export const updateInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) {
    res.status(404);
    throw new Error("Interview not found");
  }

  const isEmployer = interview.employer.toString() === req.user._id.toString();
  const isCandidate = interview.candidate.toString() === req.user._id.toString();
  if (!isEmployer && !isCandidate) {
    res.status(403);
    throw new Error("You are not authorized to modify this interview");
  }

  const { status, scheduledAt, notes } = req.body;

  // Candidates may only confirm or cancel; only the employer may reschedule times or add notes.
  if (!isEmployer && status && !["Confirmed", "Cancelled"].includes(status)) {
    res.status(403);
    throw new Error("Candidates can only confirm or cancel an interview");
  }

  if (scheduledAt && isEmployer) {
    const newDate = new Date(scheduledAt);
    if (isNaN(newDate.getTime()) || newDate < new Date()) {
      res.status(400);
      throw new Error("scheduledAt must be a valid future date/time");
    }
    const conflict = await hasConflict({
      employer: interview.employer,
      candidate: interview.candidate,
      scheduledAt: newDate,
      durationMinutes: interview.durationMinutes,
      excludeId: interview._id,
    });
    if (conflict) {
      res.status(409);
      throw new Error("This time conflicts with an existing interview for the employer or candidate");
    }
    interview.scheduledAt = newDate;
    interview.status = "Rescheduled";
  }

  if (status) interview.status = status;
  if (notes !== undefined && isEmployer) interview.notes = notes;

  await interview.save();

  await Notification.create({
    user: isEmployer ? interview.candidate : interview.employer,
    type: "interview",
    title: "Interview updated",
    message: `Your interview has been updated: ${interview.status}`,
    link: isEmployer ? "/seeker/interviews" : "/employer/dashboard",
  });

  res.json({ success: true, interview });
});
