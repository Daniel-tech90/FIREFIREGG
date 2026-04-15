import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  joinedAt: { type: Date, default: Date.now },
});

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  matchType: { type: String, default: "Solo" },
  mode: { type: String, default: "" },
  map: { type: String, default: "" },
  date: { type: String, required: true },
  time: { type: String, required: true },
  prizeAmount: { type: Number, required: true },
  entryFee: { type: Number, required: true },
  totalSlots: { type: Number, required: true, default: 20 },
  slotsLeft: { type: Number, required: true, default: 20 },
  prize1st: { type: String, default: "" },
  prize2nd: { type: String, default: "" },
  prize3rd: { type: String, default: "" },
  perKill: { type: String, default: "" },
  description: { type: String, default: "" },
  rules: { type: String, default: "" },
  status: { type: String, enum: ["upcoming", "live", "completed", "cancelled"], default: "upcoming" },
  bannerImage: { type: String, default: "" },
  roomId: { type: String, default: "" },
  roomPassword: { type: String, default: "" },
  closingTime: { type: String, default: "" },
  cancelReason: { type: String, default: "" },
  joinedPlayers: [playerSchema],
}, { timestamps: true });

export default mongoose.model("Tournament", tournamentSchema);
