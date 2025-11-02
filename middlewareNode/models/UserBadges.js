const mongoose = require("mongoose");

const EarnedSchema = new mongoose.Schema({
  badgeId: { type: String, required: true, index: true },
  earnedAt: { type: Date, default: Date.now },
  meta: { type: Object, default: {} }
}, { _id: false });

const UserBadgesSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  earned: { type: [EarnedSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("UserBadges", UserBadgesSchema);
