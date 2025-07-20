require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());

// ✅ Finalized CORS fix – for local + Render + live frontend
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://thecredibe.com',
  'https://www.thecredibe.com',
  'https://credibe-frontend.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ Handle preflight for all routes

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
  await connectDB();

  // ✅ Mount routes
  app.use("/api/auth", authRoutes);
  app.use("/api/transfer", transferRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/topup", topUpRoutes);
  app.use("/api/settings", settingsRoutes);

  // ✅ Use dynamic port for Render
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

startServer();
