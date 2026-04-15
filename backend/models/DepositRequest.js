import mongoose from "mongoose";

const depositSchema = new mongoose.Schema({
  userId:        { type: String, required: true },
  userName:      { type: String, default: "" },
  userEmail:     { type: String, default: "" },
  amount:        { type: Number, required: true },
  screenshotUrl: { type: String, required: true },
  status:        { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  note:          { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("DepositRequest", depositSchema);
