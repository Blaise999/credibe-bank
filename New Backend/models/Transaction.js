// models/transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // sender
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,  // stays null until approved; set on approval so it shows in "Received"
    },
    recipient: {
      type: String,
      required: true,
    },
    toIban: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      default: 'Transfer',
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      default: 'debit',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    receipt: {
      type: String,
    },
  },
  { timestamps: true }
);

/** 🔎 Indexes for fast Sent/Received/date filters */
transactionSchema.index({ from: 1, createdAt: -1 });       // Sent: by sender
transactionSchema.index({ to: 1, createdAt: -1 });         // Received: by recipient
transactionSchema.index({ status: 1, createdAt: -1 });     // Filter by status quickly
transactionSchema.index({ date: -1 });                     // Your explicit 'date' field

// Check if model exists before defining
module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
