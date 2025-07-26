// models/User.js
const mongoose = require("mongoose");
const { resend } = require("../utils/sendOTP"); // ✅ Make sure resend is exported from sendOTP.js

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: ""
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ""
  },
  password: {
    type: String,
    required: true
  },
  iban: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  balance: {
    type: Number,
    default: 0
  },
  savings: {
    type: Number,
    default: 0
  },
  credits: {
    type: Number,
    default: 0
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction"
  }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
    trim: true
  },
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ✅ Middleware: Send block email if user is newly blocked
userSchema.pre('save', async function (next) {
  if (this.isModified('isBlocked') && this.isBlocked === true) {
    try {
      await resend.emails.send({
        from: "no-reply@credibe.com",
        to: this.email,
        subject: "🚫 Your Credibe Account Has Been Restricted",
        html: `
         <div style="font-family: Poppins, sans-serif; max-width: 600px; margin: auto; padding: 2rem; background: #1f1f1f; color: #e0e0e0; border-radius: 10px; border: 1px solid #333;">
  <img src="https://thecredibe.com/credibe.png" alt="Credibe Logo" style="height: 40px; margin-bottom: 1.5rem;" />

  <h2 style="color: #00b4d8; margin-bottom: 1rem;">Account Access Restricted</h2>

  <p style="font-size: 15px; line-height: 1.6;">
    Dear ${this.name || this.email},
  </p>

  <p style="font-size: 14px; line-height: 1.6; margin-top: 1rem;">
    We’ve temporarily restricted access to your Credibe account following a review of recent activities that appear to violate our platform's usage policies and risk protocols.
  </p>

  <p style="font-size: 14px; line-height: 1.6; margin-top: 1rem;">
    Our system flagged abnormal activity, including access attempts from multiple unverified IP addresses, which contradicts our security compliance measures.
  </p>

  <p style="font-size: 14px; line-height: 1.6; margin-top: 1rem;">
    In accordance with our safety standards and fraud prevention rules, your dashboard, transfers, and account operations have been suspended pending further review.
  </p>

  <p style="font-size: 14px; line-height: 1.6; margin-top: 1rem;">
    If you believe this action was made in error or would like to appeal the restriction, please reach out to our compliance team at
    <a href="mailto:support@credibe.com" style="color: #00b4d8;">support@credibe.com</a>.
  </p>

  <hr style="border: none; border-top: 1px solid #333; margin: 2rem 0;" />

  <p style="font-size: 13px; color: #888;">
    Thank you for choosing Credibe.  
    <br />
    – Credibe Risk & Compliance Team
  </p>
</div>

        `
      });

      console.log(`📩 Auto-block email sent to ${this.email}`);
    } catch (err) {
      console.error("❌ Failed to send block email from middleware:", err.message);
    }
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
