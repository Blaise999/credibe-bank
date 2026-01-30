// models/transaction.js (FULL EDIT)
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // ✅ External-friendly:
    // - outgoing external: from = userId, to = null
    // - incoming external: from = null, to = userId
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      required: false,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    toIban: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      default: "Transfer",
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      default: "debit",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
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

module.exports =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
