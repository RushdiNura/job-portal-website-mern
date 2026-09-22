import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Application from "../models/Application.js";
import TalentPoolEntry from "../models/TalentPoolEntry.js";

// @desc  Search the talent database - only discoverable candidates appear here.
//        This is a deliberate privacy boundary: opting into discoverability is
//        an explicit candidate choice (see PUT /api/users/me), never a default.
// @route GET /api/talent
// @access Private/Employer
export const searchTalent = asyncHandler(async (req, res) => {
  const { keyword, skills, experienceLevel, location, availability, page = 1, limit = 12 } = req.query;

  const query = { role: "seeker", discoverable: true };

  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { headline: { $regex: keyword, $options: "i" } },
      { skills: { $regex: keyword, $options: "i" } },
    ];
  }
  if (skills) {
    const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (skillList.length) query.skills = { $in: skillList.map((s) => new RegExp(`^${s}$`, "i")) };
  }
  if (experienceLevel) query.experienceLevel = experienceLevel;
  if (location) query.location = { $regex: location, $options: "i" };
  if (availability) query.availability = availability;

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 12, 1), 50);

  const [candidates, total] = await Promise.all([
    User.find(query)
      .select("name headline skills experienceLevel availability location avatarUrl createdAt")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  // Flag which of these are already saved to this employer's talent pool, so
  // the UI can show "Saved" instead of "Add to pool" without a second round trip.
  const savedIds = new Set(
    (await TalentPoolEntry.find({ employer: req.user._id, candidate: { $in: candidates.map((c) => c._id) } }).distinct("candidate")).map(String)
  );

  res.json({
    success: true,
    candidates: candidates.map((c) => ({ ...c.toObject(), savedToPool: savedIds.has(c._id.toString()) })),
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    totalResults: total,
  });
});

// @desc  View a candidate's talent profile. Resume file is deliberately never
//        exposed here - only through a legitimate application (protects
//        candidate privacy for people who are discoverable but haven't
//        applied anywhere with this employer).
// @route GET /api/talent/:id
// @access Private/Employer
export const getTalentProfile = asyncHandler(async (req, res) => {
  const candidate = await User.findOne({ _id: req.params.id, role: "seeker" })
    .select("name email phone headline skills experienceLevel availability location avatarUrl discoverable createdAt");

  if (!candidate) {
    res.status(404);
    throw new Error("Candidate not found");
  }

  // Visible if discoverable, OR if this employer already has a legitimate
  // application relationship with them (they applied to one of my jobs).
  const hasApplied = await Application.exists({ applicant: candidate._id, employer: req.user._id });
  if (!candidate.discoverable && !hasApplied) {
    res.status(403);
    throw new Error("This candidate has not opted into the talent database");
  }

  res.json({ success: true, candidate });
});

// @desc  Save (or update) a candidate in the employer's private talent pool
// @route POST /api/talent/pool/:candidateId
// @access Private/Employer
export const saveToTalentPool = asyncHandler(async (req, res) => {
  const candidate = await User.findOne({ _id: req.params.candidateId, role: "seeker" });
  if (!candidate) {
    res.status(404);
    throw new Error("Candidate not found");
  }

  const hasApplied = await Application.exists({ applicant: candidate._id, employer: req.user._id });
  if (!candidate.discoverable && !hasApplied) {
    res.status(403);
    throw new Error("This candidate has not opted into the talent database");
  }

  const { tags, notes, stage } = req.body;

  const entry = await TalentPoolEntry.findOneAndUpdate(
    { employer: req.user._id, candidate: candidate._id },
    {
      $set: {
        ...(tags !== undefined ? { tags } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(stage !== undefined ? { stage } : {}),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ success: true, entry });
});

// @desc  Remove a candidate from the employer's talent pool
// @route DELETE /api/talent/pool/:candidateId
// @access Private/Employer
export const removeFromTalentPool = asyncHandler(async (req, res) => {
  await TalentPoolEntry.deleteOne({ employer: req.user._id, candidate: req.params.candidateId });
  res.json({ success: true });
});

// @desc  Get the employer's saved talent pool
// @route GET /api/talent/pool/mine
// @access Private/Employer
export const getMyTalentPool = asyncHandler(async (req, res) => {
  const entries = await TalentPoolEntry.find({ employer: req.user._id })
    .populate("candidate", "name email phone headline skills experienceLevel availability location avatarUrl")
    .sort({ updatedAt: -1 });

  res.json({ success: true, entries });
});
