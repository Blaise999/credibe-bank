// utils/otpMemory.js
const otpStore = new Map();

// ✅ Save OTP for a normalized email
function setOtp(email, otp) {
  const normalized = email.toLowerCase();
  otpStore.set(normalized, otp);

  setTimeout(() => {
    otpStore.delete(normalized);
    console.log(`🧹 OTP for ${normalized} expired and removed`);
  }, 20 * 60 * 1000); // 20 mins (adjust as needed)
}

// ✅ Get OTP using normalized email
function getOtp(email) {
  return otpStore.get(email.toLowerCase());
}

// ✅ Clear OTP using normalized email
function clearOtp(email) {
  otpStore.delete(email.toLowerCase());
}

module.exports = { setOtp, getOtp, clearOtp, otpStore }; // ✅ exported correctly
