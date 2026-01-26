// controllers/admin.controller.js (FULL EDIT)
const mongoose = require("mongoose");
const User = require("../models/User");

// ⚠️ IMPORTANT: make sure this matches your actual filename on Render (case-sensitive)
const Transaction = require("../models/transaction");

const TopUp = require("../models/TopUp");
const { faker } = require("@faker-js/faker");
const TxnCap = require("../models/TxnCap");

// your mail sender util (you already use sendOTP as “send mail”)
const { sendOTP } = require("../utils/sendOTP");

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────
const isReplicaTxnError = (err) =>
  /Transaction numbers are only allowed|replica set member|mongos/i.test(
    err?.message || ""
  );

async function withMongoTransaction(work) {
  // Try session transaction first
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {}
    // If DB doesn't support transactions (not a replica set), retry without session
    if (isReplicaTxnError(err)) {
      console.warn("⚠️ Mongo transactions not supported here. Retrying without session.");
      return work(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
}

// Fixes "$inc on non-numeric" / "$addToSet on non-array" crashes caused by bad old documents
async function ensureNumericAndArrayFields(userId, session = null) {
  // Pipeline update lets us coerce types safely (Mongo 4.2+)
  // If your Mongo version is older, this will fail — but most managed DBs are fine.
  const opts = session ? { session } : {};
  try {
    await User.updateOne(
      { _id: userId },
      [
        {
          $set: {
            balance: {
              $cond: [
                { $isNumber: "$balance" },
                "$balance",
                {
                  $cond: [
                    { $and: [{ $ne: ["$balance", null] }, { $ne: ["$balance", ""] }] },
                    { $toDouble: "$balance" },
                    0,
                  ],
                },
              ],
            },
            savings: {
              $cond: [{ $isNumber: "$savings" }, "$savings", { $ifNull: [{ $toDouble: "$savings" }, 0] }],
            },
            credits: {
              $cond: [{ $isNumber: "$credits" }, "$credits", { $ifNull: [{ $toDouble: "$credits" }, 0] }],
            },
            transactions: {
              $cond: [{ $isArray: "$transactions" }, "$transactions", []],
            },
          },
        },
      ],
      opts
    );
  } catch (e) {
    // Non-fatal: if pipeline updates unsupported, your schema migration should fix it.
    console.warn("⚠️ ensureNumericAndArrayFields skipped:", e.message);
  }
}

// ───────────────────────────────────────────────────────────────
// Dashboard statistics
// ───────────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const users = await User.find();
    const transactions = await Transaction.find();

    const totalUsers = users.length;
    const blockedUsers = users.filter((u) => u.isBlocked).length;
    const totalBalance = users.reduce((sum, u) => sum + (Number(u.balance) || 0), 0);
    const totalTxns = transactions.length;

    console.log("🧪 getDashboardStats", { totalUsers, totalTxns, totalBalance, blockedUsers });
    res.json({ totalUsers, totalTxns, totalBalance, blockedUsers });
  } catch (err) {
    console.error("❌ Failed to fetch dashboard stats", { error: err.message });
    res.status(500).json({ error: "Server error fetching stats" });
  }
};

// ───────────────────────────────────────────────────────────────
// Get all users
// ───────────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    console.log("🧪 getAllUsers", { userCount: users.length });
    res.json(users);
  } catch (err) {
    console.error("❌ Failed to fetch users", { error: err.message });
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// ───────────────────────────────────────────────────────────────
// Block/Unblock user
// ───────────────────────────────────────────────────────────────
exports.toggleBlockUser = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("🧪 toggleBlockUser - Invalid userId", { userId });
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("🧪 toggleBlockUser - User not found", { userId });
      return res.status(404).json({ error: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    console.log("🧪 toggleBlockUser", { userId, isBlocked: user.isBlocked });

    res.json({
      message: `User is now ${user.isBlocked ? "blocked" : "unblocked"}`,
      user: { isBlocked: user.isBlocked },
    });
  } catch (err) {
    console.error("❌ Failed to update user status", { userId, error: err.message });
    res.status(500).json({ error: "Failed to update user status" });
  }
};

// ───────────────────────────────────────────────────────────────
// Update user balances
// ───────────────────────────────────────────────────────────────
exports.editUserBalance = async (req, res) => {
  const { userId } = req.params;
  const { totalCredit, savings, credits } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("🧪 editUserBalance - Invalid userId", { userId });
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Optional: coerce old docs before editing
    await ensureNumericAndArrayFields(userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log("🧪 editUserBalance - User not found", { userId });
      return res.status(404).json({ error: "User not found" });
    }

    if (typeof totalCredit === "number") user.balance = totalCredit;
    if (typeof savings === "number") user.savings = savings;
    if (typeof credits === "number") user.credits = credits;

    await user.save();

    console.log("🧪 editUserBalance", { userId, newBalance: user.balance });
    res.json({ message: "User balances updated successfully" });
  } catch (err) {
    console.error("❌ Edit balance error", { userId, error: err.message });
    res.status(500).json({ error: "Failed to update balance" });
  }
};

// ───────────────────────────────────────────────────────────────
// Pending transfers
// ───────────────────────────────────────────────────────────────
exports.getPendingTransfers = async (req, res) => {
  try {
    const pendingTransfers = await Transaction.find({ status: "pending" })
      .populate("from to")
      .sort({ createdAt: -1 });

    console.log("🧪 getPendingTransfers", { count: pendingTransfers.length });
    res.json(pendingTransfers);
  } catch (err) {
    console.error("❌ Failed to fetch pending transfers", { error: err.message });
    res.status(500).json({ error: "Failed to fetch pending transfers" });
  }
};

// ───────────────────────────────────────────────────────────────
// Transfer history
// ───────────────────────────────────────────────────────────────
exports.getTransferHistory = async (req, res) => {
  try {
    const history = await Transaction.find({ status: { $in: ["approved", "rejected"] } })
      .populate("from to")
      .sort({ date: -1, createdAt: -1 });

    console.log("🧪 getTransferHistory", { count: history.length });
    res.json(history);
  } catch (err) {
    console.error("❌ Error loading transfer history", { error: err.message });
    res.status(500).json({ error: "Failed to load transaction history" });
  }
};

// ───────────────────────────────────────────────────────────────
// Approve/Reject transfer  (FIXED + resilient)
// ───────────────────────────────────────────────────────────────
exports.handleTransaction = async (req, res) => {
  const { transactionId, action } = req.body;

  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    console.log("🧪 handleTransaction - Invalid transactionId", { transactionId });
    return res.status(400).json({ error: "Invalid transaction ID" });
  }
  if (!["approve", "reject"].includes(action)) {
    console.log("🧪 handleTransaction - Invalid action", { action });
    return res.status(400).json({ error: "Invalid action" });
  }

  try {
    const result = await withMongoTransaction(async (session) => {
      const q = Transaction.findById(transactionId).populate("from to");
      if (session) q.session(session);
      const transaction = await q;

      if (!transaction || transaction.status !== "pending") {
        return { ok: false, code: 400, error: "Invalid or already processed transaction" };
      }

      const sender = transaction.from;
      if (!sender) {
        return { ok: false, code: 404, error: "Sender not found" };
      }

      const amt = Number(transaction.amount || 0);
      if (!Number.isFinite(amt) || amt <= 0) {
        return { ok: false, code: 400, error: "Invalid amount" };
      }

      // ✅ coerce old broken docs (prevents $inc / $addToSet crashing)
      await ensureNumericAndArrayFields(sender._id, session);
      if (transaction.to?._id) await ensureNumericAndArrayFields(transaction.to._id, session);

      if (action === "approve") {
        // ✅ Atomic debit
        const debitRes = await User.updateOne(
          { _id: sender._id, balance: { $gte: amt } },
          { $inc: { balance: -amt }, $addToSet: { transactions: transaction._id } },
          session ? { session } : {}
        );

        if (debitRes.modifiedCount === 0) {
          return { ok: false, code: 400, error: "Insufficient balance" };
        }

        // ✅ Credit receiver (internal)
        if (transaction.to) {
          const receiverId = transaction.to._id || transaction.to;
          const creditRes = await User.updateOne(
            { _id: receiverId },
            { $inc: { balance: amt }, $addToSet: { transactions: transaction._id } },
            session ? { session } : {}
          );

          if (creditRes.matchedCount === 0) {
            return { ok: false, code: 404, error: "Receiver not found" };
          }
        }

        transaction.status = "approved";
      } else {
        transaction.status = "rejected";
      }

      if (session) {
        await transaction.save({ session });
      } else {
        await transaction.save();
      }

      return { ok: true, senderEmail: sender.email, senderName: sender.name, amt, transaction };
    });

    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }

    // Non-critical email after DB work
    try {
      const { transaction, amt, senderEmail, senderName } = result;

      if (senderEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
        const emailSubject =
          action === "approve" ? "Transfer Approved - Transaction Summary" : "Transfer Rejected";

        const emailHtml =
          action === "approve"
            ? `
          <div style="font-family:Poppins, sans-serif; max-width:600px; margin:auto; padding:2rem; background:#121212; color:#f5f5f5; border-radius:10px; border:1px solid #333;">
            <img src="https://thecredibe.com/credibe.png" alt="Credibe" style="height:40px; margin-bottom:1.5rem;" />
            <h2 style="color:#00b4d8;">✅ Transfer Approved</h2>
            <p style="font-size:15px; margin:1rem 0;">Hi ${senderName || "Customer"},</p>
            <div style="margin:1.5rem 0; padding:1rem; background:#1f1f1f; border-radius:8px; border:1px solid #444;">
              <p><strong>💳 Amount:</strong> $${amt.toFixed(2)}</p>
              <p><strong>📨 Recipient:</strong> ${transaction.recipient || "N/A"}</p>
              <p><strong>🏦 IBAN:</strong> ${transaction.toIban || "N/A"}</p>
              <p><strong>📝 Note:</strong> ${transaction.note || "N/A"}</p>
              <p><strong>🆔 Transaction ID:</strong> ${transaction._id}</p>
              <p><strong>📅 Date:</strong> ${new Date(transaction.date || Date.now()).toLocaleDateString("en-GB")}</p>
            </div>
            <p style="font-size:12px; color:#888; text-align:center;">Credibe</p>
          </div>
        `
            : `
          <div style="font-family:Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #e0e0e0; border-radius:8px;">
            <h2 style="color:#c0392b;">Transfer Rejected</h2>
            <p>Dear ${senderName || "Customer"},</p>
            <p>Your transfer of <strong>$${amt.toFixed(2)}</strong> has been rejected.</p>
            <p>Transaction ID: ${transaction._id}</p>
            <p style="font-size:12px;color:#777;">If you believe this is an error, contact support.</p>
          </div>
        `;

        await sendOTP({
          to: senderEmail,
          subject: emailSubject,
          body: emailHtml,
          isHtml: true,
        });
      }
    } catch (emailError) {
      console.error("❌ Non-critical email error", { error: emailError.message });
    }

    return res.status(200).json({ message: `Transaction ${action}d` });
  } catch (err) {
    console.error("❌ Admin TXN Error", {
      transactionId,
      action,
      error: err.message,
      stack: err.stack,
    });

    // ✅ show debug only in dev
    const payload =
      process.env.NODE_ENV === "production"
        ? { error: "Failed to process transaction" }
        : { error: "Failed to process transaction", debug: err.message };

    return res.status(500).json(payload);
  }
};

// ───────────────────────────────────────────────────────────────
// Pending top-ups
// ───────────────────────────────────────────────────────────────
exports.getPendingTopUps = async (req, res) => {
  try {
    const pending = await TopUp.find({ status: "pending" }).populate("user", "email");
    console.log("🧪 getPendingTopUps", { count: pending.length });
    res.json(pending);
  } catch (err) {
    console.error("❌ Failed to fetch top-ups", { error: err.message });
    res.status(500).json({ error: "Failed to fetch top-ups" });
  }
};

exports.approveTopUp = async (req, res) => {
  try {
    const { id } = req.params;
    const topUp = await TopUp.findById(id).populate("user");

    if (!topUp || topUp.status !== "pending") {
      return res.status(400).json({ error: "Invalid or already processed top-up" });
    }

    // coerce old user doc first
    await ensureNumericAndArrayFields(topUp.user._id);

    topUp.status = "approved";
    await topUp.save();

    topUp.user.balance = (Number(topUp.user.balance) || 0) + Number(topUp.amount || 0);
    await topUp.user.save();

    res.json({ message: "Top-up approved and balance updated" });
  } catch (err) {
    console.error("❌ Approve Error", { id: req.params?.id, error: err.message });
    res.status(500).json({ error: "Failed to approve top-up" });
  }
};

exports.rejectTopUp = async (req, res) => {
  try {
    const { id } = req.params;
    const topUp = await TopUp.findById(id).populate("user");

    if (!topUp || topUp.status !== "pending") {
      return res.status(400).json({ error: "Invalid or already processed top-up" });
    }

    topUp.status = "rejected";
    await topUp.save();

    res.json({ message: "Top-up request rejected" });
  } catch (err) {
    console.error("❌ Reject Error", { id: req.params?.id, error: err.message });
    res.status(500).json({ error: "Failed to reject top-up" });
  }
};

// ───────────────────────────────────────────────────────────────
// Notifications
// ───────────────────────────────────────────────────────────────
exports.sendNotification = async (req, res) => {
  const { userId, subject, message, isHtml } = req.body;

  if (!userId || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await sendOTP({ to: user.email, subject, body: message, isHtml: !!isHtml });
    res.json({ message: "Notification sent successfully" });
  } catch (err) {
    console.error("❌ Failed to send notification", { userId, error: err.message });
    res.status(500).json({ error: "Failed to send notification" });
  }
};

// ───────────────────────────────────────────────────────────────
// Inject fake transactions
// ───────────────────────────────────────────────────────────────
exports.injectFakeTransactions = async (req, res) => {
  const { userId, count = 25 } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    return res.status(400).json({ error: "Count must be between 1 and 100" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await Transaction.deleteMany({ from: userId, note: /^FAKE:/ });

    const fakeTxns = [];
    for (let i = 0; i < Math.min(count, 100); i++) {
      const isCompany = Math.random() < 0.4;
      const recipient = isCompany ? faker.company.name() : faker.person.fullName();
      const date = faker.date.past({ years: 1 });

      fakeTxns.push({
        from: user._id,
        to: null,
        recipient,
        toIban: faker.finance.iban(),
        amount: Math.floor(Math.random() * 5000 + 50),
        note: `FAKE:${faker.finance.transactionType()}`,
        type: Math.random() < 0.5 ? "debit" : "credit",
        status: "approved",
        date,
      });
    }

    await Transaction.insertMany(fakeTxns);
    res.status(200).json({ message: "Fake transactions injected ✅" });
  } catch (err) {
    console.error("❌ Inject Fake Transactions Error", { userId, count, error: err.message });
    res.status(500).json({ error: "Failed to inject fake transactions" });
  }
};

// ───────────────────────────────────────────────────────────────
// Txn Cap (freeze)
// ───────────────────────────────────────────────────────────────
exports.setTxnCap = async (req, res) => {
  const { userId } = req.params;
  let { capDate, inclusive = true, perStream, note = "" } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(userId).select("_id");
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!capDate) {
      const fallback = perStream && (perStream.sent || perStream.received)
        ? perStream.sent || perStream.received
        : null;
      if (!fallback) {
        return res.status(400).json({ error: "Provide capDate or perStream.sent/received" });
      }
      capDate = fallback;
    }

    const normalize = (v) => (v ? new Date(v) : null);

    const update = {
      capDate: normalize(capDate),
      inclusive: !!inclusive,
      note: note || "",
      // ✅ FIX: your auth sets req.user.id (not req.user._id)
      updatedBy: req.user?.id || null,
    };

    if (perStream) {
      update.perStream = {
        sent: normalize(perStream.sent),
        received: normalize(perStream.received),
        inclusive: perStream.inclusive !== false,
      };
    }

    const doc = await TxnCap.findOneAndUpdate(
      { userId },
      { $set: update },
      { upsert: true, new: true }
    );

    res.json({ message: "Cap saved", cap: doc });
  } catch (err) {
    console.error("❌ setTxnCap error", { userId, error: err.message });
    res.status(500).json({ error: "Failed to set transaction cap" });
  }
};

exports.getTxnCap = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const cap = await TxnCap.findOne({ userId });
    res.json({ cap: cap || null });
  } catch (err) {
    console.error("❌ getTxnCap error", { userId, error: err.message });
    res.status(500).json({ error: "Failed to fetch transaction cap" });
  }
};

// ───────────────────────────────────────────────────────────────
// Admin create transaction (internal)
// ───────────────────────────────────────────────────────────────
exports.adminCreateTransaction = async (req, res) => {
  const {
    userId,
    direction,
    counterpartyUserId,
    amount,
    status = "approved",
    date,
    note = "",
    toIban = "",
    recipient = "",
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(counterpartyUserId)) {
    return res.status(400).json({ error: "Invalid user IDs" });
  }
  if (!["sent", "received"].includes(direction)) {
    return res.status(400).json({ error: 'direction must be "sent" or "received"' });
  }
  if (amount == null || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  try {
    const out = await withMongoTransaction(async (session) => {
      const [primaryUser, counterparty] = await Promise.all([
        session ? User.findById(userId).session(session) : User.findById(userId),
        session ? User.findById(counterpartyUserId).session(session) : User.findById(counterpartyUserId),
      ]);

      if (!primaryUser || !counterparty) {
        return { ok: false, code: 404, error: "User or counterparty not found" };
      }

      await ensureNumericAndArrayFields(primaryUser._id, session);
      await ensureNumericAndArrayFields(counterparty._id, session);

      const isSent = direction === "sent";

      const computedRecipient = isSent
        ? recipient || counterparty.name || counterparty.email || "Recipient"
        : primaryUser.name || primaryUser.email || "Incoming";

      const computedIban = isSent ? toIban || counterparty.iban || "N/A" : primaryUser.iban || "N/A";

      const txnDoc = {
        from: isSent ? primaryUser._id : counterparty._id,
        to: isSent ? counterparty._id : primaryUser._id,
        recipient: computedRecipient,
        toIban: computedIban,
        amount: Number(amount),
        type: isSent ? "debit" : "credit",
        status,
        date: date ? new Date(date) : new Date(),
        note,
      };

      const created = await Transaction.create([txnDoc], session ? { session } : undefined);
      const txn = created[0];

      if (status === "approved") {
        if (isSent) {
          const ok = await User.updateOne(
            { _id: primaryUser._id, balance: { $gte: txn.amount } },
            { $inc: { balance: -txn.amount }, $addToSet: { transactions: txn._id } },
            session ? { session } : {}
          );
          if (ok.modifiedCount === 0) return { ok: false, code: 400, error: "Insufficient balance on sender" };

          await User.updateOne(
            { _id: counterparty._id },
            { $inc: { balance: txn.amount }, $addToSet: { transactions: txn._id } },
            session ? { session } : {}
          );
        } else {
          const ok = await User.updateOne(
            { _id: counterparty._id, balance: { $gte: txn.amount } },
            { $inc: { balance: -txn.amount }, $addToSet: { transactions: txn._id } },
            session ? { session } : {}
          );
          if (ok.modifiedCount === 0) return { ok: false, code: 400, error: "Insufficient balance on counterparty" };

          await User.updateOne(
            { _id: primaryUser._id },
            { $inc: { balance: txn.amount }, $addToSet: { transactions: txn._id } },
            session ? { session } : {}
          );
        }
      } else {
        await User.updateOne(
          { _id: primaryUser._id },
          { $addToSet: { transactions: txn._id } },
          session ? { session } : {}
        );
        await User.updateOne(
          { _id: counterparty._id },
          { $addToSet: { transactions: txn._id } },
          session ? { session } : {}
        );
      }

      const populated = await Transaction.findById(txn._id).populate("from to");
      return { ok: true, populated };
    });

    if (!out.ok) return res.status(out.code).json({ error: out.error });

    return res.status(201).json({ message: "Transaction created", transaction: out.populated });
  } catch (err) {
    console.error("❌ adminCreateTransaction error", { error: err.message, stack: err.stack });
    return res.status(500).json({
      error: "Failed to create transaction",
      ...(process.env.NODE_ENV === "production" ? {} : { debug: err.message }),
    });
  }
};
