const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getUserTransactions } = require("../controllers/user.controller");
const User = require("../models/User");
const auth = require('../middleware/auth'); // Your auth middleware
// 📌 Helper to send JSON
const handleResponse = (res, data) => res.json(data);

// 🔒 Simple token-check route (optional; good for debugging)
router.get("/dashboard", verifyToken, (req, res) => {
  handleResponse(res, { message: "Token verified ✅", user: req.user });
});

// 📊 Transactions (kept the same)
router.get("/transactions/:userId", verifyToken, getUserTransactions);

router.get('/txn-cap', auth, userController.getMyTxnCap);
// 🧍‍♂️ Profile (now also returns avatarUrl)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("name email phone avatarUrl");
    if (!user) return res.status(404).json({ error: "User not found" });

    handleResponse(res, user);
  } catch (err) {
    console.error("❌ Profile fetch error:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// 👤 Me (returns the fields your dashboard/settings need, incl. avatarUrl)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email phone avatarUrl balance savings credits language timezone role createdAt"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    handleResponse(res, {
      _id: user._id,
      name: user.name || "Anonymous",
      email: user.email,
      phone: user.phone || "",
      avatarUrl: user.avatarUrl || null,
      balance: user.balance ?? 0,
      savings: user.savings ?? 0,
      credits: user.credits ?? 0,
      language: user.language || "en",
      timezone: user.timezone || "UTC",
      role: user.role || "user",
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("❌ /me fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
