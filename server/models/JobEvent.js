import mongoose from "mongoose";

// Real event log used to power analytics dashboards - never hardcode analytics numbers,
// always derive them from documents in this collection (plus Job/Application counts).
const jobEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "job_viewed",
        "job_saved",
        "job_unsaved",
        "application_submitted",
        "application_status_changed",
        "interview_scheduled",
      ],
      required: true,
    },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

jobEventSchema.index({ type: 1, createdAt: -1 });
jobEventSchema.index({ employer: 1, type: 1 });
jobEventSchema.index({ job: 1, type: 1 });

export default mongoose.model("JobEvent", jobEventSchema);
