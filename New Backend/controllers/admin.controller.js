const mongoose = require("mongoose");
const User = require("../models/User");
const Transaction = require("../models/transaction");
const AdminStats = require("../models/AdminStats");
const generatePDFMonkeyPDF = require("../utils/pdfmonkey");
const sendOTP = require("../utils/sendOTP"); // Changed from sendEmail
const TopUp = require("../models/TopUp");
const { faker } = require("@faker-js/faker");

// 📊 Dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const users = await User.find();
    const transactions = await Transaction.find();

    const totalUsers = users.length;
    const blockedUsers = users.filter(u => u.isBlocked).length;
    const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
    const totalTxns = transactions.length;

    console.log("🧪 getDashboardStats", { totalUsers, totalTxns, totalBalance, blockedUsers });
    res.json({ totalUsers, totalTxns, totalBalance, blockedUsers });
  } catch (err) {
    console.error("❌ Failed to fetch dashboard stats", { error: err.message });
    res.status(500).json({ error: "Server error fetching stats" });
  }
};

// 👥 Get all users
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

// 🔒 Block/Unblock user
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

    res.json({ message: `User is now ${user.isBlocked ? "blocked" : "unblocked"}` });
  } catch (err) {
    console.error("❌ Failed to update user status", { userId, error: err.message });
    res.status(500).json({ error: "Failed to update user status" });
  }
};

// 💳 Update user balances
exports.editUserBalance = async (req, res) => {
  const { userId } = req.params;
  const { totalCredit, savings, credits } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("🧪 editUserBalance - Invalid userId", { userId });
      return res.status(400).json({ error: "Invalid user ID" });
    }

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

// 💸 Approve/Reject Transfer
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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("🧪 handleTransaction called", {
      transactionId,
      action,
      timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
    });

    const transaction = await Transaction.findById(transactionId).populate("from to").session(session);
    if (!transaction || transaction.status !== "pending") {
      console.log("🧪 handleTransaction - Invalid transaction", {
        transactionId,
        status: transaction?.status,
      });
      await session.abortTransaction();
      return res.status(400).json({ error: "Invalid or already processed transaction" });
    }

    const sender = transaction.from;
    if (!sender) {
      console.log("🧪 handleTransaction - Sender not found", { transactionId });
      await session.abortTransaction();
      return res.status(404).json({ error: "Sender not found" });
    }

    if (action === "approve") {
      if (sender.balance < transaction.amount) {
        console.log("🧪 handleTransaction - Insufficient balance", {
          transactionId,
          senderBalance: sender.balance,
          amount: transaction.amount,
        });
        await session.abortTransaction();
        return res.status(400).json({ error: "Insufficient balance" });
      }

      sender.balance -= transaction.amount;
      transaction.status = "approved";

      if (transaction.to) {
        const receiver = transaction.to;
        receiver.balance += transaction.amount;
        receiver.transactions.push(transaction._id);
        await receiver.save({ session });
        console.log("🧪 handleTransaction - Receiver updated", {
          receiverId: receiver._id,
          transactionId,
        });
      }

      if (!sender.transactions.includes(transaction._id)) {
        sender.transactions.push(transaction._id);
        console.log("🧪 handleTransaction - Added to sender transactions", {
          userId: sender._id,
          transactionId,
        });
      }

      await sender.save({ session });
      await transaction.save({ session });
      await session.commitTransaction();

      // 📧 Approval Email
      try {
        if (!sender.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender.email)) {
          throw new Error("Invalid sender email");
        }

        const approvalHtml = `
          <div style="font-family:Poppins, sans-serif; background:#121212; color:#e0e0e0; padding:2rem; border-radius:10px; max-width:600px; margin:auto; border:1px solid #2a2a2a;">
  <div style="text-align:center;">
    <img src="https://thecredible.com/credibe.png" alt="Credibe Logo" style="height:50px; margin-bottom:1rem;" />
    <h2 style="color:#00b4d8; margin:0;">Transfer Approved</h2>
    <p style="margin:0; font-size:14px;">Transaction Summary</p>
  </div>

  <hr style="border:none; border-top:1px solid #333; margin:2rem 0;" />

  <p>Dear ${recipientName || 'Customer'},</p>
  <p>Your transfer has been successfully approved. Below are the transaction details:</p>

  <table style="width:100%; margin-top:1rem; font-size:14px; border-collapse:collapse;">
    <tr style="border-bottom:1px solid #333;">
      <td style="padding:8px;">💸 <strong>Amount</strong></td>
      <td style="padding:8px;">€${amount}</td>
    </tr>
    <tr style="border-bottom:1px solid #333;">
      <td style="padding:8px;">🧾 <strong>Transaction ID</strong></td>
      <td style="padding:8px;">${txn._id}</td>
    </tr>
    <tr style="border-bottom:1px solid #333;">
      <td style="padding:8px;">👤 <strong>Recipient</strong></td>
      <td style="padding:8px;">${recipientName}</td>
    </tr>
    <tr style="border-bottom:1px solid #333;">
      <td style="padding:8px;">🏦 <strong>IBAN</strong></td>
      <td style="padding:8px;">${toIban}</td>
    </tr>
    <tr style="border-bottom:1px solid #333;">
      <td style="padding:8px;">🧠 <strong>Reference</strong></td>
      <td style="padding:8px;">${note || "None"}</td>
    </tr>
    <tr>
      <td style="padding:8px;">📅 <strong>Date</strong></td>
      <td style="padding:8px;">${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Brussels' })}</td>
    </tr>
  </table>

  <p style="margin-top:2rem;">Thank you for using Credibe. If you have any questions, please reach out to <a href="mailto:support@credibe.com" style="color:#00b4d8;">support@credibe.com</a>.</p>

  <p style="color:#888; font-size:13px; margin-top:3rem;">– The Credibe Transactions Team</p>
</div>
        `;

        await sendOTP({
          to: sender.email,
          subject: "Transfer Approved - Transaction Summary",
          body: approvalHtml,
          isHtml: true, // Assuming sendOTP supports HTML emails with an isHtml flag
        });

        console.log("🧪 handleTransaction - Approval email sent", { email: sender.email });
      } catch (emailError) {
        console.error("❌ Non-critical email error", {
          transactionId,
          email: sender.email,
          error: emailError.message,
        });
        // Transaction already committed
      }

      return res.status(200).json({ message: "Transaction approved, summary sent" });
    }

    if (action === "reject") {
      transaction.status = "rejected";
      await transaction.save({ session });
      await session.commitTransaction();

      // 📧 Rejection Email
      try {
        if (!sender.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender.email)) {
          throw new Error("Invalid sender email");
        }

        const rejectionHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #c0392b;">Transfer Rejected</h2>
            <p style="font-size: 16px; color: #34495e;">Dear ${sender.name || 'Customer'},</p>
            <p style="font-size: 16px; color: #34495e;">We regret to inform you that your transfer of <strong>€${transaction.amount}</strong> has been rejected.</p>
            <p style="font-size: 16px; color: #34495e;">Transaction ID: ${transaction._id}</p>
            <p style="font-size: 14px; color: #7f8c8d;">If you believe this is an error or need further assistance, please contact our support team.</p>
            <p style="font-size: 14px; color: #7f8c8d;">Best regards,<br>The Transaction Team</p>
          </div>
        `;

        await sendOTP({
          to: sender.email,
          subject: "Transfer Rejected",
          body: rejectionHtml,
          isHtml: true, // Assuming sendOTP supports HTML emails with an isHtml flag
        });

        console.log("🧪 handleTransaction - Rejection email sent", { email: sender.email });
      } catch (emailError) {
        console.error("❌ Non-critical email error", {
          transactionId,
          email: sender.email,
          error: emailError.message,
        });
      }

      return res.status(200).json({ message: "Transaction rejected" });
    }

  } catch (err) {
    await session.abortTransaction();
    console.error("❌ Admin TXN Error", { transactionId, action, error: err.message });
    return res.status(500).json({ error: "Failed to process transaction" });
  } finally {
    session.endSession();
  }
};

// ⏳ Get Pending Transfers
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

// 📜 Admin Transfer History
exports.getTransferHistory = async (req, res) => {
  try {
    const history = await Transaction.find({ status: { $in: ["approved", "rejected"] } })
      .populate("from to")
      .sort({ createdAt: -1 });

    console.log("🧪 getTransferHistory", { count: history.length });
    res.json(history);
  } catch (err) {
    console.error("❌ Error loading transfer history", { error: err.message });
    res.status(500).json({ error: "Failed to load transaction history" });
  }
};

// 💰 Get Pending Top-Ups
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

// ✅ Approve Top-Up
exports.approveTopUp = async (req, res) => {
  try {
    const { id } = req.params;
    const topUp = await TopUp.findById(id).populate("user");

    if (!topUp || topUp.status !== "pending") {
      console.log("🧪 approveTopUp - Invalid top-up", { id, status: topUp?.status });
      return res.status(400).json({ error: "Invalid or already processed top-up" });
    }

    topUp.status = "approved";
    await topUp.save();

    topUp.user.balance += topUp.amount;
    await topUp.user.save();
    console.log("🧪 approveTopUp", { topUpId: id, userId: topUp.user._id, amount: topUp.amount });

    // Send email notification
    try {
      if (!topUp.user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(topUp.user.email)) {
        throw new Error("Invalid user email");
      }
      await sendOTP({
        to: topUp.user.email,
        subject: "Top-Up Approved",
        body: `Your top-up request of €${topUp.amount} has been approved.`,
      });
      console.log("🧪 approveTopUp - Notification sent", { email: topUp.user.email });
    } catch (emailError) {
      console.error("❌ Non-critical email error", {
        topUpId: id,
        email: topUp.user.email,
        error: emailError.message,
      });
    }

    res.json({ message: "Top-up approved and balance updated" });
  } catch (err) {
    console.error("❌ Approve Error", { id, error: err.message });
    res.status(500).json({ error: "Failed to approve top-up" });
  }
};

// ❌ Reject Top-Up
exports.rejectTopUp = async (req, res) => {
  try {
    const { id } = req.params;
    const topUp = await TopUp.findById(id).populate("user");

    if (!topUp || topUp.status !== "pending") {
      console.log("🧪 rejectTopUp - Invalid top-up", { id, status: topUp?.status });
      return res.status(400).json({ error: "Invalid or already processed top-up" });
    }

    topUp.status = "rejected";
    await topUp.save();
    console.log("🧪 rejectTopUp", { topUpId: id });

    // Send email notification
    try {
      if (!topUp.user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(topUp.user.email)) {
        throw new Error("Invalid user email");
      }
      await sendOTP({
        to: topUp.user.email,
        subject: "Top-Up Rejected",
        body: `Your top-up request of €${topUp.amount} has been rejected.`,
      });
      console.log("🧪 rejectTopUp - Notification sent", { email: topUp.user.email });
    } catch (emailError) {
      console.error("❌ Non-critical email error", {
        topUpId: id,
        email: topUp.user.email,
        error: emailError.message,
      });
    }

    res.json({ message: "Top-up request rejected" });
  } catch (err) {
    console.error("❌ Reject Error", { id, error: err.message });
    res.status(500).json({ error: "Failed to reject top-up" });
  }
};

// 📧 Send Notification
exports.sendNotification = async (req, res) => {
  const { userId, subject, message } = req.body;

  if (!userId || !subject || !message) {
    console.log("🧪 sendNotification - Missing fields", { userId, subject, message });
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("🧪 sendNotification - Invalid userId", { userId });
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("🧪 sendNotification - User not found", { userId });
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      console.log("🧪 sendNotification - Invalid email", { userId, email: user.email });
      return res.status(400).json({ error: "Invalid user email" });
    }

    await sendOTP({ to: user.email, subject, body: message });
    console.log("🧪 sendNotification - Sent", { userId, email: user.email, subject });
    res.json({ message: "Notification sent successfully" });
  } catch (err) {
    console.error("❌ Failed to send notification", { userId, error: err.message });
    res.status(500).json({ error: "Failed to send notification" });
  }
};

// 📥 Inject Fake Transactions
exports.injectFakeTransactions = async (req, res) => {
  const { userId, count = 25 } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.log("🧪 injectFakeTransactions - Invalid userId", { userId });
    return res.status(400).json({ error: "Invalid user ID" });
  }
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    console.log("🧪 injectFakeTransactions - Invalid count", { count });
    return res.status(400).json({ error: "Count must be between 1 and 100" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log("🧪 injectFakeTransactions - User not found", { userId });
      return res.status(404).json({ error: "User not found" });
    }

    const existingFakeTxns = await Transaction.find({ from: userId, isFake: true });
    if (existingFakeTxns.length > 0) {
      await Transaction.deleteMany({ from: userId, isFake: true });
      console.log("🧪 injectFakeTransactions - Deleted existing fake transactions", { userId });
    }

    const fakeTxns = [];
    for (let i = 0; i < Math.min(count, 100); i++) {
      const isCompany = Math.random() < 0.4;
      const recipient = isCompany ? faker.company.name() : faker.person.fullName();
      const date = faker.date.past(1); // Within 1 year, always in past

      fakeTxns.push({
        from: user._id,
        recipient,
        toIban: faker.finance.iban(),
        amount: Math.floor(Math.random() * 5000 + 50),
        note: faker.finance.transactionType(),
        type: Math.random() < 0.5 ? "debit" : "credit",
        status: "approved",
        isFake: true,
        date,
      });
    }

    await Transaction.insertMany(fakeTxns);
    console.log("🧪 injectFakeTransactions - Injected", { userId, count });
    res.status(200).json({ message: `Fake transactions injected ✅` });
  } catch (err) {
    console.error("❌ Inject Fake Transactions Error", { userId, count, error: err.message });
    res.status(500).json({ error: "Failed to inject fake transactions" });
  }
};
