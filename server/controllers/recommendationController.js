import asyncHandler from "express-async-handler";
import Job from "../models/Job.js";
import Application from "../models/Application.js";

/**
 * Job recommendations are computed with a transparent, explainable scoring
 * algorithm over real candidate + job data - never randomized or hardcoded.
 * No protected characteristics (age, gender, race, religion, etc.) are used
 * as inputs; scoring is based only on skills, experience level, location
 * preference, remote preference, and job type preference.
 */
const scoreJob = (job, candidate) => {
  let score = 0;
  const reasons = [];

  const candidateSkills = (candidate.skills || []).map((s) => s.toLowerCase());
  const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
  const matchedSkills = jobSkills.filter((s) => candidateSkills.includes(s));
  if (matchedSkills.length > 0) {
    score += matchedSkills.length * 20;
    reasons.push(`Matches ${matchedSkills.length} of your skills: ${matchedSkills.join(", ")}`);
  }

  if (candidate.headline) {
    const headline = candidate.headline.toLowerCase();
    if (job.title.toLowerCase().includes(headline) || headline.includes(job.category?.toLowerCase() || "")) {
      score += 15;
      reasons.push(`Matches your role focus: "${candidate.headline}"`);
    }
  }

  if (candidate.preferredJobTypes?.length && candidate.preferredJobTypes.includes(job.type)) {
    score += 10;
    reasons.push(`Job type (${job.type}) matches your preference`);
  }

  if (candidate.remotePreference === "remote" && job.remote) {
    score += 10;
    reasons.push("Remote position matches your preference");
  }

  if (candidate.preferredLocation && job.location.toLowerCase().includes(candidate.preferredLocation.toLowerCase())) {
    score += 10;
    reasons.push(`Located in your preferred area: ${candidate.preferredLocation}`);
  } else if (candidate.location && job.location.toLowerCase().includes(candidate.location.toLowerCase())) {
    score += 5;
    reasons.push(`Near your current location: ${candidate.location}`);
  }

  return { score, reasons };
};

// @desc  Get personalized, explainable job recommendations for the logged-in seeker
// @route GET /api/recommendations
// @access Private/Seeker
export const getRecommendations = asyncHandler(async (req, res) => {
  const candidate = req.user;

  const alreadyApplied = await Application.find({ applicant: candidate._id }).distinct("job");
  const excludeIds = new Set([...alreadyApplied.map(String), ...(candidate.savedJobs || []).map(String)]);

  const openJobs = await Job.find({ status: "open" })
    .populate("company", "name logoUrl")
    .limit(300); // reasonable ceiling to keep scoring cheap; real deployments would pre-filter by category/location in the query

  const scored = openJobs
    .filter((job) => !excludeIds.has(job._id.toString()))
    .map((job) => {
      const { score, reasons } = scoreJob(job, candidate);
      return { job, score, reasons };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  res.json({
    success: true,
    recommendations: scored.map((r) => ({
      job: r.job,
      score: r.score,
      reasons: r.reasons,
    })),
  });
});
