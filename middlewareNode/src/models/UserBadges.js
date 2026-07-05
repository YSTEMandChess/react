/**
 * User Badges Schema
 * 
 * Defines the MongoDB structure for storing user badge achievements.
 * Tracks which badges each user has earned and when they earned them.
 * 
 * Features:
 * - userId is unique and indexed for fast lookups
 * - badgeId is indexed for querying badges earned
 * - Stores metadata about achievement context
 * - Automatic timestamps for document creation/updates
 */

const mongoose = require("mongoose");

/**
 * Sub-schema for individual earned badges
 * Each entry represents one badge earned by the user
 */
const EarnedSchema = new mongoose.Schema({
  badgeId: { type: String, required: true, index: true },  // Badge identifier from catalog
  earnedAt: { type: Date, default: Date.now },            // When badge was earned
  meta: { type: Object, default: {} }                     // Additional context (e.g., stat value when earned)
}, { _id: false });

/**
 * Main schema for user badge collection
 * One document per user containing all their earned badges
 */
const UserBadgesSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },  // User's unique ID
  earned: { type: [EarnedSchema], default: [] }                         // Array of earned badges
}, { timestamps: true });

module.exports = mongoose.model("UserBadges", UserBadgesSchema);
