const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/transaction');

// 📌 Create user with initial fake transactions
exports.createUser = async (req, res) => {
  const { email, name, password } = req.body;

  try {
    console.log('🧪 createUser called with:', { email, name, timestamp: new Date().toISOString() });

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    user = new User({ email, name, password, balance: 1000 });
    await user.save();

    const transactionCount = Math.floor(Math.random() * 11) + 10;
    const companies = [
      "Delhaize", "IKEA", "ING Bank", "BNP Paribas", "SNCB", "Colruyt", "Proximus",
      "Carrefour", "Decathlon", "Zalando"
    ];
    const personalNames = ["Emma Dupont", "Lucas Maes", "Julie Michiels", "Noah Janssen"];
    const getRandomName = () => Math.random() < 0.7
      ? companies[Math.floor(Math.random() * companies.length)]
      : personalNames[Math.floor(Math.random() * personalNames.length)];

    const transactions = [];

    for (let i = 0; i < transactionCount; i++) {
      const recipient = getRandomName();
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
        status: "approved",
        note: "Fake transaction",
        toIban: "BE00 0000 0000 0000",
        type: "debit",
        date // ✅ Important: this is the field used in dashboard
      });

      await fakeTxn.save();
      transactions.push(fakeTxn._id);
    }

    user.transactions.push(...transactions);
    await user.save();

    res.status(201).json({ message: 'User created with initial transactions' });
  } catch (err) {
    console.error("❌ Error creating user with transactions:", err.message, { email });
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// ✅ FIXED: Unified transaction fetcher with optional ?days param
exports.getUserTransactions = async (req, res) => {
  const userId = req.params.userId;
  const daysQuery = req.query.days;

  try {
    const query = { from: userId };

    // Optional filter by ?days
    if (daysQuery !== 'all') {
      const days = parseInt(daysQuery);
      if (!isNaN(days) && days > 0) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        query.date = { $gte: fromDate }; // ✅ using `date` field for filtering
      }
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    console.log('🧪 Transactions fetched:', { count: transactions.length, userId });

    res.status(200).json(transactions);
  } catch (err) {
    console.error("❌ Fetch Transactions Error:", err.message, { userId });
    res.status(500).json({ error: "Server error" });
  }
};
