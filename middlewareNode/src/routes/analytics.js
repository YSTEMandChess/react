/**
 * Analytics Routes  —  /analytics/*
 *
 * Admin-only endpoints for the Expand Analytics dashboard.
 * All routes are protected by adminGuard (JWT + role=admin).
 *
 * Endpoints:
 *   Individual student
 *     GET /analytics/students/search?keyword=X
 *     GET /analytics/student/:username?from=&to=
 *     GET /analytics/student/:username/chart?months=6
 *     GET /analytics/student/:username/events?skip=0&limit=20
 *
 *   Zipcode aggregated
 *     GET /analytics/zipcode?zipcode=X&from=&to=
 *     GET /analytics/zipcode/all?from=&to=
 *
 *   Global aggregated
 *     GET /analytics/global?from=&to=
 *     GET /analytics/global/trend?months=6
 *
 * Time units: all durations returned in HOURS (timeTracking stores seconds).
 * eventType mapping: "play" → gameTime, "lesson" → lessonTime,
 *                    "puzzle" → puzzleTime, "mentor" → mentorTime
 */

const express = require("express");
const router = express.Router();
const Users       = require("../models/users");
const TimeTracking = require("../models/timeTracking");
const Activities  = require("../models/activities");
const UserBadges  = require("../models/UserBadges");

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Builds a MongoDB $gte/$lte filter for startTime, skipped when params missing. */
function dateFilter(from, to) {
  if (!from && !to) return {};
  const f = {};
  if (from) f.$gte = new Date(from);
  if (to)   f.$lte = new Date(to);
  return { startTime: f };
}

/**
 * Returns an error string if the param is present but not a valid date,
 * or null if the param is absent or valid.
 */
function validateDate(val, name) {
  if (val === undefined || val === "") return null;
  return isNaN(new Date(val).getTime())
    ? `${name} must be a valid date (YYYY-MM-DD)`
    : null;
}

/** Validates from/to query params; returns an error string or null. */
function validateDateRange(from, to) {
  return validateDate(from, "from") || validateDate(to, "to");
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
    totalTimeHours:  toHours(secs.play + secs.lesson + secs.puzzle + secs.mentor),
    gameTimeHours:   toHours(secs.play),
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
  const t = to   ? new Date(to)   : null;
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

// ─────────────────────────────────────────────────────────────
// Individual student endpoints
// ─────────────────────────────────────────────────────────────

/**
 * GET /analytics/students/search?keyword=X
 * Search students by username, first name, or last name (case-insensitive).
 */
router.get("/students/search", async (req, res) => {
  try {
    const { keyword = "" } = req.query;
    if (!keyword.trim()) return res.status(400).json({ error: "keyword is required" });

    const regex = new RegExp(keyword.trim(), "i");
    const results = await Users.find(
      { role: "student", $or: [{ username: regex }, { firstName: regex }, { lastName: regex }] },
      { username: 1, firstName: 1, lastName: 1, email: 1, _id: 0 }
    ).limit(50);

    res.json(results);
  } catch (err) {
    console.error("analytics /students/search:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /analytics/student/:username?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns full profile and engagement stats for one student.
 */
router.get("/student/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { from, to } = req.query;
    const dateErr = validateDateRange(from, to);
    if (dateErr) return res.status(400).json({ error: dateErr });

    const user = await Users.findOne({ username }, { password: 0 });
    if (!user) return res.status(404).json({ error: "Student not found" });

    const [timeStats, currentStreak, activitiesCompleted, badgesEarned] = await Promise.all([
      getUserTimeStats(username, from, to),
      getUserStreak(username),
      getActivitiesCompleted(user._id, from, to),
      getBadgesEarned(username),
    ]);

    res.json({
      profile: {
        username:         user.username,
        firstName:        user.firstName,
        lastName:         user.lastName,
        email:            user.email,
        zipcode:          user.zipcode   || null,
        gender:           user.gender    || null,
        gradeLevel:       user.gradeLevel || null,
        accountCreatedAt: user.accountCreatedAt,
      },
      stats: { ...timeStats, currentStreak, activitiesCompleted, badgesEarned },
    });
  } catch (err) {
    console.error("analytics /student/:username:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /analytics/student/:username/chart?months=6
 * Monthly time breakdown for up to N months — mirrors timeTracking/graph-data logic.
 */
router.get("/student/:username/chart", async (req, res) => {
  try {
    const { username } = req.params;
    const months = Math.min(parseInt(req.query.months) || 6, 24);
    const now  = new Date();
    const then = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const events = await TimeTracking.find(
      { username, startTime: { $gte: then, $lte: now } },
      { eventType: 1, startTime: 1, totalTime: 1, _id: 0 }
    );

    // Build month buckets for each relevant event type
    const types = ["play", "lesson", "puzzle", "mentor"];
    const buckets = {}; // { "2026-01": { play:0, lesson:0, ... } }
    for (const e of events) {
      const d  = new Date(e.startTime);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!buckets[ym]) buckets[ym] = { play: 0, lesson: 0, puzzle: 0, mentor: 0 };
      if (buckets[ym][e.eventType] !== undefined) buckets[ym][e.eventType] += e.totalTime;
    }

    // Build ordered month labels + series arrays
    const monthLabels = [];
    const series = { gameTime: [], lessonTime: [], puzzleTime: [], mentorTime: [] };

    for (let i = months - 1; i >= 0; i--) {
      const d  = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthLabels.push(d.toLocaleString("en-US", { month: "short" }));
      const b = buckets[ym] || {};
      series.gameTime.push(  Math.round(((b.play   || 0) / 3600) * 100) / 100);
      series.lessonTime.push(Math.round(((b.lesson || 0) / 3600) * 100) / 100);
      series.puzzleTime.push(Math.round(((b.puzzle || 0) / 3600) * 100) / 100);
      series.mentorTime.push(Math.round(((b.mentor || 0) / 3600) * 100) / 100);
    }

    res.json({ months: monthLabels, series });
  } catch (err) {
    console.error("analytics /student/:username/chart:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /analytics/student/:username/events?skip=0&limit=20
 * Paginated activity feed — excludes website events, latest first.
 */
router.get("/student/:username/events", async (req, res) => {
  try {
    const { username } = req.params;
    const { from, to } = req.query;
    const dateErr = validateDateRange(from, to);
    if (dateErr) return res.status(400).json({ error: dateErr });
    const skip  = Math.max(parseInt(req.query.skip)  || 0, 0);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const filter = { username, eventType: { $ne: "website" }, ...dateFilter(from, to) };

    const [events, total] = await Promise.all([
      TimeTracking.find(filter, { eventType: 1, eventName: 1, startTime: 1, totalTime: 1, _id: 0 })
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit),
      TimeTracking.countDocuments(filter),
    ]);

    res.json({ events, hasMore: skip + limit < total });
  } catch (err) {
    console.error("analytics /student/:username/events:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// Zipcode aggregated endpoints
// ─────────────────────────────────────────────────────────────

/**
 * GET /analytics/zipcode?zipcode=X&from=&to=
 * Returns avg time per event type for all students in a zipcode,
 * plus the global average for comparison.
 */
router.get("/zipcode", async (req, res) => {
  try {
    const { zipcode, from, to } = req.query;
    if (!zipcode) return res.status(400).json({ error: "zipcode is required" });
    const dateErr = validateDateRange(from, to);
    if (dateErr) return res.status(400).json({ error: dateErr });

    const usersInZip = await Users.find({ zipcode, role: "student" }, { username: 1, _id: 0 });
    if (usersInZip.length === 0)
      return res.json({ zipcode, totalStudents: 0, avgTotalTimeHours: 0,
        avgGameTimeHours: 0, avgLessonTimeHours: 0, avgPuzzleTimeHours: 0,
        avgStreakDays: 0, globalAvgTotalTimeHours: 0 });

    const usernames = usersInZip.map((u) => u.username);
    const df = dateFilter(from, to);

    // Aggregate total seconds per user for each event type
    const pipeline = [
      { $match: { username: { $in: usernames }, eventType: { $ne: "website" }, ...df } },
      { $group: {
          _id: "$username",
          play:   { $sum: { $cond: [{ $eq: ["$eventType", "play"]   }, "$totalTime", 0] } },
          lesson: { $sum: { $cond: [{ $eq: ["$eventType", "lesson"] }, "$totalTime", 0] } },
          puzzle: { $sum: { $cond: [{ $eq: ["$eventType", "puzzle"] }, "$totalTime", 0] } },
          mentor: { $sum: { $cond: [{ $eq: ["$eventType", "mentor"] }, "$totalTime", 0] } },
      }},
    ];

    const rows = await TimeTracking.aggregate(pipeline);
    const toH = (s) => s / 3600;
    const n   = usernames.length;
    const sum = rows.reduce((a, r) => ({
      play:   a.play   + toH(r.play),
      lesson: a.lesson + toH(r.lesson),
      puzzle: a.puzzle + toH(r.puzzle),
      mentor: a.mentor + toH(r.mentor),
    }), { play: 0, lesson: 0, puzzle: 0, mentor: 0 });

    const avg = (v) => Math.round((v / n) * 100) / 100;

    // Global average for comparison (all students, same date range)
    const allStudents = await Users.find({ role: "student" }, { username: 1, _id: 0 });
    const allUsernames = allStudents.map((u) => u.username);
    const globalAgg = await TimeTracking.aggregate([
      { $match: { username: { $in: allUsernames }, ...df } },
      { $group: { _id: null, total: { $sum: "$totalTime" } } },
    ]);
    const globalTotal = globalAgg[0]?.total || 0;
    const globalAvg = allStudents.length
      ? Math.round((toH(globalTotal) / allStudents.length) * 100) / 100
      : 0;

    // Avg streak per zipcode user
    const streaks = await Promise.all(usernames.map(getUserStreak));
    const avgStreak = Math.round((streaks.reduce((a, s) => a + s, 0) / n) * 10) / 10;

    res.json({
      zipcode,
      totalStudents:        usernames.length,
      avgTotalTimeHours:    avg(sum.play + sum.lesson + sum.puzzle + sum.mentor),
      avgGameTimeHours:     avg(sum.play),
      avgLessonTimeHours:   avg(sum.lesson),
      avgPuzzleTimeHours:   avg(sum.puzzle),
      avgStreakDays:        avgStreak,
      globalAvgTotalTimeHours: globalAvg,
    });
  } catch (err) {
    console.error("analytics /zipcode:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /analytics/zipcode/all?from=&to=
 * Summary row for every zipcode that has at least one student.
 */
router.get("/zipcode/all", async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateErr = validateDateRange(from, to);
    if (dateErr) return res.status(400).json({ error: dateErr });
    const df = dateFilter(from, to);

    // Group students by zipcode
    const usersByZip = await Users.aggregate([
      { $match: { role: "student", zipcode: { $ne: null } } },
      { $group: { _id: "$zipcode", usernames: { $push: "$username" } } },
    ]);

    const results = await Promise.all(
      usersByZip.map(async ({ _id: zipcode, usernames }) => {
        const agg = await TimeTracking.aggregate([
          { $match: { username: { $in: usernames }, eventType: { $ne: "website" }, ...df } },
          { $group: { _id: null, total: { $sum: "$totalTime" } } },
        ]);
        const totalHours = (agg[0]?.total || 0) / 3600;
        return {
          zipcode,
          totalStudents:   usernames.length,
          avgTotalTimeHours: Math.round((totalHours / usernames.length) * 100) / 100,
        };
      })
    );

    res.json(results.sort((a, b) => b.totalStudents - a.totalStudents));
  } catch (err) {
    console.error("analytics /zipcode/all:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// Global aggregated endpoints
// ─────────────────────────────────────────────────────────────

/**
 * GET /analytics/global?from=&to=
 * Platform-wide KPIs: total users, active users, time by event type, gender breakdown.
 */
router.get("/global", async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateErr = validateDateRange(from, to);
    if (dateErr) return res.status(400).json({ error: dateErr });
    const df = dateFilter(from, to);

    const [totalUsers, eventAgg, genderAgg] = await Promise.all([
      Users.countDocuments({ role: "student" }),

      // Time breakdown by event type across all users
      TimeTracking.aggregate([
        { $match: { eventType: { $ne: "website" }, ...df } },
        { $group: {
            _id: "$eventType",
            totalSecs: { $sum: "$totalTime" },
            uniqueUsers: { $addToSet: "$username" },
        }},
      ]),

      // Per-user totals joined with gender from users collection
      TimeTracking.aggregate([
        { $match: { eventType: { $ne: "website" }, ...df } },
        { $group: { _id: "$username", totalSecs: { $sum: "$totalTime" } } },
        { $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "username",
            as: "userInfo",
        }},
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
        { $group: {
            _id: { $ifNull: ["$userInfo.gender", "Unknown"] },
            count: { $sum: 1 },
            totalSecs: { $sum: "$totalSecs" },
        }},
      ]),
    ]);

    // Count unique active users across all event types
    const activeSet = new Set();
    const byEventType = {};
    for (const row of eventAgg) {
      row.uniqueUsers.forEach((u) => activeSet.add(u));
      const key = row._id === "play" ? "gameTime" : `${row._id}Time`;
      byEventType[key] = Math.round((row.totalSecs / 3600) * 100) / 100;
    }

    const byGender = {};
    for (const row of genderAgg) {
      byGender[row._id] = {
        count:    row.count,
        avgHours: Math.round((row.totalSecs / 3600 / row.count) * 100) / 100,
      };
    }

    const totalHours = Object.values(byEventType).reduce((a, v) => a + v, 0);

    res.json({
      totalUsers,
      activeUsersInPeriod: activeSet.size,
      totalHours:          Math.round(totalHours * 100) / 100,
      byEventType:         { gameTime: 0, lessonTime: 0, puzzleTime: 0, mentorTime: 0, ...byEventType },
      byGender,
    });
  } catch (err) {
    console.error("analytics /global:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /analytics/global/trend?months=6
 * Monthly active user count and total hours for the trend line chart.
 */
router.get("/global/trend", async (req, res) => {
  try {
    const months = Math.min(parseInt(req.query.months) || 6, 24);
    const now    = new Date();
    const then   = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const events = await TimeTracking.find(
      { startTime: { $gte: then, $lte: now }, eventType: { $ne: "website" } },
      { username: 1, startTime: 1, totalTime: 1, _id: 0 }
    );

    // Bucket by year-month
    const buckets = {}; // { "2026-01": { users: Set, secs: 0 } }
    for (const e of events) {
      const d  = new Date(e.startTime);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!buckets[ym]) buckets[ym] = { users: new Set(), secs: 0 };
      buckets[ym].users.add(e.username);
      buckets[ym].secs += e.totalTime;
    }

    const monthLabels = [];
    const activeUsers = [];
    const totalHours  = [];

    for (let i = months - 1; i >= 0; i--) {
      const d  = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthLabels.push(d.toLocaleString("en-US", { month: "short" }));
      const b = buckets[ym] || { users: new Set(), secs: 0 };
      activeUsers.push(b.users.size);
      totalHours.push(Math.round((b.secs / 3600) * 100) / 100);
    }

    res.json({ months: monthLabels, activeUsers, totalHours });
  } catch (err) {
    console.error("analytics /global/trend:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
