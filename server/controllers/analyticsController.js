import asyncHandler from "express-async-handler";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Interview from "../models/Interview.js";
import JobEvent from "../models/JobEvent.js";

// @desc  Real, database-derived analytics for the logged-in employer
// @route GET /api/analytics/employer
// @access Private/Employer
export const getEmployerAnalytics = asyncHandler(async (req, res) => {
  const employerId = req.user._id;

  const [
    activeJobs,
    totalApplications,
    statusBreakdown,
    interviewCount,
    hiredCount,
    jobsWithCounts,
    viewEvents,
  ] = await Promise.all([
    Job.countDocuments({ employer: employerId, status: "open" }),
    Application.countDocuments({ employer: employerId }),
    Application.aggregate([
      { $match: { employer: employerId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Interview.countDocuments({ employer: employerId }),
    Application.countDocuments({ employer: employerId, status: "Hired" }),
    Job.find({ employer: employerId }).select("title applicantsCount views").sort({ applicantsCount: -1 }).limit(10),
    JobEvent.countDocuments({ employer: employerId, type: "job_viewed" }),
  ]);

  const statusMap = Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count]));
  const conversionRate = viewEvents > 0 ? Number(((totalApplications / viewEvents) * 100).toFixed(1)) : 0;

  res.json({
    success: true,
    analytics: {
      activeJobs,
      totalApplications,
      newApplications: statusMap["Applied"] || 0,
      shortlisted: statusMap["Shortlisted"] || 0,
      interviews: interviewCount,
      hires: hiredCount,
      totalViews: viewEvents,
      conversionRate,
      statusBreakdown: statusMap,
      applicationsPerJob: jobsWithCounts.map((j) => ({
        jobId: j._id,
        title: j.title,
        applicants: j.applicantsCount,
        views: j.views,
      })),
    },
  });
});
