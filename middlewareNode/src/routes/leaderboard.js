/**
 * Leaderboard Routes  —  /leaderboard
 *
 * Student-facing endpoint returning ranked students by a composite score.
 * Protected by requireAuth (valid JWT, any role) — NOT admin-only, unlike
 * /analytics, since students need to view the leaderboard themselves.
 *
 * Score is computed on read from existing per-student stats (time played,
 * streak, activities completed, badges earned) via utils/studentStats —
 * the same helpers the admin analytics dashboard uses, so the two features
 * can never silently disagree about a student's numbers.
 *
 * Score weights are configurable via env vars so they can be tuned per
 * environment without a deploy:
 *   LEADERBOARD_WEIGHT_TIME     (default 1)   — per hour of puzzle+lesson time
 *   LEADERBOARD_WEIGHT_STREAK   (default 5)   — per consecutive-day streak
 *   LEADERBOARD_WEIGHT_BADGE    (default 10)  — per badge earned
 *   LEADERBOARD_WEIGHT_ACTIVITY (default 3)   — per activity completed
 *
 * GET /leaderboard?country=&state=&school=&skip=0&limit=20
 */

const express = require("express");
const router = express.Router();
const Users = require("../models/users");
const {
  getUserTimeStats,
  getUserStreak,
  getActivitiesCompleted,
  getBadgesEarned,
} = require("../utils/studentStats");
const { getAvatarUrl } = require("../utils/avatars");

const WEIGHTS = {
  time: parseFloat(process.env.LEADERBOARD_WEIGHT_TIME) || 1,
  streak: parseFloat(process.env.LEADERBOARD_WEIGHT_STREAK) || 5,
  badge: parseFloat(process.env.LEADERBOARD_WEIGHT_BADGE) || 10,
  activity: parseFloat(process.env.LEADERBOARD_WEIGHT_ACTIVITY) || 3,
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const MAX_UNFILTERED_CANDIDATES = 500;

/**
 * Builds an exact-match Mongo filter from optional query params.
 * Exact match only (no regex) to avoid ReDoS risk from user-controlled input
 * on a student-facing endpoint.
 */
function buildUserFilter({ country, state, school }) {
  const filter = { role: "student" };
  if (country) filter.country = country;
  if (state) filter.state = state;
  if (school) filter.school = school;
  return filter;
}

/**
 * Computes a composite score for one student from existing stat helpers.
 * Placeholder weighting — confirm with product before treating as final.
 */
async function computeScore(user) {
  const [timeStats, streak, activitiesCompleted, badgesEarned] = await Promise.all([
    getUserTimeStats(user.username),
    getUserStreak(user.username),
    getActivitiesCompleted(user._id),
    getBadgesEarned(user.username),
  ]);

  const timeComponent = (timeStats.puzzleTimeHours + timeStats.lessonTimeHours) * WEIGHTS.time;
  const streakComponent = streak * WEIGHTS.streak;
  const badgeComponent = badgesEarned * WEIGHTS.badge;
  const activityComponent = activitiesCompleted * WEIGHTS.activity;

  const score = Math.round(timeComponent + streakComponent + badgeComponent + activityComponent);
  return score;
}

/**
 * GET /leaderboard
 * Returns ranked students, optionally filtered by country/state/school, paginated.
 */
router.get("/", async (req, res) => {
  try {
    const { country, state, school } = req.query;
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);

    const filter = buildUserFilter({ country, state, school });
    const isFiltered = Boolean(country || state || school);

    let candidates = await Users.find(filter, {
      username: 1,
      country: 1,
      state: 1,
      school: 1,
      avatarKey: 1,
      _id: 1,
    });

    // Unfiltered (global) leaderboard: bound worst-case per-user aggregation
    // cost by capping the candidate set. Known limitation — see backend plan
    // for the precomputed-snapshot approach once roster size requires it.
    if (!isFiltered && candidates.length > MAX_UNFILTERED_CANDIDATES) {
      candidates = candidates.slice(0, MAX_UNFILTERED_CANDIDATES);
    }

    const scored = await Promise.all(
      candidates.map(async (user) => ({
        username: user.username,
        country: user.country || null,
        state: user.state || null,
        school: user.school || null,
        avatarUrl: getAvatarUrl(user.avatarKey),
        score: await computeScore(user),
      }))
    );

    scored.sort((a, b) => b.score - a.score);

    const total = scored.length;
    const page = scored.slice(skip, skip + limit);
    const entries = page.map((entry, idx) => ({
      rank: skip + idx + 1,
      username: entry.username,
      school: entry.school,
      country: entry.country,
      state: entry.state,
      score: entry.score,
      avatarUrl: entry.avatarUrl,
    }));

    res.json({
      entries,
      hasMore: skip + limit < total,
      total,
    });
  } catch (err) {
    console.error("leaderboard /:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
