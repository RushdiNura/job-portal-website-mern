import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Job title is required"], trim: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: [true, "Job description is required"] },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }],
    location: { type: String, required: true, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    remote: { type: Boolean, default: false },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    experience: {
      type: String,
      enum: ["Entry Level", "1-2 Years", "3-5 Years", "5+ Years", "Senior"],
      default: "Entry Level",
    },
    type: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Internship", "Contract"],
      default: "Full-Time",
    },
    category: { type: String, default: "General", trim: true },
    skills: [{ type: String }],
    status: { type: String, enum: ["open", "closed"], default: "open" },
    applicantsCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", description: "text", skills: "text", category: "text" });
jobSchema.index({ location: 1, type: 1, experience: 1, status: 1 });

export default mongoose.model("Job", jobSchema);
