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

const STREAK_REQUIRED_EVENT_TYPES = ["lesson", "puzzle"];

/**
 * Groups raw TimeTracking-shaped events into a { day: Set<eventType> } map,
 * keyed by UTC date string. Skips records missing startTime/eventType.
 * Shared by getUserStreak and getStreakSummary so both derive from the
 * same day-bucketing logic.
 */
function groupEventsByDay(events) {
  const daysMap = {};
  for (const e of events) {
    if (!e.startTime || !e.eventType) continue;
    const day = new Date(e.startTime).toISOString().slice(0, 10);
    if (!daysMap[day]) daysMap[day] = new Set();
    daysMap[day].add(e.eventType);
  }
  return daysMap;
}

/** True when a day's event-type set includes both 'lesson' and 'puzzle'. */
function isDayCompleted(daySet) {
  return STREAK_REQUIRED_EVENT_TYPES.every((r) => daySet.has(r));
}

/**
 * Calculates current consecutive-day streak for a user.
 * A day counts when both 'lesson' and 'puzzle' events exist.
 *
 * Note: iterates only days present in the data — a calendar day with zero
 * recorded events is invisible to this algorithm, not treated as a gap.
 * This is documented, existing behavior (see tests), not a bug.
 */
async function getUserStreak(username) {
  const events = await TimeTracking.find({ username }, { eventType: 1, startTime: 1, _id: 0 });
  const daysMap = groupEventsByDay(events);
  let streak = 0;
  for (const day of Object.keys(daysMap).sort().reverse()) {
    if (isDayCompleted(daysMap[day])) streak++;
    else break;
  }
  return streak;
}

/**
 * Full streak summary for a user — current streak, longest streak ever,
 * and the most recent completed date. This is the single source of truth
 * behind GET /streak (routes/streak.js), which previously duplicated this
 * day-bucketing logic independently and could silently disagree with
 * getUserStreak (used by Leaderboard/Badges) for the same user.
 *
 * currentStreak here matches getUserStreak's result exactly (same
 * reverse-chronological walk); this function additionally derives
 * longestStreak/lastCompletedDate from the same day map in one pass.
 */
async function getStreakSummary(username) {
  const events = await TimeTracking.find({ username }, { eventType: 1, startTime: 1, _id: 0 }).lean();
  const daysMap = groupEventsByDay(events);
  const allDates = Object.keys(daysMap).sort();

  let longestStreak = 0;
  let lastCompletedDate = null;
  let running = 0;
  for (const date of allDates) {
    if (isDayCompleted(daysMap[date])) {
      running++;
      longestStreak = Math.max(longestStreak, running);
      lastCompletedDate = date;
    } else {
      running = 0;
    }
  }
  // running, after the forward walk above, equals the streak ending on the
  // most recent recorded day — i.e. currentStreak — since allDates is
  // sorted ascending and nothing after the last date can extend it further.
  const currentStreak = running;

  return { currentStreak, longestStreak, lastCompletedDate };
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
  getStreakSummary,
  getActivitiesCompleted,
  getBadgesEarned,
  isDayCompleted,
};
