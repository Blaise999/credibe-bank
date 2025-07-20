const express = require("express");
const router = express.Router();
const { verifyToken, verifyUserToken } = require("../middleware/auth");
const userController = require("../controllers/user.controller");
const User = require("../models/User"); 


// ✅ Protected User Dashboard
router.get("/dashboard", verifyUserToken, (req, res) => {
  res.json({
    message: "Token verified ✅",
    user: req.user,
  });
});

// ✅ Get user info
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await require("../models/User").findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      balance: user.balance,
      savings: user.savings,
      credits: user.credits,
      email: user.email,
      name: user.name || "Anonymous",
        phone: user.phone || ""
    });
  } catch (err) {
    console.error("❌ Failed to fetch user info:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      name: user.name,
      email: user.email,
      phone: user.phone
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});


// ✅ Safe transaction route using the correct controller version
router.get("/transactions/:userId", verifyToken, async (req, res) => {
  try {
    const { getUserTransactions } = require("../controllers/user.controller");
    await getUserTransactions(req, res);
  } catch (err) {
    console.error("❌ Route-level error:", err.message);
    res.status(500).json({ error: "Route failed" });
  }
});

module.exports = router;
