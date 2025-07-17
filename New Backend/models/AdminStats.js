const mongoose = require("mongoose");

const adminStatsSchema = new mongoose.Schema({
  totalUsers: { type: Number, default: 2 },
  totalTransfers: { type: Number, default: 0 },
  dailyVolume: { type: Number, default: 0 }
});

module.exports = mongoose.model("AdminStats", adminStatsSchema);
