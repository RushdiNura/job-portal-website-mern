import mongoose from "mongoose";

// A conversation only ever exists because of a real application - this is the
// authorization boundary. There is exactly one conversation per application,
// so a candidate can never message an employer they haven't applied to, and an
// employer can never message a candidate who hasn't applied to one of their jobs.
const conversationSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, unique: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: "" },
  },
  { timestamps: true }
);

conversationSchema.index({ employer: 1, lastMessageAt: -1 });
conversationSchema.index({ candidate: 1, lastMessageAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
