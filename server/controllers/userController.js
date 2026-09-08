import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// @desc  Update logged-in user's profile
// @route PUT /api/users/me
// @access Private
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const fields = ["name", "phone", "location", "headline", "skills", "avatarUrl"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) user[f] = req.body[f];
  });

  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

// @desc  Upload / update resume on profile
// @route POST /api/users/me/resume
// @access Private/Seeker
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload a resume file (PDF, DOC, or DOCX)");
  }

  const user = await User.findById(req.user._id);
  user.resumeUrl = `/uploads/resumes/${req.file.filename}`;
  user.resumeFileName = req.file.originalname;
  await user.save();

  res.json({ success: true, resumeUrl: user.resumeUrl, resumeFileName: user.resumeFileName });
});

// @desc  Change password
// @route PUT /api/users/me/password
// @access Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Please provide current and new password");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password updated successfully" });
});
