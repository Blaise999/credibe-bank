// controllers/user.controller.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const TxnCap = require('../models/TxnCap'); // ⬅️ NEW

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
 * Unified transaction fetcher:
 * - Supports ?days=all | N
 * - Supports ?type=sent|received
 * - Enforces admin TxnCap (freeze) server-side (global or per-stream, inclusive by default)
 *   so client cannot bypass the cap.
 *
 * Your dashboard can hit:
 *   /api/user/transactions/:userId?type=sent&days=all
 *   /api/user/transactions/:userId?type=received&days=30
 */
exports.getUserTransactions = async (req, res) => {
  const userId = req.params.userId;
  const daysQuery = req.query.days;
  const typeQuery = (req.query.type || '').toLowerCase(); // 'sent' | 'received'

  try {
    // Base query based on direction (your schema uses from/to + type enum)
    const isSent = typeQuery === 'sent';
    const base = isSent
      ? { from: userId, type: 'debit' }
      : { to: userId, type: 'credit' };

    // Build date conditions
    const andConds = [ base ];     // we will $and everything together at the end
    let orConds = null;            // your existing "days" logic

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

    // Apply admin TxnCap (freeze) if exists
    // - perStream.sent applies to 'debit' (sent)
    // - perStream.received applies to 'credit' (received)
    const capDoc = await TxnCap.findOne({ userId }).lean();
    if (capDoc) {
      const streamCap = isSent ? capDoc?.perStream?.sent : capDoc?.perStream?.received;
      const inclusive = (capDoc?.perStream?.sent || capDoc?.perStream?.received)
        ? capDoc.perStream.inclusive !== false
        : capDoc.inclusive !== false;

      const limit = streamCap || capDoc.capDate;
      if (limit) {
        const capClause = inclusive ? { $lte: new Date(limit) } : { $lt: new Date(limit) };
        andConds.push({ date: capClause });
      }
    }

    // If you had a "days" filter producing OR conditions, intersect it with the cap via $and
    let query = andConds.length > 1 ? { $and: andConds } : andConds[0];
    if (orConds) {
      query = { $and: [ query, { $or: orConds } ] };
    }

    const txns = await Transaction.find(query)
      .populate('from to')
      .sort({ date: -1 });

    console.log('🧪 Transactions fetched:', { count: txns.length, userId, type: typeQuery || 'all' });
    return res.status(200).json(txns);
  } catch (err) {
    console.error('❌ Fetch Transactions Error:', err.message, { userId });
    return res.status(500).json({ error: 'Server error' });
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
