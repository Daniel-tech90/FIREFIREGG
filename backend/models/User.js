import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: "" },
  avatar: { type: String, default: "" },
  method: { type: String, default: "Email" },
  status: { type: String, enum: ["active", "banned"], default: "active" },
  whatsapp: { type: String, default: "" },
  prizeStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  prizeNote: { type: String, default: "" },
  ffUid: { type: String, default: "" },
  ffName: { type: String, default: "" },
}, { timestamps: true });

userSchema.methods.matchPassword = async function (entered) {
  if (!this.password) return false;
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model("User", userSchema);
