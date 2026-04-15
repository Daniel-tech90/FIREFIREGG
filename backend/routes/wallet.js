import express from "express";
import Wallet from "../models/Wallet.js";

const router = express.Router();

// GET wallet balance
router.get("/:userId", async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.params.userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.params.userId, balance: 0 });
    }
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add money
router.post("/add", async (req, res) => {
  try {
    const { userId, userName, amount } = req.body;
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = new Wallet({ userId, userName, balance: 0 });
    wallet.balance += Number(amount);
    wallet.transactions.push({ type: "credit", amount: Number(amount), label: "Added via UPI" });
    await wallet.save();
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST deduct money (called internally during join)
router.post("/deduct", async (req, res) => {
  try {
    const { userId, userName, amount, label } = req.body;
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = new Wallet({ userId, userName, balance: 0 });
    if (wallet.balance < Number(amount))
      return res.status(400).json({ message: "Insufficient balance" });
    wallet.balance -= Number(amount);
    wallet.transactions.push({ type: "debit", amount: Number(amount), label: label || "Tournament entry fee" });
    await wallet.save();
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST withdraw
router.post("/withdraw", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < Number(amount))
      return res.status(400).json({ message: "Insufficient balance" });
    wallet.balance -= Number(amount);
    wallet.transactions.push({ type: "debit", amount: Number(amount), label: "Withdrawal to UPI" });
    await wallet.save();
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
