import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendWinnerEmail } from "../utils/mailer.js";

const router = express.Router();

// PATCH mark winner — admin only (supports lookup by ffUid)
router.patch("/:id/mark-winner", async (req, res) => {
  try {
    const { tournamentName, prizeAmount } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const notif = await Notification.create({
      userId: user._id.toString(),
      type: "winner",
      title: "🎉 Congratulations! You are the Winner!",
      message: `You won ${tournamentName || "the tournament"}. Prize: ₹${prizeAmount || 0}. Our team will connect to you instantly!!`,
      tournamentName: tournamentName || "",
      prizeAmount: Number(prizeAmount || 0),
    });

    req.io.emit(`winner:${user._id.toString()}`, notif);

    // Send email (non-blocking)
    if (user.email) {
      sendWinnerEmail({
        to: user.email,
        name: user.ffName || user.name,
        tournamentName: tournamentName || "the tournament",
        prizeAmount: prizeAmount || 0,
      }).catch(err => console.error("Winner email failed:", err.message));
    }

    res.json({ user, notification: notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST mark winner by FF UID — admin enters UID directly
router.post("/mark-winner-by-uid", async (req, res) => {
  try {
    const { ffUid, tournamentName, prizeAmount } = req.body;
    if (!ffUid) return res.status(400).json({ message: "FF UID is required" });

    const user = await User.findOne({ ffUid });
    if (!user) return res.status(404).json({ message: `No user found with FF UID: ${ffUid}` });

    const notif = await Notification.create({
      userId: user._id.toString(),
      type: "winner",
      title: "🎉 Congratulations! You are the Winner!",
      message: `You won ${tournamentName || "the tournament"}. Prize: ₹${prizeAmount || 0}. Our team will connect to you instantly!!`,
      tournamentName: tournamentName || "",
      prizeAmount: Number(prizeAmount || 0),
    });

    req.io.emit(`winner:${user._id.toString()}`, notif);
    res.json({ user, notification: notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET users with WhatsApp (prize data — admin)
router.get("/prize-data", async (req, res) => {
  try {
    const users = await User.find({ whatsapp: { $ne: "" } }).sort({ updatedAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH update prize status & note (admin)
router.patch("/:id/prize", async (req, res) => {
  try {
    const { prizeStatus, prizeNote } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...(prizeStatus && { prizeStatus }), ...(prizeNote !== undefined && { prizeNote }) },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH update WhatsApp (admin edit)
router.patch("/:id/whatsapp-admin", async (req, res) => {
  try {
    const { whatsapp } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { whatsapp }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH save ff profile from user dashboard
router.patch("/:id/ff-profile", async (req, res) => {
  try {
    const { ffUid, ffName } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { ffUid, ffName }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all users (admin)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST login — validate email + password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "No account found with this email" });
    if (user.status === "banned") return res.status(403).json({ message: "Your account has been banned" });
    if (user.method === "Google") return res.status(401).json({ message: "This account uses Google login" });

    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: "Incorrect password" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST register — create new account with hashed password
router.post("/register", async (req, res) => {
  try {
    const { name, email, avatar, method, password } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and email required" });

    const existing = await User.findOne({ email });

    // Google OAuth login — upsert profile only
    if (method === "Google") {
      const user = await User.findOneAndUpdate(
        { email },
        { name, avatar: avatar || "", method: "Google" },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.json(user);
    }

    // Email registration — reject if already exists
    if (existing) {
      return res.status(409).json({ message: "Email already registered. Please login." });
    }

    // New user — hash password and create
    if (!password) return res.status(400).json({ message: "Password is required" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email,
      avatar: "",
      method: "Email",
      password: hashed,
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH save/update WhatsApp number
router.patch("/:id/whatsapp", async (req, res) => {
  try {
    const { whatsapp } = req.body;
    if (!whatsapp) return res.status(400).json({ message: "WhatsApp number required" });
    const digits = whatsapp.replace(/\D/g, "");
    if (digits.length < 10) return res.status(400).json({ message: "Invalid WhatsApp number" });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { whatsapp: digits },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH ban/unban user
router.patch("/:id/ban", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.status = user.status === "banned" ? "active" : "banned";
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
