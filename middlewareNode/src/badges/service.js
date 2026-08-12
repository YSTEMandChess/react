/**
 * Badge Service
 * 
 * Manages badge awards and eligibility checking for users.
 * Handles awarding badges based on user achievements and progress.
 * 
 * Functions:
 * - getEarned: Retrieves all badges earned by a user
 * - awardIfEligible: Checks criteria and awards new eligible badges
 */

const UserBadges = require("../models/UserBadges");
const { BADGE_CATALOG } = require("./catalog");

/**
 * Retrieves all badges earned by a user
 * 
 * @param {string} userId - User's unique identifier
 * @returns {Array} Array of earned badge objects with badgeId, earnedAt, and meta
 */
async function getEarned(userId) {
  const doc = await UserBadges.findOne({ userId });
  return doc?.earned || [];
}

/**
 * Checks badge eligibility and awards new badges
 *
 * Compares user's current stats (predicates) against badge criteria.
 * Awards any newly eligible badges that the user hasn't earned yet.
 *
 * Each eligible badge is appended with its own atomic, conditional
 * findOneAndUpdate — the filter requires the badge to still be absent
 * from `earned` at write time, so two concurrent calls can't both pass
 * a read-modify-write race and duplicate the same badge (EDGE-02).
 * MongoDB serializes concurrent updates to the same document; only one
 * of two simultaneous conditional pushes for the same badgeId can match.
 *
 * @param {string} userId - User's unique identifier
 * @param {Object} predicates - Current user stats (e.g., {lesson_completed: 5, streak: 3})
 * @returns {Array} Array of newly awarded badge IDs
 */
async function awardIfEligible(userId, predicates) {
  // Ensure the user's badge document exists.
  await UserBadges.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, earned: [] } },
    { upsert: true }
  );

  const newlyAwarded = [];

  for (const badge of BADGE_CATALOG) {
    const { id, criteria } = badge;
    const current = predicates[criteria.type] || 0;
    const meets = criteria.value ? current >= criteria.value : current > 0;
    if (!meets) continue;

    // Atomic: only pushes if badgeId isn't already present. If two calls
    // race, at most one matches this filter and actually appends.
    const result = await UserBadges.updateOne(
      { userId, "earned.badgeId": { $ne: id } },
      { $push: { earned: { badgeId: id, earnedAt: new Date(), meta: { at: current } } } }
    );

    if (result.modifiedCount > 0) newlyAwarded.push(id);
  }

  return newlyAwarded;
}

module.exports = {
  getEarned,
  awardIfEligible
};
