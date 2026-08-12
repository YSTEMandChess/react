/**
 * Real-database consistency test — LB-02.
 *
 * Confirms /leaderboard and /analytics/student/:username derive identical
 * underlying stats (time played, streak, activities completed, badges
 * earned) for the same student and date, since both routes import the
 * same utils/studentStats helpers. A discrepancy here would mean the
 * shared module was bypassed or duplicated somewhere, and the two
 * features would silently disagree about a student's numbers.
 *
 * Uses mongodb-memory-server + real Mongoose models — no mocks — since
 * the whole point is verifying two independently-written route handlers
 * genuinely compute the same thing from the same data, not that they
 * both call an identical mock.
 */

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const express = require("express");
const request = require("supertest");

jest.setTimeout(60000);

let mongod;
let app;

beforeAll(async () => {
  // See badges.concurrency.test.js for why launchTimeout is raised — this
  // file and that one are both real-Mongo tests and can run as concurrent
  // Jest workers, contending for resources under the 10s default.
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 30000 } });
  await mongoose.connect(mongod.getUri() + "ystem");

  // Bypass real JWT for both admin (analytics) and any-role (leaderboard) auth
  const adminGuard = (req, res, next) => { req.user = { username: "admin", role: "admin" }; next(); };
  const requireAuth = (req, res, next) => { req.user = { username: "alice", role: "student" }; next(); };

  const analyticsRoute = require("../src/routes/analytics");
  const leaderboardRoute = require("../src/routes/leaderboard");

  app = express();
  app.use(express.json());
  app.use("/analytics", adminGuard, analyticsRoute);
  app.use("/leaderboard", requireAuth, leaderboardRoute);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

describe("LB-02 — leaderboard and analytics agree on the same student's stats", () => {
  test("time, streak, and badge counts match between /leaderboard inputs and /analytics/student", async () => {
    const Users = require("../src/models/users");
    const TimeTracking = require("../src/models/timeTracking");
    const UserBadges = require("../src/models/UserBadges");

    const alice = await Users.create({
      username: "alice", email: "alice@test.com", password: "hashed",
      firstName: "Alice", lastName: "Test", role: "student", school: "Test School",
    });

    const now = new Date();
    await TimeTracking.create([
      { username: "alice", eventType: "puzzle", eventId: "e1", startTime: now, totalTime: 3600 },
      { username: "alice", eventType: "lesson", eventId: "e2", startTime: now, totalTime: 1800 },
    ]);
    await UserBadges.create({ userId: "alice", earned: [{ badgeId: "first_lesson" }, { badgeId: "streak_5" }] });

    const analyticsRes = await request(app).get("/analytics/student/alice");
    expect(analyticsRes.status).toBe(200);

    const leaderboardRes = await request(app).get("/leaderboard?school=" + encodeURIComponent("Test School"));
    expect(leaderboardRes.status).toBe(200);

    // Analytics exposes the raw stats directly; leaderboard only exposes
    // the composed score, so recompute the leaderboard's expected score
    // from the SAME analytics numbers to prove they came from one source.
    const { stats } = analyticsRes.body;
    const aliceEntry = leaderboardRes.body.data.leaderboard.find((e) => e.username === "alice");
    expect(aliceEntry).toBeDefined();

    const WEIGHTS = { time: 0.5, streak: 5, badge: 10, activity: 3 }; // route defaults
    const expectedScore = Math.round(
      (stats.puzzleTimeHours + stats.lessonTimeHours) * WEIGHTS.time +
      stats.currentStreak * WEIGHTS.streak +
      stats.badgesEarned * WEIGHTS.badge +
      stats.activitiesCompleted * WEIGHTS.activity
    );

    expect(aliceEntry.score).toBe(expectedScore);
    // 3600s puzzle + 1800s lesson = 1.5 hours total, 2 badges, streak from
    // a single day with both lesson+puzzle = 1.
    expect(stats.puzzleTimeHours + stats.lessonTimeHours).toBe(1.5);
    expect(stats.badgesEarned).toBe(2);
  });

  test("a student absent from timeTracking shows score 0 on both endpoints consistently", async () => {
    const Users = require("../src/models/users");
    await Users.create({
      username: "quiet", email: "quiet@test.com", password: "hashed",
      firstName: "Quiet", lastName: "Student", role: "student", school: "Silent School",
    });

    const analyticsRes = await request(app).get("/analytics/student/quiet");
    const leaderboardRes = await request(app).get("/leaderboard?school=" + encodeURIComponent("Silent School"));

    expect(analyticsRes.body.stats.totalTimeHours).toBe(0);
    expect(analyticsRes.body.stats.currentStreak).toBe(0);
    expect(analyticsRes.body.stats.badgesEarned).toBe(0);

    const quietEntry = leaderboardRes.body.data.leaderboard.find((e) => e.username === "quiet");
    expect(quietEntry.score).toBe(0);
  });
});
