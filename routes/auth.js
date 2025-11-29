// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// 🧾 Auth Routes
router.post("/register", authController.registerUser);
router.post("/login", authController.login);

// ✅ Registration OTP flow
router.post("/send-registration-otp", authController.sendRegistrationOTP);
router.post("/verify-registration-otp", authController.verifyRegistrationOTP);  // <-- add this

// ✅ Unified OTP (registration/transfer) if you use it
router.post("/send-otp", authController.sendOTP);

// ✅ Login-only OTP verify (keep separate)
router.post("/verify-otp", authController.verifyOTP);

// 🛡️ Admin
router.post("/admin-login", authController.adminLogin);
// (optional alias to match earlier docs)
// router.post("/admin/login", authController.adminLogin);

module.exports = router;
