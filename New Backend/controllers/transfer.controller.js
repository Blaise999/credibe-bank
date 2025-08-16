const Transaction = require('../models/transaction.js'); // ✅;
const User = require("../models/User");
const { sendOTP } = require("../utils/sendOTP");
const { setOtp, getOtp, clearOtp, otpStore } = require("../utils/otpMemory");

// 🔐 Step 1: Request OTP before transfer (Used by dashboard)
exports.requestTransferOTP = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('🧪 requestTransferOTP - User not found:', { userId });
      return res.status(404).json({ error: "User not found" });
    }
    if (!user.email) {
      console.log('🧪 requestTransferOTP - No email:', { userId });
      return res.status(400).json({ error: "User email not set" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(user.email, otp);
    console.log(`🧪 OTP generated & set for ${user.email}: ${otp}`);

    await sendOTP({
      to: user.email,
      subject: "Transfer OTP",
      body: `Your OTP is ${otp}`,
    });

    res.status(200).json({ message: "OTP sent for transfer" });
  } catch (err) {
    console.error("❌ Request OTP Error:", err.message, { userId });
    res.status(500).json({ error: "Failed to request OTP" });
  }
};

exports.initiateTransfer = async (req, res) => {
  const fromId = req.user?.id;
  const { amount, note, otp, toIban, recipient, type } = req.body;

  console.log("🧪 initiateTransfer called:", {
    fromId,
    toIban,
    amount,
    timestamp: new Date().toLocaleString('en-GB', { timeZone: 'Europe/Brussels' })
  });

  if (!fromId || !toIban || !otp || amount === undefined || isNaN(amount)) {
    console.log('🧪 initiateTransfer validation failed:', { fromId, toIban, otp, amount });
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const sender = await User.findById(fromId);
    if (!sender) {
      console.log('🧪 Sender not found:', { fromId });
      return res.status(404).json({ error: "Sender not found" });
    }
    if (sender.isBlocked) {
      console.log('🧪 Sender blocked:', { fromId });
      return res.status(403).json({ error: "Sender is blocked" });
    }
    if (amount <= 0) {
      console.log('🧪 Invalid amount:', { amount });
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const storedOtp = getOtp(sender.email.toLowerCase());

    console.log("🧪 DEBUG OTP Verification:", {
      checkingEmail: sender.email,
      storedOtp,
      providedOtp: otp,
      allStoredOtps: Array.from(otpStore.entries())
    });

    if (!storedOtp || storedOtp !== otp) {
      console.log('🧪 OTP validation failed:', { storedOtp, providedOtp: otp });
      return res.status(400).json({
        error: "Invalid or expired OTP",
        debug: {
          reason: !storedOtp ? "No OTP stored or expired" : "OTP mismatch",
          expected: storedOtp,
          received: otp,
          email: sender.email
        }
      });
    }

    clearOtp(sender.email.toLowerCase());
    console.log('🧪 OTP cleared for:', { email: sender.email });

    const txn = new Transaction({
      from: sender._id,
      to: null,
      amount,
      toIban,
      recipient: recipient || "Unnamed Recipient",
      note: note || "Transfer initiated",
      status: "pending",
      type: "debit",
      date: new Date(),
    });

    await txn.save();
    console.log('🧪 Transaction saved:', {
      transactionId: txn._id,
      createdAt: txn.createdAt?.toISOString(),
      formattedCreatedAt: txn.createdAt?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    });

    sender.transactions.push(txn._id);
    await sender.save();
    console.log('🧪 Sender transactions updated:', {
      userId: sender._id,
      transactionId: txn._id,
      totalTransactions: sender.transactions.length
    });

    // 📩 Send confirmation email for both local and intl transfers
    await sendOTP({
      to: sender.email,
      subject: "✅ Transfer Submitted",
      body: `
Hi ${sender.name || sender.email},

Your ${type === 'international' ? 'international' : 'local'} transfer of $${amount} to ${recipient || 'Unnamed Recipient'} has been submitted and is pending admin approval.

🧾 Transaction ID: ${txn._id}
🗒️ Note: ${note || "No reference provided"}

You'll receive another update once it's approved or rejected.

– Credibe Team
      `
    });

    console.log(`📩 Confirmation email sent to ${sender.email}`);

    return res.status(200).json({
      message: "Transfer submitted for admin approval",
      transactionId: txn._id,
    });
  } catch (err) {
    console.error("❌ Transfer Error:", err.message, { fromId, toIban, amount });
    return res.status(500).json({ error: "Server error during transfer" });
  }
}; // ✅ This was the missing brace!


// ✅ Step 3: Send OTP via email or phone (memory-only)
exports.sendTransferOtp = async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user || !user.email) {
      console.log('🧪 sendTransferOtp - User not found or missing email:', { userId });
      return res.status(404).json({ error: "User not found or email not set" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(user.email, otp);
    console.log(`🧪 OTP generated for ${user.email}: ${otp}`);

    await sendOTP({
      to: user.email,
      subject: "Your Transfer OTP",
      body: `Your OTP is ${otp}`,
    });

    return res.status(200).json({ message: "OTP sent to your registered email" });
  } catch (err) {
    console.error("❌ Send Transfer OTP Error:", err.message);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

// ✅ Extra: Send OTP to typed email (no user lookup)
exports.sendOtpToTypedEmail = async (req, res) => {
  const { email, type } = req.body;

  if (!email) {
    console.log('🧪 sendOtpToTypedEmail - No email provided');
    return res.status(400).json({ error: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  setOtp(email, otp);
  console.log("🧪 Direct OTP request:", { email, otp });

  try {
    await sendOTP({
      to: email,
      subject: type || "Your OTP Code",
      body: `Your OTP is ${otp}`,
    });

    console.log('🧪 OTP sent successfully:', { email });
    return res.status(200).json({ message: "OTP sent directly to email ✅" });
  } catch (err) {
    console.error("❌ Failed to send direct OTP:", err.message, { email });
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};
exports.handleBuyCrypto = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const user = req.user;

    const txn = new Transaction({
      from: user._id,
      to: null,
      amount,
      note: note || "Buy Crypto",
      status: "pending",
      type: "crypto",
      recipient: "Crypto Purchase",
      toIban: "CRYPTO-WALLET",
    });

    await txn.save();

    user.transactions.push(txn._id);
    await user.save();

    res.status(201).json({ message: "Buy Crypto request submitted and pending approval." });
  } catch (err) {
    console.error("❌ Buy Crypto Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.handlePayBill = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const user = req.user;

    const txn = new Transaction({
      from: user._id,
      to: null,
      amount,
      note: note || "Bill Payment",
      status: "pending",
      type: "bill",
      recipient: "Bill Payment",
      toIban: "BILLER-WALLET",
    });

    await txn.save();

    user.transactions.push(txn._id);
    await user.save();

    res.status(201).json({ message: "Bill Payment request submitted and pending approval." });
  } catch (err) {
    console.error("❌ Pay Bill Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};