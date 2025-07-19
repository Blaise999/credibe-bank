const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/transaction');

exports.createUser = async (req, res) => {
  const { email, name, password } = req.body;

  try {
    // Debug: Log incoming request
    console.log('🧪 createUser called with:', { email, name, timestamp: new Date().toISOString() });

    // Check if user already exists
    let user = await User.findOne({ email });
    console.log('🧪 User lookup:', { email, exists: !!user });
    if (user) {
      console.log('🧪 User already exists, blocking creation:', { email, userId: user._id });
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = new User({ email, name, password, balance: 1000 });
    await user.save();
    console.log('🧪 New user created:', { userId: user._id, email });

    // Generate 10–20 fake transactions
    const transactionCount = Math.floor(Math.random() * 11) + 10; // 10–20
    console.log('🧪 Generating fake transactions:', { count: transactionCount });
    const companies = [
      "Delhaize", "IKEA", "ING Bank", "BNP Paribas", "SNCB", "Colruyt", "Proximus",
      "Carrefour", "Decathlon", "Zalando"
    ];
    const personalNames = [
      "Emma Dupont", "Lucas Maes", "Julie Michiels", "Noah Janssen"
    ];
    const getRandomName = () => Math.random() < 0.7
      ? companies[Math.floor(Math.random() * companies.length)]
      : personalNames[Math.floor(Math.random() * personalNames.length)];

    const transactions = [];

    for (let i = 0; i < transactionCount; i++) {
      const recipient = getRandomName();
      const randomDaysAgo = Math.floor(Math.random() * 30); // last 30 days
      const date = new Date();
      date.setDate(date.getDate() - randomDaysAgo);
      date.setHours(0, 0, 0, 0); // Normalize to start of day
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
    date: date // ✅ use custom date field, not createdAt
});

      await fakeTxn.save();
      console.log('🧪 Fake transaction saved:', { transactionId: fakeTxn._id, createdAt: date.toISOString() });
      transactions.push(fakeTxn._id);
    }

    user.transactions.push(...transactions);
    await user.save();
    console.log('🧪 User transactions updated:', { userId: user._id, transactionCount: transactions.length });

    res.status(201).json({ message: 'User created with initial transactions' });
  } catch (err) {
    console.error("❌ Error creating user with transactions:", err.message, { email });
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.params.userId;
    const days = req.query.days || 'all';
    console.log('🧪 getUserTransactions called:', { userId, days, timestamp: new Date().toISOString() });

    const query = {
      $or: [
        { from: userId },
        { to: userId },
        { userId: userId }
      ]
    };

    if (days !== 'all') {
      const daysNum = parseInt(days, 10);
      if (!isNaN(daysNum) && daysNum > 0) {
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - daysNum);
        query.createdAt = { $gte: dateThreshold, $lte: new Date() };
      }
    }

    const transactions = await Transaction.find(query).sort({ createdAt: -1 });
    console.log('🧪 Transactions fetched:', { count: transactions.length, userId });

    // Format dates and log raw values
    const formattedTransactions = transactions.map(txn => {
      const rawCreatedAt = txn.createdAt;
      const formatted = {
        ...txn._doc,
        createdAt: rawCreatedAt ? rawCreatedAt.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : 'Unknown'
      };
      console.log('🧪 Transaction date:', { transactionId: txn._id, rawCreatedAt, formattedCreatedAt: formatted.createdAt });
      return formatted;
    });

    res.json(formattedTransactions);
  } catch (err) {
    console.error("❌ Failed to fetch user transactions:", err.message, { userId });
    res.status(500).json({ error: "Server error" });
  }
};


// 📜 Fetch all user transactions (real + injected fake)
exports.getUserTransactions = async (req, res) => {
  const userId = req.params.userId;
  const days = parseInt(req.query.days) || 90;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  try {
    const transactions = await Transaction.find({
      from: userId,
      date: { $gte: fromDate },
    }).sort({ date: -1 });

    res.status(200).json(transactions);
  } catch (err) {
    console.error("❌ Fetch Transactions Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
