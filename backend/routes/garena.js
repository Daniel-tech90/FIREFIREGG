import express from "express";
import axios from "axios";

const router = express.Router();
const FF_API = "https://freefireinfo-zy9l.onrender.com";

// GET /api/garena/player/:uid?server=IND
router.get("/player/:uid", async (req, res) => {
  const { uid } = req.params;
  const server = (req.query.server || "IND").toUpperCase();
  try {
    const { data } = await axios.get(`${FF_API}/api/v1/player-profile`, {
      params: { uid, server },
      timeout: 20000,
    });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ message: err.response?.data?.message || err.message || "Failed to fetch player" });
  }
});

// GET /api/garena/stats/:uid?server=IND&gamemode=br&matchmode=CAREER
router.get("/stats/:uid", async (req, res) => {
  const { uid } = req.params;
  const { server = "IND", gamemode = "br", matchmode = "CAREER" } = req.query;
  try {
    const { data } = await axios.get(`${FF_API}/api/v1/player-stats`, {
      params: { uid, server: server.toUpperCase(), gamemode, matchmode },
      timeout: 20000,
    });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ message: err.response?.data?.message || err.message || "Failed to fetch stats" });
  }
});

// GET /api/garena/search?keyword=name&server=IND
router.get("/search", async (req, res) => {
  const { keyword, server = "IND" } = req.query;
  if (!keyword) return res.status(400).json({ message: "keyword is required" });
  try {
    const { data } = await axios.get(`${FF_API}/api/v1/search-players`, {
      params: { keyword, server: server.toUpperCase() },
      timeout: 20000,
    });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ message: err.response?.data?.message || err.message || "Search failed" });
  }
});

// GET server time
router.get("/server-time", (_req, res) => {
  res.json({ now: Date.now() });
});

export default router;
