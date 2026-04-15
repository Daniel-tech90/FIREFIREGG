import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

// GET all winner notifications (admin history)
router.get("/winners", async (req, res) => {
  try {
    const winners = await Notification.find({ type: "winner" }).sort({ createdAt: -1 });
    res.json(winners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET notifications for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET unshown winner popup for a user
router.get("/user/:userId/winner-popup", async (req, res) => {
  try {
    const notif = await Notification.findOne({ userId: req.params.userId, type: "winner", popupShown: false });
    res.json(notif || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH mark notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH mark popup as shown
router.patch("/:id/popup-shown", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { popupShown: true, read: true }, { new: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH mark all as read for a user
router.patch("/user/:userId/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
