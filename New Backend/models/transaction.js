const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

module.exports = mongoose.model("Transaction", transactionSchema);
