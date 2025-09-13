// models/TxnCap.js
const mongoose = require('mongoose');

const TxnCapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
    // Global cap (applies if perStream not set)
    capDate: { type: Date, required: true },
    inclusive: { type: Boolean, default: true }, // true => <= capDate; false => < capDate

    // Optional per-stream caps (override global when set)
    perStream: {
      sent: { type: Date, default: null },      // applies to type:'debit'
      received: { type: Date, default: null },  // applies to type:'credit'
      inclusive: { type: Boolean, default: true },
    },

    note: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.TxnCap || mongoose.model('TxnCap', TxnCapSchema);
