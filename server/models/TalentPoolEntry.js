import mongoose from "mongoose";

/**
 * An employer's private, saved roster of candidates - independent of any
 * specific job application. This is the core "recruitment CRM" behavior real
 * recruiters expect: you find someone promising in the talent database, save
 * them with notes and tags, and revisit them later regardless of whether
 * they've ever applied to one of your jobs.
 *
 * This is intentionally private per-employer (not shared across employers),
 * mirroring how a real ATS keeps each recruiting team's pipeline separate.
 */
const talentPoolEntrySchema = new mongoose.Schema(
  {
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String, trim: true }],
    notes: { type: String, default: "", maxlength: 4000 },
    stage: {
      type: String,
      enum: ["Prospect", "Contacted", "Interested", "Not a Fit"],
      default: "Prospect",
    },
  },
  { timestamps: true }
);

// One saved entry per employer/candidate pair - re-saving updates it instead
// of creating duplicates.
talentPoolEntrySchema.index({ employer: 1, candidate: 1 }, { unique: true });

export default mongoose.model("TalentPoolEntry", talentPoolEntrySchema);
