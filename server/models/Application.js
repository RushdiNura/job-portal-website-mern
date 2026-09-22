import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resumeUrl: { type: String, required: true },
    resumeFileName: { type: String, default: "" },
    coverLetter: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "Applied",
        "Under Review",
        "Shortlisted",
        "Interview Scheduled",
        "Offer",
        "Hired",
        "Rejected",
        "Withdrawn",
      ],
      default: "Applied",
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // AI Screening result, computed automatically the moment a candidate
    // applies (see utils/screening.js). This is the core of the platform's
    // "AI Screening" positioning - it is never fabricated: `aiGenerated`
    // tells the truth about whether a real LLM call produced `summary`, or
    // whether it's the deterministic skill-match algorithm's own summary.
    screening: {
      score: { type: Number, default: null, min: 0, max: 100 },
      matchedSkills: [{ type: String }],
      missingSkills: [{ type: String }],
      summary: { type: String, default: "" },
      aiGenerated: { type: Boolean, default: false },
      computedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Prevent duplicate applications: one applicant can apply to a job only once
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ employer: 1, "screening.score": -1 });

export default mongoose.model("Application", applicationSchema);
