/**
 * Analytics Summary Scheduler
 *
 * Materializes zipcode and global analytics summaries nightly so that
 * the admin dashboard aggregation queries hit pre-computed documents
 * instead of running full collection scans on timeTrackings.
 *
 * Schedule: 02:00 every day  ('0 2 * * *')
 *
 * Output collection: analyticsSummaries
 *   { type: 'global',  date: Date, data: { ... } }
 *   { type: 'zipcode', date: Date, zipcode: String, data: { ... } }
 *
 * Consumers: analytics routes can optionally read from this collection
 * for the "last 24 h" dashboard load, falling back to live queries for
 * custom date ranges.
 */

const schedule  = require("node-schedule");
const mongoose  = require("mongoose");

// ─── helpers ────────────────────────────────────────────────────

function toHours(secs) {
  return Math.round((secs / 3600) * 100) / 100;
}

async function summarizeGlobal(db) {
  const users      = db.collection("users");
  const tracking   = db.collection("timeTrackings");
  const summaries  = db.collection("analyticsSummaries");

  const totalUsers = await users.countDocuments({ role: "student" });

  // Time breakdown by event type + active users
  const eventAgg = await tracking.aggregate([
    { $match: { eventType: { $ne: "website" } } },
    { $group: {
        _id: "$eventType",
        totalSecs:   { $sum: "$totalTime" },
        uniqueUsers: { $addToSet: "$username" },
    }},
  ]).toArray();

  const activeSet  = new Set();
  const byEventType = { gameTime: 0, lessonTime: 0, puzzleTime: 0, mentorTime: 0 };
  for (const row of eventAgg) {
    row.uniqueUsers.forEach((u) => activeSet.add(u));
    const key = row._id === "play" ? "gameTime" : `${row._id}Time`;
    if (key in byEventType) byEventType[key] = toHours(row.totalSecs);
  }

  // Gender breakdown
  const genderAgg = await tracking.aggregate([
    { $match: { eventType: { $ne: "website" } } },
    { $group: { _id: "$username", totalSecs: { $sum: "$totalTime" } } },
    { $lookup: { from: "users", localField: "_id", foreignField: "username", as: "u" } },
    { $unwind: { path: "$u", preserveNullAndEmpty: true } },
    { $group: {
        _id: { $ifNull: ["$u.gender", "Unknown"] },
        count: { $sum: 1 },
        totalSecs: { $sum: "$totalSecs" },
    }},
  ]).toArray();

  const byGender = {};
  for (const row of genderAgg) {
    byGender[row._id] = {
      count:    row.count,
      avgHours: Math.round((toHours(row.totalSecs) / row.count) * 100) / 100,
    };
  }

  const totalHours = Object.values(byEventType).reduce((a, v) => a + v, 0);

  const data = {
    totalUsers,
    activeUsersTotal: activeSet.size,
    totalHours: Math.round(totalHours * 100) / 100,
    byEventType,
    byGender,
  };

  await summaries.updateOne(
    { type: "global" },
    { $set: { type: "global", date: new Date(), data } },
    { upsert: true }
  );

  console.log(`[analyticsSummary] global summary saved — ${totalUsers} students, ${Math.round(totalHours)} total hours`);
}

async function summarizeZipcodes(db) {
  const users     = db.collection("users");
  const tracking  = db.collection("timeTrackings");
  const summaries = db.collection("analyticsSummaries");

  const zipGroups = await users.aggregate([
    { $match: { role: "student", zipcode: { $ne: null } } },
    { $group: { _id: "$zipcode", usernames: { $push: "$username" } } },
  ]).toArray();

  let count = 0;
  for (const { _id: zipcode, usernames } of zipGroups) {
    const agg = await tracking.aggregate([
      { $match: { username: { $in: usernames }, eventType: { $ne: "website" } } },
      { $group: {
          _id: null,
          totalSecs:  { $sum: "$totalTime" },
          playSecs:   { $sum: { $cond: [{ $eq: ["$eventType", "play"]   }, "$totalTime", 0] } },
          lessonSecs: { $sum: { $cond: [{ $eq: ["$eventType", "lesson"] }, "$totalTime", 0] } },
          puzzleSecs: { $sum: { $cond: [{ $eq: ["$eventType", "puzzle"] }, "$totalTime", 0] } },
      }},
    ]).toArray();

    const row = agg[0] || { totalSecs: 0, playSecs: 0, lessonSecs: 0, puzzleSecs: 0 };
    const n   = usernames.length || 1;

    const data = {
      totalStudents:     usernames.length,
      avgTotalTimeHours: Math.round((toHours(row.totalSecs)  / n) * 100) / 100,
      avgGameTimeHours:  Math.round((toHours(row.playSecs)   / n) * 100) / 100,
      avgLessonTimeHours:Math.round((toHours(row.lessonSecs) / n) * 100) / 100,
      avgPuzzleTimeHours:Math.round((toHours(row.puzzleSecs) / n) * 100) / 100,
    };

    await summaries.updateOne(
      { type: "zipcode", zipcode },
      { $set: { type: "zipcode", zipcode, date: new Date(), data } },
      { upsert: true }
    );
    count++;
  }

  console.log(`[analyticsSummary] ${count} zipcode summaries saved`);
}

// ─── job ────────────────────────────────────────────────────────

async function runSummaryJob() {
  console.log("[analyticsSummary] Starting nightly summary job...");
  const db = mongoose.connection.db;
  if (!db) {
    console.error("[analyticsSummary] No DB connection — skipping");
    return;
  }
  try {
    await Promise.all([summarizeGlobal(db), summarizeZipcodes(db)]);
    console.log("[analyticsSummary] Done");
  } catch (err) {
    console.error("[analyticsSummary] Job failed:", err.message);
  }
}

// Daily at 02:00
schedule.scheduleJob("0 2 * * *", runSummaryJob);
console.log("[analyticsSummary] Scheduler registered — runs daily at 02:00");

module.exports = { runSummaryJob };
