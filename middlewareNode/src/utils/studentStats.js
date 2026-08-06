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
const GameResults = require("../models/gameResults");

/**
 * Weights for the student-vs-student chess score.
 *
 * Deliberately smaller than the engagement weights in routes/leaderboard.js:
 * competitive results are an unvalidated signal so far, and this score is
 * reported as its own stat rather than blended into the engagement score —
 * so these numbers can be retuned without disturbing anything else.
 *
 * Because the score is computed on read from GameResults records, changing a
 * weight re-scores all history immediately; there is nothing to backfill.
 */
const CHESS_WEIGHTS = {
  win: numOr(process.env.PVP_WEIGHT_WIN, 3),
  draw: numOr(process.env.PVP_WEIGHT_DRAW, 1),
  loss: numOr(process.env.PVP_WEIGHT_LOSS, 0),
};

/** parseFloat with a default that survives a legitimate 0 (unlike `|| default`). */
function numOr(value, fallback) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

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

/**
 * Turns a win/draw/loss tally into the chess score. The ONLY place the score
 * formula lives, so the leaderboard, the analytics dashboard and
 * GET /gameResults/:username can never disagree about it.
 */
function chessScoreFrom({ wins, draws, losses }) {
  return Math.round(
    wins * CHESS_WEIGHTS.win + draws * CHESS_WEIGHTS.draw + losses * CHESS_WEIGHTS.loss
  );
}

/** Empty record — used for students with no games, so callers never see nulls. */
function emptyChessRecord() {
  return { wins: 0, draws: 0, losses: 0, gamesPlayed: 0, chessScore: 0 };
}

/** Builds a $gte/$lte filter on playedAt, skipped when both params are missing. */
function playedAtFilter(from, to) {
  if (!from && !to) return {};
  const f = {};
  if (from) f.$gte = new Date(from);
  if (to) f.$lte = new Date(to);
  return { playedAt: f };
}

/**
 * One student's student-vs-student record, computed on read from GameResults.
 * @returns {{wins, draws, losses, gamesPlayed, chessScore}}
 */
async function getChessRecord(username, from, to) {
  const docs = await GameResults.find(
    { players: username, ...playedAtFilter(from, to) },
    { result: 1, winnerUsername: 1, _id: 0 }
  );

  const record = emptyChessRecord();
  for (const d of docs) {
    if (d.result === "draw") record.draws++;
    else if (d.winnerUsername === username) record.wins++;
    else record.losses++;
  }
  record.gamesPlayed = docs.length;
  record.chessScore = chessScoreFrom(record);
  return record;
}

/**
 * Batched form of getChessRecord for the leaderboard, which needs records for a
 * whole page of students at once. One aggregation instead of one query per
 * student — the per-student stats are already 4 queries each, so this keeps the
 * chess column from adding a fifth.
 *
 * @param {string[]} usernames
 * @returns {Promise<Map<string, {wins, draws, losses, gamesPlayed, chessScore}>>}
 *          Every requested username is present; those with no games get zeros.
 */
async function getChessRecords(usernames, from, to) {
  const records = new Map(usernames.map((u) => [u, emptyChessRecord()]));
  if (usernames.length === 0) return records;

  const docs = await GameResults.find(
    { players: { $in: usernames }, ...playedAtFilter(from, to) },
    { players: 1, result: 1, winnerUsername: 1, _id: 0 }
  );

  for (const d of docs) {
    for (const username of d.players) {
      const record = records.get(username);
      if (!record) continue; // the opponent isn't on this page
      if (d.result === "draw") record.draws++;
      else if (d.winnerUsername === username) record.wins++;
      else record.losses++;
      record.gamesPlayed++;
    }
  }

  for (const record of records.values()) {
    record.chessScore = chessScoreFrom(record);
  }
  return records;
}

module.exports = {
  dateFilter,
  getUserTimeStats,
  getUserStreak,
  getActivitiesCompleted,
  getBadgesEarned,
  getChessRecord,
  getChessRecords,
  chessScoreFrom,
  CHESS_WEIGHTS,
};
