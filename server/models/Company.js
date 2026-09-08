import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: [true, "Company name is required"], trim: true },
    logoUrl: { type: String, default: "" },
    website: { type: String, default: "" },
    industry: { type: String, default: "" },
    size: { type: String, default: "" },
    location: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
