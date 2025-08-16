// routes/transfer.js
const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transfer.controller");
const { verifyToken } = require("../middleware/auth");

// 🔐 Step 1: Request OTP for transfer (based on userId)
router.post("/request-otp", transferController.requestTransferOTP);

// 💸 Step 2: Initiate transfer with OTP verification
router.post("/initiate", verifyToken, transferController.initiateTransfer);

// 🔐 Send OTP to logged-in user's email/phone
router.post("/send-otp", verifyToken, transferController.sendTransferOtp);

// 🔓 Send OTP directly to a typed-in email (no token or userId needed)
router.post("/send-direct-otp", transferController.sendOtpToTypedEmail);

// ✅ Buy Crypto
router.post("/buy-crypto", verifyToken, transferController.handleBuyCrypto);

// ✅ Pay Bills
router.post("/pay-bill", verifyToken, transferController.handlePayBill);

/**
 * ✅ NEW: Fetch user transactions (Sent / Received)
 * Usage:
 *   GET /api/user/transactions?type=sent&days=7
 *   GET /api/user/transactions?type=received&days=30
 * Query params:
 *   - type: 'sent' | 'received'   (default 'sent')
 *   - days: number | 'all'        (default '7')
 *   - status: optional            ('pending' | 'approved' | 'rejected')
 */
router.get("/transactions", verifyToken, transferController.getUserTransactions);

// (Optional admin-facing routes)
// router.get("/pending", transferController.getPendingTransfers);
// router.get("/history", transferController.getApprovedOrRejected);

module.exports = router;
