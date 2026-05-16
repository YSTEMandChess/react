/**
 * Integration tests — Analytics zipcode + global endpoints
 *
 * All Mongoose models and adminGuard are mocked.
 * Uses supertest against a minimal Express app.
 *
 * Endpoints tested:
 *   GET /analytics/zipcode?zipcode=X
 *   GET /analytics/zipcode/all
 *   GET /analytics/global
 *   GET /analytics/global/trend
 *   Input validation (bad date params)
 */

jest.mock("../src/middleware/adminGuard", () => (req, _res, next) => {
  req.user = { username: "admin", role: "admin" };
  next();
});

jest.mock("../src/models/users");
jest.mock("../src/models/timeTracking");
jest.mock("../src/models/activities");
jest.mock("../src/models/UserBadges");

const express      = require("express");
const request      = require("supertest");
const adminGuard   = require("../src/middleware/adminGuard");
const analytics    = require("../src/routes/analytics");
const Users        = require("../src/models/users");
const TimeTracking = require("../src/models/timeTracking");

const app = express();
app.use(express.json());
app.use("/analytics", adminGuard, analytics);

afterEach(() => jest.clearAllMocks());

// ─── Shared fixtures ────────────────────────────────────────────

const ZIPCODE_USERS = [
  { username: "alice" },
  { username: "bob" },
];

const EVENTS = [
  { eventType: "play",   totalTime: 7200,  startTime: new Date("2026-04-01"), username: "alice" },
  { eventType: "lesson", totalTime: 3600,  startTime: new Date("2026-04-02"), username: "alice" },
  { eventType: "puzzle", totalTime: 1800,  startTime: new Date("2026-04-02"), username: "bob" },
];

// ─── GET /analytics/zipcode ──────────────────────────────────────

describe("GET /analytics/zipcode", () => {
  beforeEach(() => {
    Users.find.mockImplementation((filter) => {
      // Return zip students or all students depending on query shape
      if (filter.zipcode) return Promise.resolve(ZIPCODE_USERS);
      if (filter.role === "student") return Promise.resolve(ZIPCODE_USERS);
      return Promise.resolve([]);
    });
    TimeTracking.find.mockResolvedValue(EVENTS);
    TimeTracking.aggregate.mockResolvedValue([
      { _id: "alice", play: 7200, lesson: 3600, puzzle: 0, mentor: 0 },
      { _id: "bob",   play: 0,    lesson: 0,    puzzle: 1800, mentor: 0 },
    ]);
  });

  test("400 — missing zipcode", async () => {
    const res = await request(app).get("/analytics/zipcode");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/zipcode/i);
  });

  test("400 — invalid from date", async () => {
    const res = await request(app).get("/analytics/zipcode?zipcode=30301&from=not-a-date");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/from/i);
  });

  test("400 — invalid to date", async () => {
    const res = await request(app).get("/analytics/zipcode?zipcode=30301&to=99-99-99");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/to/i);
  });

  test("200 — returns zipcode stats with expected shape", async () => {
    // aggregate returns user-level rows for the pipeline
    TimeTracking.aggregate
      .mockResolvedValueOnce([
        { _id: "alice", play: 7200, lesson: 3600, puzzle: 0,    mentor: 0 },
        { _id: "bob",   play: 0,    lesson: 0,    puzzle: 1800, mentor: 0 },
      ])
      .mockResolvedValueOnce([{ _id: null, total: 12600 }]); // global agg

    // getUserStreak uses TimeTracking.find — return empty to keep streak=0
    TimeTracking.find.mockResolvedValue([]);

    const res = await request(app).get("/analytics/zipcode?zipcode=30301");
    expect(res.status).toBe(200);
    expect(res.body.zipcode).toBe("30301");
    expect(res.body).toHaveProperty("totalStudents");
    expect(res.body).toHaveProperty("avgTotalTimeHours");
    expect(res.body).toHaveProperty("avgGameTimeHours");
    expect(res.body).toHaveProperty("globalAvgTotalTimeHours");
    expect(res.body).toHaveProperty("avgStreakDays");
  });

  test("200 — returns zeros for zipcode with no activity", async () => {
    Users.find.mockResolvedValue([]); // no students in zip
    const res = await request(app).get("/analytics/zipcode?zipcode=00000");
    expect(res.status).toBe(200);
    expect(res.body.totalStudents).toBe(0);
    expect(res.body.avgTotalTimeHours).toBe(0);
  });
});

// ─── GET /analytics/zipcode/all ─────────────────────────────────

describe("GET /analytics/zipcode/all", () => {
  beforeEach(() => {
    Users.aggregate.mockResolvedValue([
      { _id: "30301", usernames: ["alice", "bob"] },
      { _id: "10001", usernames: ["carol"] },
    ]);
    TimeTracking.aggregate.mockResolvedValue([{ _id: null, total: 10800 }]);
  });

  test("200 — returns array sorted by totalStudents desc", async () => {
    const res = await request(app).get("/analytics/zipcode/all");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("zipcode");
    expect(res.body[0]).toHaveProperty("totalStudents");
    expect(res.body[0]).toHaveProperty("avgTotalTimeHours");
    // sorted descending by totalStudents
    expect(res.body[0].totalStudents).toBeGreaterThanOrEqual(res.body[1].totalStudents);
  });

  test("400 — invalid date param", async () => {
    const res = await request(app).get("/analytics/zipcode/all?from=bad");
    expect(res.status).toBe(400);
  });

  test("200 — returns empty array when no zipcodes", async () => {
    Users.aggregate.mockResolvedValue([]);
    const res = await request(app).get("/analytics/zipcode/all");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

// ─── GET /analytics/global ──────────────────────────────────────

describe("GET /analytics/global", () => {
  beforeEach(() => {
    Users.countDocuments.mockResolvedValue(42);
    TimeTracking.aggregate
      .mockResolvedValueOnce([
        { _id: "play",   totalSecs: 36000, uniqueUsers: ["alice", "bob"] },
        { _id: "lesson", totalSecs: 18000, uniqueUsers: ["alice"] },
      ])
      .mockResolvedValueOnce([
        { _id: "M",       count: 20, totalSecs: 54000 },
        { _id: "F",       count: 15, totalSecs: 27000 },
        { _id: "Unknown", count:  7, totalSecs:  3600 },
      ]);
  });

  test("200 — returns expected KPI shape", async () => {
    const res = await request(app).get("/analytics/global");
    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBe(42);
    expect(res.body).toHaveProperty("activeUsersInPeriod");
    expect(res.body).toHaveProperty("totalHours");
    expect(res.body.byEventType).toHaveProperty("gameTime");
    expect(res.body.byEventType).toHaveProperty("lessonTime");
    expect(res.body.byEventType).toHaveProperty("puzzleTime");
    expect(res.body.byEventType).toHaveProperty("mentorTime");
    expect(res.body.byGender).toHaveProperty("M");
    expect(res.body.byGender.M).toHaveProperty("count");
    expect(res.body.byGender.M).toHaveProperty("avgHours");
  });

  test("activeUsersInPeriod is unique count across event types", async () => {
    const res = await request(app).get("/analytics/global");
    // alice + bob from play, alice from lesson — unique = 2
    expect(res.body.activeUsersInPeriod).toBe(2);
  });

  test("gameTime maps play events correctly", async () => {
    const res = await request(app).get("/analytics/global");
    // 36000s play = 10 hours
    expect(res.body.byEventType.gameTime).toBe(10);
  });

  test("400 — invalid date param", async () => {
    const res = await request(app).get("/analytics/global?from=not-a-date");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/from/i);
  });
});

// ─── GET /analytics/global/trend ────────────────────────────────

describe("GET /analytics/global/trend", () => {
  beforeEach(() => {
    TimeTracking.find.mockResolvedValue([
      { username: "alice", startTime: new Date(), totalTime: 3600 },
      { username: "bob",   startTime: new Date(), totalTime: 1800 },
    ]);
  });

  test("200 — returns months, activeUsers, totalHours arrays of equal length", async () => {
    const res = await request(app).get("/analytics/global/trend?months=3");
    expect(res.status).toBe(200);
    expect(res.body.months).toHaveLength(3);
    expect(res.body.activeUsers).toHaveLength(3);
    expect(res.body.totalHours).toHaveLength(3);
  });

  test("defaults to 6 months", async () => {
    const res = await request(app).get("/analytics/global/trend");
    expect(res.body.months).toHaveLength(6);
  });

  test("caps at 24 months", async () => {
    const res = await request(app).get("/analytics/global/trend?months=999");
    expect(res.body.months).toHaveLength(24);
  });

  test("current month activeUsers counts unique usernames", async () => {
    const res = await request(app).get("/analytics/global/trend?months=1");
    // Both alice and bob in current month
    const lastIdx = res.body.activeUsers.length - 1;
    expect(res.body.activeUsers[lastIdx]).toBe(2);
  });
});
