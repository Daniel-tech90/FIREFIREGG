import express from "express";
import DepositRequest from "../models/DepositRequest.js";
import Wallet from "../models/Wallet.js";

const router = express.Router();

// POST submit deposit request (user uploads screenshot as base64)
router.post("/submit", async (req, res) => {
  try {
    const { userId, userName, userEmail, amount, screenshotUrl } = req.body;
    if (!userId || !amount || !screenshotUrl)
      return res.status(400).json({ message: "userId, amount and screenshotUrl are required" });

    // Block multiple pending requests from same user
    const existing = await DepositRequest.findOne({ userId, status: "pending" });
    if (existing)
      return res.status(400).json({ message: "You already have a pending deposit request. Wait for admin approval." });

    const deposit = await DepositRequest.create({ userId, userName, userEmail, amount: Number(amount), screenshotUrl });
    res.status(201).json(deposit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all deposit requests for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const deposits = await DepositRequest.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all deposit requests (admin)
router.get("/all", async (req, res) => {
  try {
    const deposits = await DepositRequest.find().sort({ createdAt: -1 });
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH approve deposit (admin) — ONLY place wallet balance increases
router.patch("/:id/approve", async (req, res) => {
  try {
    const deposit = await DepositRequest.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: "Deposit request not found" });
    if (deposit.status !== "pending")
      return res.status(400).json({ message: "Request already processed" });

    // Credit wallet
    let wallet = await Wallet.findOne({ userId: deposit.userId });
    if (!wallet) wallet = new Wallet({ userId: deposit.userId, userName: deposit.userName, balance: 0 });
    wallet.balance += deposit.amount;
    wallet.transactions.push({ type: "credit", amount: deposit.amount, label: "Deposit approved by admin" });
    await wallet.save();

    // Mark approved
    deposit.status = "approved";
    await deposit.save();

    res.json({ deposit, wallet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH reject deposit (admin)
router.patch("/:id/reject", async (req, res) => {
  try {
    const deposit = await DepositRequest.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: "Deposit request not found" });
    if (deposit.status !== "pending")
      return res.status(400).json({ message: "Request already processed" });

    deposit.status = "rejected";
    deposit.note = req.body.note || "";
    await deposit.save();

    res.json(deposit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
