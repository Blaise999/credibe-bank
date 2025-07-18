require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());

// ✅ CORS: Allow local + live frontend domains
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://thecredibe.com',
    'https://credibe-frontend.onrender.com'
  ],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// ✅ Route imports
const authRoutes = require("./routes/auth");
const transferRoutes = require("./routes/transfer");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const topUpRoutes = require("./routes/topup");

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

  // ✅ Use dynamic port for Render
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};
startServer();
