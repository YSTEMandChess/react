/**
 * Student Stats Helpers
 *
 * Shared per-student aggregation logic used by both the admin analytics
 * dashboard (routes/analytics.js) and the student-facing leaderboard
 * (routes/leaderboard.js). Extracted so both features always compute the
 * same numbers from the same source data — a student's time stats, streak,
 * activities completed, and badges earned should never disagree between
 * the two features.
 */

const TimeTracking = require("../models/timeTracking");
const Activities = require("../models/activities");
const UserBadges = require("../models/UserBadges");

/** Builds a MongoDB $gte/$lte filter for startTime, skipped when params missing. */
function dateFilter(from, to) {
  if (!from && !to) return {};
  const f = {};
  if (from) f.$gte = new Date(from);
  if (to) f.$lte = new Date(to);
  return { startTime: f };
}

/**
 * Aggregates time tracking records for one user into hours per event type.
 * @returns {{ totalTimeHours, gameTimeHours, lessonTimeHours, puzzleTimeHours, mentorTimeHours }}
 */
async function getUserTimeStats(username, from, to) {
  const filter = { username, ...dateFilter(from, to) };
  const events = await TimeTracking.find(filter, { eventType: 1, totalTime: 1, _id: 0 });

  const secs = { play: 0, lesson: 0, puzzle: 0, mentor: 0 };
  for (const e of events) {
    if (secs[e.eventType] !== undefined) secs[e.eventType] += e.totalTime;
  }

  const toHours = (s) => Math.round((s / 3600) * 100) / 100;
  return {
    totalTimeHours: toHours(secs.play + secs.lesson + secs.puzzle + secs.mentor),
    gameTimeHours: toHours(secs.play),
    lessonTimeHours: toHours(secs.lesson),
    puzzleTimeHours: toHours(secs.puzzle),
    mentorTimeHours: toHours(secs.mentor),
  };
}

/**
 * Calculates current consecutive-day streak for a user.
 * A day counts when both 'lesson' and 'puzzle' events exist.
 */
async function getUserStreak(username) {
  const events = await TimeTracking.find({ username }, { eventType: 1, startTime: 1, _id: 0 });
  const daysMap = {};
  for (const e of events) {
    if (!e.startTime || !e.eventType) continue;
    const day = new Date(e.startTime).toISOString().slice(0, 10);
    if (!daysMap[day]) daysMap[day] = new Set();
    daysMap[day].add(e.eventType);
  }
  const required = ["lesson", "puzzle"];
  let streak = 0;
  for (const day of Object.keys(daysMap).sort().reverse()) {
    if (required.every((r) => daysMap[day].has(r))) streak++;
    else break;
  }
  return streak;
}

/**
 * Counts days in completedDates within the optional date range.
 * Activities.userId is an ObjectId — pass user._id.
 */
async function getActivitiesCompleted(userId, from, to) {
  const doc = await Activities.findOne({ userId }, { completedDates: 1, _id: 0 });
  if (!doc) return 0;
  const dates = doc.completedDates || [];
  if (!from && !to) return dates.length;
  const f = from ? new Date(from) : null;
  const t = to ? new Date(to) : null;
  return dates.filter((d) => {
    const dt = new Date(d);
    if (f && dt < f) return false;
    if (t && dt > t) return false;
    return true;
  }).length;
}

/**
 * Returns total badge count for a user.
 * UserBadges.userId is the username string.
 */
async function getBadgesEarned(username) {
  const doc = await UserBadges.findOne({ userId: username }, { earned: 1, _id: 0 });
  return doc ? (doc.earned || []).length : 0;
}

module.exports = {
  dateFilter,
  getUserTimeStats,
  getUserStreak,
  getActivitiesCompleted,
  getBadgesEarned,
};
