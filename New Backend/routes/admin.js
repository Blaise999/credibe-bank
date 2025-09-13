const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  toggleBlockUser,
  editUserBalance,
  getPendingTransfers,
  handleTransaction,
  getTransferHistory,
  getPendingTopUps,    // ✅ Fixed typo
  approveTopUp,        // ✅ Use correct function
  rejectTopUp,         // ✅ Use correct function
  sendNotification,
  injectFakeTransactions,
  getDashboardStats,

  // ⬇️ NEW admin endpoints
  setTxnCap,
  getTxnCap,
  adminCreateTransaction,
} = require("../controllers/admin.controller");

const { verifyToken, isAdmin } = require("../middleware/auth");

// ✅ All routes below are protected
router.use(verifyToken, isAdmin);

// Dashboard summary
router.get("/stats", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.patch("/users/block/:userId", toggleBlockUser);
router.patch("/users/edit/:userId", editUserBalance);

// Transfers
router.get("/transfers/pending", getPendingTransfers);
router.get("/transfers/history", getTransferHistory);
router.post("/transfers/action", handleTransaction);

// Top-ups
router.get("/topups/pending", getPendingTopUps);
router.post("/topups/:id/approve", approveTopUp); // ✅ Fixed route
router.post("/topups/:id/reject", rejectTopUp);   // ✅ Fixed route

// Notifications
router.post("/notify", sendNotification);

// Fake data injection
router.post("/inject-fake-transactions", injectFakeTransactions);

// ⬇️ NEW: Admin freeze (cap) + Admin create-transaction
router.put("/users/:userId/txn-cap", setTxnCap);
router.get("/users/:userId/txn-cap", getTxnCap);
router.post("/transactions", adminCreateTransaction);

module.exports = router;
