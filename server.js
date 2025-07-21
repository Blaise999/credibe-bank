require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());

// ✅ CORS config for local, production, and preflight support
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://thecredibe.com',
  'https://www.thecredibe.com',
  'https://credibe-frontend.onrender.com'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin"); // important to avoid caching origin
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // Preflight OK
  }

  next();
});

// ✅ Route imports
const authRoutes = require("./routes/auth");
const transferRoutes = require("./routes/transfer");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const topUpRoutes = require("./routes/topup");
const settingsRoutes = require('./routes/settings');

// ✅ Connect to MongoDB
const connectDB = require("./config/db");

const startServer = async () => {
  try {
    await connectDB();

    // ✅ Route mounts
    app.use("/api/auth", authRoutes);
    app.use("/api/transfer", transferRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/topup", topUpRoutes);
    app.use("/api/settings", settingsRoutes);

    // ✅ Dynamic port for local + Render
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Server startup error:", err.message);
    process.exit(1);
  }
};

startServer();
