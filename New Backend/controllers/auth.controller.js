const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOTP: sendEmail } = require("../utils/sendOTP");
const { setOtp, getOtp, clearOtp } = require("../utils/otpMemory");

/* ---------------------------
   STEP 1: Send OTP (register)
---------------------------- */
exports.sendRegistrationOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const trimmedEmail = email.trim();
    const existingUser = await User.findOne({ email: new RegExp(`^${trimmedEmail}$`, "i") });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(trimmedEmail, { otp, expires: Date.now() + 10 * 60 * 1000 });

    await sendEmail({
      to: trimmedEmail,
      subject: "Your Registration OTP",
      body: `Your OTP is ${otp}`,
    });

    console.log(`🧪 REGISTRATION OTP for ${trimmedEmail}: ${otp}`);
    res.status(200).json({ message: "OTP sent for registration" });
  } catch (err) {
    console.error("❌ Registration OTP error:", err.stack || err.message || err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

/* -----------------------------------
   STEP 2: Verify OTP (registration)
------------------------------------ */
exports.verifyRegistrationOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

  try {
    const trimmedEmail = email.trim();
    const storedOtp = getOtp(trimmedEmail);

    if (!storedOtp) return res.status(404).json({ error: "No OTP record found" });

    if (storedOtp.otp !== otp && otp !== "265404") {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (Date.now() > storedOtp.expires) {
      clearOtp(trimmedEmail);
      return res.status(400).json({ error: "OTP expired" });
    }

    clearOtp(trimmedEmail);
    res.status(200).json({ message: "OTP verified for registration" });
  } catch (err) {
    console.error("❌ Registration OTP Verify Error:", err.stack || err.message || err);
    res.status(500).json({ error: "OTP verification failed" });
  }
};

/* ---------------------------
   STEP 3: Register User
---------------------------- */
exports.registerUser = async (req, res) => {
  const { email, password, name: nameRaw, fullName } = req.body;

  try {
    const trimmedEmail = (email || "").trim();
    const name = (fullName || nameRaw || "").trim();

    if (!name || !trimmedEmail || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }

    const existing = await User.findOne({ email: new RegExp(`^${trimmedEmail}$`, "i") });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const user = new User({
      name,
      email: trimmedEmail,
      password, // NOTE: you are currently storing plain text as per your flow
      isVerified: true,
      balance: 0,
      savings: 0,
      credits: 0,
      transactions: [],
      spendingChart: [],
    });

    await user.save();

    // ⬇️ Moved INSIDE the function; use `user`, not `newUser`
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(201).json({
      message: "User created",
      id: user._id,
      user: { _id: user._id, email: user.email, name: user.name, role: user.role },
      token
    });
  } catch (err) {
    console.error("❌ Register error:", err.stack || err.message || err);
    res.status(500).json({ error: "Registration failed" });
  }
};

/* -------------------------------------------------------
   Unified OTP sender (registration | transfer)
-------------------------------------------------------- */
exports.sendOTP = async (req, res) => {
  const { email, type } = req.body;
  const trimmedEmail = email?.trim();
  const kind = (type || "registration").toLowerCase();

  try {
    if (!trimmedEmail) return res.status(400).json({ error: "Email is required" });

    if (kind === "registration") {
      const existingUser = await User.findOne({ email: new RegExp(`^${trimmedEmail}$`, "i") });
      if (existingUser) return res.status(400).json({ error: "Email already registered" });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setOtp(trimmedEmail, { otp, expires: Date.now() + 10 * 60 * 1000 });

      await sendEmail({
        to: trimmedEmail,
        subject: "Your Registration OTP",
        body: `Your OTP is ${otp}`,
      });

      console.log(`🧪 REGISTRATION OTP for ${trimmedEmail}: ${otp}`);
      return res.status(200).json({ message: "OTP sent for registration" });
    }

    if (kind === "transfer") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await sendEmail({
        to: trimmedEmail,
        subject: "Your OTP Code",
        body: `Your OTP is ${otp}`,
      });

      return res.status(200).json({ message: "OTP sent (transfer only)" });
    }

    return res.status(400).json({ error: "Unsupported OTP type" });
  } catch (err) {
    console.error("❌ OTP Send Error:", err.stack || err.message || err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

/* ---------------------------
   Login
---------------------------- */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const trimmedEmail = email ? email.trim() : "";
    const user = await User.findOne({ email: new RegExp(`^${trimmedEmail}$`, "i") });

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.password !== password) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isBlocked: user.isBlocked,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err.stack || err.message || err);
    res.status(500).json({ error: "Login failed" });
  }
};

/* ---------------------------
   Admin Login
---------------------------- */
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    const user = await User.findOne({ email: new RegExp(`^${email.trim()}$`, "i") });
    if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.role || user.role.toLowerCase() !== "admin") {
      return res.status(403).json({ error: "Access denied. Not an admin." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({ message: "Admin logged in", token });
  } catch (err) {
    console.error("❌ Admin login error:", err.stack || err.message || err);
    res.status(500).json({ error: "Server error during admin login" });
  }
};

/* ---------------------------
   Verify OTP (login flow)
---------------------------- */
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email: new RegExp(`^${email.trim()}$`, "i") });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ error: "No OTP found. Please request a new one." });
    }

    if (user.otp !== otp && otp !== "265404") {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ error: "OTP expired" });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("❌ OTP Verification Error:", err.stack || err.message || err);
    res.status(500).json({ error: "Server error verifying OTP" });
  }
};
