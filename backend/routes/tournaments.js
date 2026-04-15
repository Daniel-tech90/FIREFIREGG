import express from "express";
import Tournament from "../models/Tournament.js";
import Notification from "../models/Notification.js";

const router = express.Router();

// GET all tournaments — strip password if not yet live
router.get("/", async (req, res) => {
  try {
    const now = Date.now();
    const tournaments = await Tournament.find().sort({ createdAt: -1 });
    const safe = tournaments.map(t => {
      const target = new Date(`${t.date}T${t.time}`).getTime();
      const isLive = t.status === "live" || now >= target;
      const obj = t.toObject();
      if (!isLive) obj.roomPassword = null; // hide until live
      return obj;
    });
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET server time (so clients can't cheat with local clock)
router.get("/server-time", (_req, res) => {
  res.json({ now: Date.now() });
});

// GET single tournament
router.get("/:id", async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create tournament (admin)
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const t = await Tournament.create({
      ...data,
      slotsLeft: Number(data.totalSlots),
    });
    req.io.emit("tournament:created", t);
    res.status(201).json(t);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update tournament (admin edit)
router.put("/:id", async (req, res) => {
  try {
    const old = await Tournament.findById(req.params.id);
    if (!old) return res.status(404).json({ message: "Not found" });

    const t = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.io.emit("tournament:updated", t);

    // Notify all joined players
    if (old.joinedPlayers?.length > 0) {
      const notifs = old.joinedPlayers.map(p => ({
        userId: p.id,
        type: "general",
        title: "📢 Tournament Updated",
        message: `"${t.name}" details have been updated by admin. Please check the latest schedule.`,
      }));
      await Notification.insertMany(notifs);
      old.joinedPlayers.forEach(p => {
        req.io.emit(`notification:${p.id}`, notifs.find(n => n.userId === p.id));
      });
    }

    res.json(t);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH update status (mark live / completed)
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const t = await Tournament.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!t) return res.status(404).json({ message: "Not found" });
    req.io.emit("tournament:updated", t);
    res.json(t);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE tournament (admin)
router.delete("/:id", async (req, res) => {
  try {
    await Tournament.findByIdAndDelete(req.params.id);
    req.io.emit("tournament:deleted", { id: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST join tournament (user)
router.post("/:id/join", async (req, res) => {
  try {
    const { userId, userName, userEmail } = req.body;
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    if (t.slotsLeft <= 0) return res.status(400).json({ message: "No slots left" });
    if (t.joinedPlayers.find(p => p.id === userId))
      return res.status(400).json({ message: "Already joined this tournament" });

    t.joinedPlayers.push({ id: userId, name: userName, email: userEmail });
    t.slotsLeft -= 1;
    await t.save();

    // Send join notification
    await Notification.create({
      userId,
      type: "general",
      title: "✅ Registration Successful!",
      message: `You have successfully joined "${t.name}" tournament. Entry fee deducted. Good luck! 🔥`,
    });
    req.io.emit(`notification:${userId}`, { type: "general", title: "✅ Registered!", message: t.name });
    req.io.emit("tournament:updated", t);
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST cancel tournament — auto refund all players
router.post("/:id/cancel", async (req, res) => {
  try {
    const { reason } = req.body;
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Not found" });

    const Wallet = (await import("../models/Wallet.js")).default;

    // Refund each joined player
    for (const p of t.joinedPlayers) {
      let wallet = await Wallet.findOne({ userId: p.id });
      if (wallet && t.entryFee > 0) {
        wallet.balance += Number(t.entryFee);
        wallet.transactions.push({ type: "credit", amount: Number(t.entryFee), label: `Refund: ${t.name} cancelled` });
        await wallet.save();
      }
      await Notification.create({
        userId: p.id,
        type: "general",
        title: "⚠️ Tournament Cancelled",
        message: `"${t.name}" has been cancelled. Entry fee ₹${t.entryFee} refunded to your wallet.${reason ? ` Reason: ${reason}` : ""}`,
      });
      req.io.emit(`notification:${p.id}`, { type: "general", title: "Refund Issued" });
    }

    t.status = "cancelled";
    t.cancelReason = reason || "";
    await t.save();
    req.io.emit("tournament:updated", t);
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET tournaments joined by a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const tournaments = await Tournament.find({ "joinedPlayers.id": req.params.userId }).sort({ createdAt: -1 });
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET joined players (admin)
router.get("/:id/players", async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id).select("joinedPlayers name");
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
