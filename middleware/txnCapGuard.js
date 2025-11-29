// middleware/txnCapGuard.js
const TxnCap = require('../models/TxnCap'); // ✅ shared model import

module.exports = async function txnCapGuard(req, res, next) {
  try {
    // Admins bypass caps entirely
    if (req.user?.role === 'admin') return next();

    const userId = (req.user?._id || req.user?.id)?.toString();
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const cap = await TxnCap.findOne({ userId }).lean();
    if (!cap) return next(); // no cap configured => do nothing

    // Determine direction based on incoming body
    const type = String(req.body?.type || '').toLowerCase(); // 'debit' | 'credit' (your user flow sends 'debit' for transfers)
    const isDebit = type === 'debit';
    const isCredit = type === 'credit';

    const per = cap.perStream || {};

    // Which cap applies (per-stream overrides global)
    const limit = isDebit
      ? (per.sent || cap.capDate)
      : isCredit
        ? (per.received || cap.capDate)
        : cap.capDate;

    // Which "inclusive" flag applies
    const hasPerForThisStream = isDebit ? !!per.sent : isCredit ? !!per.received : false;
    const inclusive = hasPerForThisStream ? (per.inclusive !== false) : (cap.inclusive !== false);

    // Optional: attach context for logging/auditing
    req.txnCapContext = {
      hasCap: !!limit,
      limit,
      inclusive,
      scope: isDebit ? 'sent' : isCredit ? 'received' : 'unknown',
    };

    // ✅ DO NOT BLOCK — you use the cap only to LIMIT WHAT THE USER SEES (handled in getUserTransactions)
    // If you ever want a temporary hard freeze, flip an env flag:
    if (process.env.ENFORCE_TXN_CAP === '1' && limit) {
      const now = new Date();
      const withinCap = inclusive ? now <= new Date(limit) : now < new Date(limit);
      if (withinCap) {
        return res.status(403).json({
          error: 'transactions_frozen',
          until: limit,
          scope: req.txnCapContext.scope
        });
      }
    }

    return next();
  } catch (e) {
    console.error('txnCapGuard error:', e.message);
    // Fail-safe: never block on guard error
    return next();
  }
};
