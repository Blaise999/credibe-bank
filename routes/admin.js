const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { verifyToken, isAdmin } = require("../middleware/auth");

// 🔹 Top-Up Management
router.get("/topups/pending", verifyToken, isAdmin, adminController.getPendingTopUps);
router.post("/topups/:id/approve", verifyToken, isAdmin, adminController.approveTopUp);
router.post("/topups/:id/reject", verifyToken, isAdmin, adminController.rejectTopUp);

// 📧 Send Notification
router.post("/notify", verifyToken, isAdmin, adminController.sendNotification);

// 👥 User Management
router.get("/users", verifyToken, isAdmin, adminController.getAllUsers);
router.patch("/block-user/:userId", verifyToken, isAdmin, adminController.toggleBlockUser);
router.patch("/edit-balance/:userId", verifyToken, isAdmin, adminController.editUserBalance);

// 💸 Transaction Approval
router.post("/handle-transaction", verifyToken, isAdmin, adminController.handleTransaction);

// ⏳ Fetch Pending Transfers (uses controller, not inline logic)
router.get("/pending-transactions", verifyToken, isAdmin, adminController.getPendingTransfers);

// 📊 Dashboard Stats
router.get("/dashboard-stats", verifyToken, isAdmin, adminController.getDashboardStats);

// 📜 Admin Transfer History
router.get("/transfer-history", verifyToken, isAdmin, adminController.getTransferHistory);

// 🧪 Inject Fake Transactions
router.post("/inject-fake-txns", verifyToken, isAdmin, adminController.injectFakeTransactions);

module.exports = router;
