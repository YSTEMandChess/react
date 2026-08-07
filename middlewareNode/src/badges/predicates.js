/**
 * Badge Predicates
 *
 * Computes real, server-verified stat values for badge eligibility checks.
 * Exists so POST /badges/:userId/check-and-award never trusts a client-
 * supplied predicates body — a caller previously could fabricate any value
 * (e.g. {streak: 999999}) and be awarded a badge they hadn't earned.
 *
 * Reuses the same aggregation helpers as the leaderboard and analytics
 * dashboard (utils/studentStats) so a badge's "streak" here always means
 * the same thing as "streak" everywhere else in the app.
 */

const Users = require("../models/users");
const { getUserStreak, getActivitiesCompleted } = require("../utils/studentStats");

/**
 * Counts a user's completed lessons from users.lessonsCompleted.
 *
 * Every user gets the full lesson catalog by default (models/defaultLessons.js),
 * each entry starting at lessonNumber: 0 — that's "no progress on this piece,"
 * not "completed." routes/lessons.js only ever writes lessonNumber >= 1 when
 * real progress is recorded (lessonNum + 1), so >0 is the correct completion
 * signal, not merely the field's presence (an earlier version of this
 * function checked presence and awarded first_lesson to every new signup —
 * caught by a real end-to-end run, not the mocked unit tests).
 */
async function getLessonsCompletedCount(username) {
  const user = await Users.findOne({ username }, { lessonsCompleted: 1 });
  if (!user || !user.lessonsCompleted) return 0;
  return user.lessonsCompleted.filter((entry) => (entry.lessonNumber || 0) > 0).length;
}

/**
 * Builds the predicates object for a given username, keyed to match the
 * criteria.type values used in badges/catalog.js.
 */
async function computeBadgePredicates(username) {
  const user = await Users.findOne({ username }, { _id: 1 });
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  const [streak, activitiesDays, lessonsCompleted] = await Promise.all([
    getUserStreak(username),
    getActivitiesCompleted(user._id),
    getLessonsCompletedCount(username),
  ]);

  return {
    streak,
    activities_days: activitiesDays,
    lesson_completed: lessonsCompleted,
  };
}

module.exports = { computeBadgePredicates, getLessonsCompletedCount };
