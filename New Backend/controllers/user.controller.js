// controllers/user.controller.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const TxnCap = require('../models/TxnCap'); // ✅ shared TxnCap model
const { sendOTP } = require("../utils/sendOTP");
const { setOtp, getOtp, clearOtp, otpStore } = require("../utils/otpMemory");

/**
 * Create user with some initial fake transactions (dev convenience)
 */
exports.createUser = async (req, res) => {
  const { email, name, password } = req.body;

  try {
    console.log('🧪 createUser called:', { email, name, at: new Date().toISOString() });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });

    user = new User({ email, name, password, balance: 1000 });
    await user.save();

    const transactionCount = Math.floor(Math.random() * 11) + 10; // 10–20
    const companies = [
      'Delhaize', 'IKEA', 'ING Bank', 'BNP Paribas', 'SNCB',
      'Colruyt', 'Proximus', 'Carrefour', 'Decathlon', 'Zalando'
    ];
    const personalNames = ['Emma Dupont', 'Lucas Maes', 'Julie Michiels', 'Noah Janssen'];
    const pickName = () =>
      Math.random() < 0.7
        ? companies[Math.floor(Math.random() * companies.length)]
        : personalNames[Math.floor(Math.random() * personalNames.length)];

    const createdIds = [];

    for (let i = 0; i < transactionCount; i++) {
      const recipient = pickName();
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - randomDaysAgo);
      date.setHours(0, 0, 0, 0);

      const amount = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;

      const fakeTxn = new Transaction({
        from: user._id,
        to: null,
        recipient,
        amount,
        status: 'approved',
        note: 'Fake transaction',
        toIban: 'BE00 0000 0000 0000',
        type: 'debit',
        date, // field used by dashboard
      });

      await fakeTxn.save();
      createdIds.push(fakeTxn._id);
    }

    user.transactions.push(...createdIds);
    await user.save();

    return res.status(201).json({ message: 'User created with initial transactions' });
  } catch (err) {
    console.error('❌ Error creating user with transactions:', err.message, { email });
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * Unified transaction fetcher (user-facing):
 * - Supports ?days=all | N
 * - Supports ?type=sent|received
 * - Enforces TxnCap as a *view freeze*: show (≤ cap) OR (≥ exceptAfter)
 *
 * Example:
 *   /api/user/transactions/:userId?type=sent&days=all
 *   /api/user/transactions/:userId?type=received&days=30
 */
exports.getUserTransactions = async (req, res) => {
  const userId = req.params.userId;
  const daysQuery = req.query.days;
  const typeQuery = (req.query.type || '').toLowerCase(); // 'sent' | 'received'

  try {
    // Direction -> base match (schema uses from/to + type enum)
    const isSent = typeQuery === 'sent';
    const base = isSent
      ? { from: userId, type: 'debit' }
      : { to: userId, type: 'credit' };

    const andConds = [ base ]; // we'll $and everything
    let orConds = null;        // your special "days" logic kept intact

    if (daysQuery !== 'all') {
      const days = parseInt(daysQuery, 10);
      if (!Number.isNaN(days) && days > 0) {
        // keep your special windows intact
        const july26Start = new Date('2025-07-26T00:00:00.000Z');
        const july26End   = new Date('2025-07-27T00:00:00.000Z');
        const march26Cap  = new Date('2025-03-26T23:59:59.999Z');

        orConds = [
          { date: { $gte: july26Start, $lt: july26End } }, // real for July 26 only
          { date: { $lte: march26Cap } },                  // fakes up to March 26
        ];
      }
    }

    // ⬇️ Apply TxnCap as a *band* filter: (≤ cap) OR (≥ exceptAfter)
    const capDoc = await TxnCap.findOne({ userId }).lean();
    if (capDoc) {
      const per = capDoc.perStream || {};
      const hasPerSent = !!per.sent;
      const hasPerRecv = !!per.received;

      const globalInc = capDoc.inclusive !== false;
      const perInc = per.inclusive !== false;

      // Cap that applies to this direction
      const capDate = isSent
        ? (per.sent || capDoc.capDate)
        : (per.received || capDoc.capDate);

      // Resume visibility for this direction
      const excAfter = isSent
        ? (per.exceptAfter?.sent || capDoc.exceptAfter)
        : (per.exceptAfter?.received || capDoc.exceptAfter);

      const legBefore = capDate
        ? {
            date: ( (hasPerSent || hasPerRecv)
              ? (perInc ? { $lte: new Date(capDate) } : { $lt: new Date(capDate) })
              : (globalInc ? { $lte: new Date(capDate) } : { $lt: new Date(capDate) })
            )
          }
        : null;

      const legAfter = excAfter
        ? { date: { $gte: new Date(excAfter) } }
        : null;

      const bandOr = [];
      if (legBefore) bandOr.push(legBefore);
      if (legAfter) bandOr.push(legAfter);

      if (bandOr.length > 0) {
        andConds.push({ $or: bandOr });
      }
      // If no cap & no exceptAfter, we add nothing (user sees all that match `base`)
    }

    // Compose final query
    let query = andConds.length > 1 ? { $and: andConds } : andConds[0];
    if (orConds) {
      query = { $and: [ query, { $or: orConds } ] };
    }

    const txns = await Transaction.find(query)
      .populate('from to')
      .sort({ date: -1, createdAt: -1 });

    console.log('🧪 Transactions fetched:', { count: txns.length, userId, type: typeQuery || 'all' });
    return res.status(200).json(txns);
  } catch (err) {
    console.error('❌ Fetch Transactions Error:', err.message, { userId });
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * 🔐 Step 1: Request OTP before transfer (Used by dashboard)
 */
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

/**
 * Step 2: Initiate Transfer (user-facing)
 * - Creates pending debit txn
 * - Bumps perStream.exceptAfter.sent so new txns reappear after cap
 */
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

    // ⬇️ Bump resume-visibility for "sent" stream so new txns (>= when) reappear
    try {
      const when = txn.date || txn.createdAt || new Date();
      await TxnCap.updateOne(
        { userId: sender._id },
        { $max: { 'perStream.exceptAfter.sent': when } },
        { upsert: true }
      );
    } catch (e) {
      console.error('⚠️ Failed to bump exceptAfter.sent:', e.message);
    }

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
};

/**
 * ✅ Step 3: Send OTP via email (memory-only)
 */
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

/**
 * ✅ Extra: Send OTP to typed email (no user lookup)
 */
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

/**
 * Current user profile (used by Settings page)
 * Requires auth middleware to set req.user.id
 */
exports.me = async (req, res) => {
  try {
    const u = await User.findById(req.user.id)
      .select('name email phone avatarUrl balance savings credits role');

    if (!u) return res.status(404).json({ error: 'Not found' });
    return res.json(u);
  } catch (e) {
    console.error('❌ /me error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
