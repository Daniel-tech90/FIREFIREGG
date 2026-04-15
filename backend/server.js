import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import tournamentRoutes from "./routes/tournaments.js";
import walletRoutes from "./routes/wallet.js";
import userRoutes from "./routes/users.js";
import garenaRoutes from "./routes/garena.js";
import depositRoutes from "./routes/deposits.js";
import notificationRoutes from "./routes/notifications.js";

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (origin, callback) => {
  // Allow localhost (dev) + any deployed frontend
  if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || process.env.CLIENT_URL === origin) {
    callback(null, true);
  } else {
    callback(new Error("Not allowed by CORS"));
  }
};

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

app.use((req, _res, next) => { req.io = io; next(); });

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/users", userRoutes);
app.use("/api/garena", garenaRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (_req, res) => res.json({ status: "FireFireGG API running 🔥" }));

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected — firefiregg");
    httpServer.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on http://localhost:${process.env.PORT || 5000}`)
    );
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
