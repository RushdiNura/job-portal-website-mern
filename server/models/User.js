import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: { type: String, required: [true, "Password is required"], minlength: 6, select: false },
    role: { type: String, enum: ["seeker", "employer", "admin"], required: true },
    isActive: { type: Boolean, default: true },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },

    // Job-search preferences, used by the recommendation engine
    preferredJobTypes: [{ type: String }],
    preferredLocation: { type: String, default: "" },
    remotePreference: { type: String, enum: ["any", "remote", "hybrid", "onsite"], default: "any" },

    // Talent Database fields (seekers only). A candidate only appears in the
    // employer-facing talent search when discoverable=true - this is an
    // explicit opt-in, never a default-on dark pattern. Non-discoverable
    // candidates remain fully visible to employers they've actually applied to.
    discoverable: { type: Boolean, default: false },
    experienceLevel: {
      type: String,
      enum: ["Entry Level", "1-2 Years", "3-5 Years", "5+ Years", "Senior"],
      default: "Entry Level",
    },
    availability: {
      type: String,
      enum: ["Immediately", "2 Weeks Notice", "1 Month Notice", "Not Looking"],
      default: "Immediately",
    },

    notificationPrefs: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    pushSubscriptions: [{ type: mongoose.Schema.Types.Mixed }],

    // Seeker-specific fields
    headline: { type: String, default: "" },
    skills: [{ type: String }],
    resumeUrl: { type: String, default: "" },
    resumeFileName: { type: String, default: "" },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],

    // Employer-specific fields
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

// Powers talent-database search: keyword search across skills/headline for
// discoverable candidates, plus a compound index for the common filter combo.
userSchema.index({ skills: "text", headline: "text" });
userSchema.index({ role: 1, discoverable: 1, experienceLevel: 1 });

export default mongoose.model("User", userSchema);