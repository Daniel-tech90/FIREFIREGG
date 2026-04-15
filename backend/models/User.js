import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String, default: "" },
  method: { type: String, default: "Email" },
  status: { type: String, enum: ["active", "banned"], default: "active" },
  whatsapp: { type: String, default: "" },
  prizeStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  prizeNote: { type: String, default: "" },
  ffUid: { type: String, default: "" },
  ffName: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
