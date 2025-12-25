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
 * @param {string} userId - User's unique identifier
 * @param {Object} predicates - Current user stats (e.g., {lesson_completed: 5, streak: 3})
 * @returns {Array} Array of newly awarded badge IDs
 */
async function awardIfEligible(userId, predicates) {
  // Get or create user's badge document
  const doc = await UserBadges.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, earned: [] } },
    { new: true, upsert: true }
  );

  // Track already earned badges to avoid duplicates
  const alreadyEarned = new Set(doc.earned.map(e => e.badgeId));
  const newlyAwarded = [];

  // Check each badge in catalog for eligibility
  for (const badge of BADGE_CATALOG) {
    const { id, criteria } = badge;
    const current = predicates[criteria.type] || 0;
    
    // Check if user meets the criteria
    const meets = criteria.value ? current >= criteria.value : current > 0;

    // Award badge if eligible and not already earned
    if (meets && !alreadyEarned.has(id)) {
      doc.earned.push({
        badgeId: id,
        earnedAt: new Date(),
        meta: { at: current } // Store the stat value when earned
      });
      newlyAwarded.push(id);
    }
  }

  // Save if any new badges were awarded
  if (newlyAwarded.length) await doc.save();
  return newlyAwarded;
}

module.exports = {
  getEarned,
  awardIfEligible
};
