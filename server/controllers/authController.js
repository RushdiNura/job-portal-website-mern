import crypto from "crypto";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Company from "../models/Company.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

// @desc  Register a new user (seeker or employer)
// @route POST /api/auth/register
// @access Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, companyName } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Please provide name, email, password, and role");
  }

  // Admin accounts are never created through public self-registration - this is a
  // deliberate security boundary. Admins are provisioned via the seed script or
  // promoted directly in the database by someone with infrastructure access.
  if (!["seeker", "employer"].includes(role)) {
    res.status(400);
    throw new Error("Role must be either 'seeker' or 'employer'");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({ name, email, password, role });

  if (role === "employer") {
    const company = await Company.create({
      owner: user._id,
      name: companyName || `${name}'s Company`,
    });
    user.company = company._id;
    await user.save();
  }

  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// @desc  Login user
// @route POST /api/auth/login
// @access Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated. Contact support for assistance.");
  }

  const token = generateToken(user._id, user.role);

  res.json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// @desc  Get logged-in user's profile
// @route GET /api/auth/me
// @access Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("company");
  res.json({ success: true, user: user.toSafeObject() });
});

// @desc  Forgot password - generates reset token
// @route POST /api/auth/forgot-password
// @access Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  // Always respond success to avoid leaking which emails are registered
  if (!user) {
    return res.json({ success: true, message: "If that email exists, a reset link has been sent" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "Password Reset Request",
    html: `<p>You requested a password reset. Click the link below (valid 30 minutes):</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  res.json({ success: true, message: "If that email exists, a reset link has been sent" });
});

// @desc  Reset password using token
// @route POST /api/auth/reset-password/:token
// @access Public
export const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }

  if (!req.body.password) {
    res.status(400);
    throw new Error("Please provide a new password");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user._id, user.role);

  res.json({ success: true, message: "Password reset successful", token });
});
