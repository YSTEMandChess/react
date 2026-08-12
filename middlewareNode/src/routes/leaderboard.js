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
 *   LEADERBOARD_WEIGHT_TIME     (default 0.5) — per hour of puzzle+lesson time
 *   LEADERBOARD_WEIGHT_STREAK   (default 5)   — per consecutive-day streak
 *   LEADERBOARD_WEIGHT_BADGE    (default 10)  — per badge earned
 *   LEADERBOARD_WEIGHT_ACTIVITY (default 3)   — per activity completed
 *
 * Time is deliberately the lightest-weighted input — it's the easiest stat
 * to inflate without real progress (e.g. leaving a lesson open), so it's
 * weighted below streak/activity/badge rather than on equal footing.
 *
 * Response contract matches LeaderboardModal.tsx exactly:
 *   GET /leaderboard/schools    -> { success, schools: string[] }
 *   GET /leaderboard/countries  -> { success, countries: string[] }
 *   GET /leaderboard/states     -> { success, states: string[] }
 *   GET /leaderboard?country=&state=&school=&search=&sortBy=score|name&sortDir=asc|desc&page=1&limit=10
 *     -> { success, data: { leaderboard: [{id, rank, username, school_name,
 *                            country, state, score, avatar_url}],
 *                            pagination: { has_more } } }
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
  time: parseFloat(process.env.LEADERBOARD_WEIGHT_TIME) || 0.5,
  streak: parseFloat(process.env.LEADERBOARD_WEIGHT_STREAK) || 5,
  badge: parseFloat(process.env.LEADERBOARD_WEIGHT_BADGE) || 10,
  activity: parseFloat(process.env.LEADERBOARD_WEIGHT_ACTIVITY) || 3,
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const MAX_UNFILTERED_CANDIDATES = 500;

/**
 * Builds an exact-match Mongo filter from optional query params.
 * Exact match only for country/state/school (no regex) to avoid ReDoS risk
 * on a student-facing endpoint. Name search uses a bounded, anchor-free
 * regex against username only — acceptable here since it's scoped to a
 * capped candidate set, not run across the full collection unbounded.
 */
function buildUserFilter({ country, state, school, search }) {
  const filter = { role: "student" };
  if (country) filter.country = country;
  if (state) filter.state = state;
  if (school) filter.school = school;
  if (search) filter.username = { $regex: escapeRegex(search), $options: "i" };
  return filter;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
 * Builds a GET /leaderboard/<field>s handler returning distinct, non-empty
 * values for that field — shared shape for the schools/countries/states
 * filter-dropdown endpoints.
 */
function distinctFilterValuesRoute(field, responseKey) {
  return async (req, res) => {
    try {
      const values = await Users.distinct(field, {
        role: "student",
        [field]: { $nin: ["", null] },
      });
      res.json({ success: true, [responseKey]: values });
    } catch (err) {
      console.error(`leaderboard /${responseKey}:`, err.message);
      res.status(500).json({ success: false, error: "Server error" });
    }
  };
}

/**
 * GET /leaderboard/schools
 * Distinct, non-empty school names for the school filter dropdown.
 */
router.get("/schools", distinctFilterValuesRoute("school", "schools"));

/**
 * GET /leaderboard/countries
 * Distinct, non-empty country values for the country filter dropdown.
 */
router.get("/countries", distinctFilterValuesRoute("country", "countries"));

/**
 * GET /leaderboard/states
 * Distinct, non-empty state values for the state filter dropdown.
 */
router.get("/states", distinctFilterValuesRoute("state", "states"));

/**
 * GET /leaderboard
 * Returns ranked students, optionally filtered/searched, paginated.
 */
router.get("/", async (req, res) => {
  try {
    const { country, state, school, search, sortBy = "score", sortDir = "desc" } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const filter = buildUserFilter({ country, state, school, search });
    const isFiltered = Boolean(country || state || school || search);

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
        id: String(user._id),
        username: user.username,
        school: user.school || null,
        country: user.country || null,
        state: user.state || null,
        avatarUrl: getAvatarUrl(user.avatarKey),
        score: await computeScore(user),
      }))
    );

    const direction = sortDir === "asc" ? 1 : -1;
    if (sortBy === "name") {
      scored.sort((a, b) => direction * a.username.localeCompare(b.username));
    } else {
      scored.sort((a, b) => direction * (a.score - b.score));
    }

    const total = scored.length;
    const pageSlice = scored.slice(skip, skip + limit);
    const leaderboard = pageSlice.map((entry, idx) => ({
      id: entry.id,
      rank: skip + idx + 1,
      username: entry.username,
      school_name: entry.school,
      country: entry.country,
      state: entry.state,
      score: entry.score,
      avatar_url: entry.avatarUrl,
    }));

    res.json({
      success: true,
      data: {
        leaderboard,
        pagination: { has_more: skip + limit < total, total },
      },
    });
  } catch (err) {
    console.error("leaderboard /:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
