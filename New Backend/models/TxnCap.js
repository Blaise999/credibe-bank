// models/TxnCap.js
const mongoose = require('mongoose');

const txnCapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true },
  capDate: { type: Date, required: true },
  inclusive: { type: Boolean, default: true },

  perStream: {
    sent: { type: Date, default: null },       // applies to type: 'debit'
    received: { type: Date, default: null },   // applies to type: 'credit'
    inclusive: { type: Boolean, default: true },

    // 👇 “resume visibility” markers (banded freeze)
    exceptAfter: {
      sent: { type: Date, default: null },
      received: { type: Date, default: null },
    },
  },

  // optional global fallback for “after” (used if perStream.exceptAfter.* missing)
  exceptAfter: { type: Date, default: null },

  note: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.models.TxnCap || mongoose.model('TxnCap', txnCapSchema);
