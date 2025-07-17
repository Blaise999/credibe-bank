const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// 🧾 Auth Routes
router.post("/register", authController.registerUser); // ⬅ ensure this name matches
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOTP);

// ✅ Registration-specific OTP route (no DB check)
router.post("/send-registration-otp", authController.sendRegistrationOTP);



// ✅ Normal OTP flow (login/transfer with DB check)
router.post("/send-otp", async (req, res) => {
  await authController.sendOTP(req, res);
});



router.post("/admin-login", authController.adminLogin); // Admin login for token

module.exports = router;

