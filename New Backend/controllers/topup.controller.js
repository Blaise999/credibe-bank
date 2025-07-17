const TopUp = require("../models/TopUp");
const User = require("../models/User");

// User requests a top-up
exports.requestTopUp = async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) return res.status(400).json({ error: "Missing fields" });

  try {
    const topUp = await TopUp.create({ user: userId, amount });
    res.status(200).json({ message: "Top-up requested", topUpId: topUp._id });
  } catch (err) {
    console.error("❌ Top-Up Error:", err.message);
    res.status(500).json({ error: "Failed to request top-up" });
  }
};

// Admin approves or rejects
exports.handleTopUp = async (req, res) => {
  const { topUpId, action } = req.body;

  try {
    const topUp = await TopUp.findById(topUpId).populate("user");
    if (!topUp || topUp.status !== "pending") {
      return res.status(400).json({ error: "Invalid or already handled top-up" });
    }

    if (action === "approve") {
      topUp.user.balance += topUp.amount;
      topUp.status = "approved";
      await topUp.user.save();
    } else if (action === "reject") {
      topUp.status = "rejected";
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    await topUp.save();
    res.status(200).json({ message: `Top-up ${topUp.status}` });
  } catch (err) {
    console.error("⚠️ Admin Top-Up Error:", err.message);
    res.status(500).json({ error: "Failed to process top-up" });
  }
};

// Admin views pending requests
exports.getPendingTopUps = async (req, res) => {
  try {
    const pending = await TopUp.find({ status: "pending" }).populate("user");
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: "Could not load top-ups" });
  }
};
