const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { verifyToken, isAdmin } = require("../middleware/auth");

const Transaction = require("../models/transaction");

// 🔹 Top-Up Management
router.get("/topups/pending", verifyToken, isAdmin, adminController.getPendingTopUps);
router.post("/topups/:id/approve", verifyToken, isAdmin, adminController.approveTopUp);
router.post("/topups/:id/reject", verifyToken, isAdmin, adminController.rejectTopUp);

// 📧 Send Notification
router.post("/notify", verifyToken, isAdmin, adminController.sendNotification);
// 👥 User management
router.get("/users", verifyToken, isAdmin, adminController.getAllUsers);
router.patch("/block-user/:userId", verifyToken, isAdmin, adminController.toggleBlockUser);
router.patch("/edit-balance/:userId", verifyToken, isAdmin, adminController.editUserBalance);

// Fetch pending transactions for admin
router.get("/pending-transactions", verifyToken, isAdmin, async (req, res) => {
  try {
    const pendingTransactions = await Transaction.find({ status: "pending" })
      .populate("from to")
      .sort({ createdAt: -1 }); // Sort by date if needed

    if (pendingTransactions.length === 0) {
      return res.status(404).json({ error: "No pending transactions found" });
    }

    res.json(pendingTransactions);
  } catch (err) {
    console.error("❌ Error fetching pending transactions:", err.message);
    res.status(500).json({ error: "Failed to fetch pending transactions" });
  }
});

// 💸 Transaction approval
router.post("/handle-transaction", verifyToken, isAdmin, adminController.handleTransaction);

// 📊 Dashboard statistics (REAL data)
router.get("/dashboard-stats", verifyToken, isAdmin, adminController.getDashboardStats);

// 📜 Transfer History for Admin Table View
router.get("/transfer-history", verifyToken, isAdmin, adminController.getTransferHistory);

router.post('/inject-fake-txns', verifyToken, isAdmin, adminController.injectFakeTransactions);
// 🧼 Deleted the clean-fake-transactions route

module.exports = router;