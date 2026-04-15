import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId:          { type: String, required: true },
  type:            { type: String, enum: ["winner", "deposit", "general"], default: "general" },
  title:           { type: String, required: true },
  message:         { type: String, required: true },
  tournamentName:  { type: String, default: "" },
  prizeAmount:     { type: Number, default: 0 },
  read:            { type: Boolean, default: false },
  popupShown:      { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
