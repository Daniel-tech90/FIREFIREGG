import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  userName: { type: String, default: "" },
  balance: { type: Number, default: 0 },
  transactions: [{
    type: { type: String, enum: ["credit", "debit"] },
    amount: Number,
    label: String,
    date: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.model("Wallet", walletSchema);
