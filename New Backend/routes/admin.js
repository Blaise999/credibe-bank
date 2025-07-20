const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { verifyToken, isAdmin } = require("../middleware/auth");

// 👥 User Management
router.get("/users", verifyToken, isAdmin, adminController.getAllUsers);
router.patch("/block-user/:userId", verifyToken, isAdmin, adminController.toggleBlockUser);
router.patch("/edit-balance/:userId", verifyToken, isAdmin, adminController.editUserBalance);

// 💸 Transaction Management
router.get("/pending-transactions", verifyToken, isAdmin, adminController.getPendingTransfers);
router.get("/transfer-history", verifyToken, isAdmin, adminController.getTransferHistory);
router.post("/handle-transaction", verifyToken, isAdmin, adminController.handleTransaction);
router.post("/inject-fake-transactions", verifyToken, isAdmin, adminController.injectFakeTransactions); // ✅ updated

// ⬆️ Top-Up Management
router.get("/topups/pending", verifyToken, isAdmin, adminController.getPendingTopUps);
router.post("/topups/:id/approve", verifyToken, isAdmin, adminController.approveTopUp);
router.post("/topups/:id/reject", verifyToken, isAdmin, adminController.rejectTopUp);

// 📧 Notifications
router.post("/notify", verifyToken, isAdmin, adminController.sendNotification);

// 📊 Dashboard Stats
router.get("/dashboard-stats", verifyToken, isAdmin, adminController.getDashboardStats);

module.exports = router;
