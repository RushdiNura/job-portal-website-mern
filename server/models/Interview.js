import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30, min: 5, max: 480 },
    type: { type: String, enum: ["Video", "Phone", "In-Person"], default: "Video" },
    location: { type: String, default: "" }, // used for phone number / address / video note
    notes: { type: String, default: "" },

    // Video interview integration point. meetingUrl is only ever populated server-side
    // by a real provider integration (see utils/videoMeeting.js) - never fabricated.
    meetingUrl: { type: String, default: "" },
    meetingProvider: { type: String, default: "" },

    status: {
      type: String,
      enum: ["Scheduled", "Confirmed", "Rescheduled", "Cancelled", "Completed"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

interviewSchema.index({ employer: 1, scheduledAt: 1 });
interviewSchema.index({ candidate: 1, scheduledAt: 1 });

export default mongoose.model("Interview", interviewSchema);
