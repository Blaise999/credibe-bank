const express = require("express");
const router = express.Router();
const { verifyToken, verifyUserToken } = require("../middleware/auth");
const { getUserTransactions } = require("../controllers/user.controller");
const User = require("../models/User");

// Debug logs
console.log("verifyToken:", typeof verifyToken, verifyToken);
console.log("verifyUserToken:", typeof verifyUserToken, verifyUserToken);
console.log("getUserTransactions:", typeof getUserTransactions, getUserTransactions);

// 🧠 Abstracted response sender
const handleResponse = (res, data) => res.json(data);

// 👁️ Token test route (use verifyToken temporarily)
router.get("/dashboard", verifyToken, (req, res) => {
  handleResponse(res, { message: "Token verified ✅", user: req.user });
});

// 📊 Test route without middleware
router.get("/transactions/:userId", verifyToken, getUserTransactions);


// 🧍‍♂️ Profile route
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, email, phone } = user;
    handleResponse(res, { name, email, phone });
  } catch (err) {
    console.error("❌ Profile fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// 📈 User financial info
router.get("/me", verifyToken, async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { balance, savings, credits, email, name, phone } = user;
    handleResponse(res, {
      balance,
      savings,
      credits,
      email,
      name: name || "Anonymous",
      phone: phone || ""
    });
  } catch (err) {
    console.error("❌ Info fetch error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;