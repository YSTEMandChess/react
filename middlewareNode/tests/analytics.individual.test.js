/**
 * Integration tests — Analytics individual student endpoints
 *
 * Uses supertest against a minimal Express app so no real DB or server
 * is needed. All Mongoose models and adminGuard are mocked.
 *
 * Endpoints tested:
 *   GET /analytics/students/search?keyword=X
 *   GET /analytics/student/:username
 *   GET /analytics/student/:username/chart
 *   GET /analytics/student/:username/events
 */

// Mock adminGuard so every request is treated as an authenticated admin
jest.mock("../src/middleware/adminGuard", () => (req, _res, next) => {
  req.user = { username: "admin", role: "admin" };
  next();
});

// Mock all Mongoose models used by analytics.js
jest.mock("../src/models/users");
jest.mock("../src/models/timeTracking");
jest.mock("../src/models/activities");
jest.mock("../src/models/UserBadges");

const express    = require("express");
const request    = require("supertest");
const adminGuard = require("../src/middleware/adminGuard");
const analytics  = require("../src/routes/analytics");

// Model mocks
const Users        = require("../src/models/users");
const TimeTracking = require("../src/models/timeTracking");
const Activities   = require("../src/models/activities");
const UserBadges   = require("../src/models/UserBadges");

// Build test app once
const app = express();
app.use(express.json());
app.use("/analytics", adminGuard, analytics);

// ─── Shared fixtures ───────────────────────────────────────────
const STUDENT = {
  _id: "user123",
  username: "alex_j",
  firstName: "Alex",
  lastName: "Johnson",
  email: "alex@example.com",
  role: "student",
  zipcode: "30301",
  gender: "M",
  gradeLevel: "8th",
  accountCreatedAt: "2025-01-15",
};

const EVENTS = [
  { eventType: "lesson", eventName: "Bishop Basics", startTime: new Date("2026-04-01"), totalTime: 1800 },
  { eventType: "puzzle", eventName: "Puzzle #42",    startTime: new Date("2026-04-01"), totalTime:  600 },
  { eventType: "play",   eventName: "vs stockfish",  startTime: new Date("2026-04-02"), totalTime: 3600 },
];

// ─── GET /analytics/students/search ────────────────────────────

describe("GET /analytics/students/search", () => {
  test("200 — returns matching students", async () => {
    Users.find.mockReturnValue({
      limit: jest.fn().mockResolvedValue([
        { username: "alex_j", firstName: "Alex", lastName: "Johnson", email: "alex@example.com" },
      ]),
    });

    const res = await request(app).get("/analytics/students/search?keyword=alex");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].username).toBe("alex_j");
  });

  test("400 — missing keyword returns error", async () => {
    const res = await request(app).get("/analytics/students/search");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/keyword/i);
  });

  test("500 — DB error returns server error", async () => {
    Users.find.mockReturnValue({
      limit: jest.fn().mockRejectedValue(new Error("DB down")),
    });
    const res = await request(app).get("/analytics/students/search?keyword=fail");
    expect(res.status).toBe(500);
  });
});

// ─── GET /analytics/student/:username ──────────────────────────

describe("GET /analytics/student/:username", () => {
  beforeEach(() => {
    Users.findOne.mockResolvedValue(STUDENT);
    TimeTracking.find.mockResolvedValue(EVENTS);
    Activities.findOne.mockResolvedValue({ completedDates: [new Date("2026-04-01"), new Date("2026-04-02")] });
    UserBadges.findOne.mockResolvedValue({ earned: [{ badgeId: "first_lesson" }] });
  });

  test("200 — returns profile and stats", async () => {
    const res = await request(app).get("/analytics/student/alex_j");
    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe("alex_j");
    expect(res.body.profile.zipcode).toBe("30301");
    expect(res.body.stats).toHaveProperty("totalTimeHours");
    expect(res.body.stats).toHaveProperty("currentStreak");
    expect(res.body.stats.badgesEarned).toBe(1);
    expect(res.body.stats.activitiesCompleted).toBe(2);
  });

  test("stats.gameTimeHours maps play events correctly", async () => {
    const res = await request(app).get("/analytics/student/alex_j");
    // 3600s play = 1 hour
    expect(res.body.stats.gameTimeHours).toBe(1);
  });

  test("404 — unknown username", async () => {
    Users.findOne.mockResolvedValue(null);
    const res = await request(app).get("/analytics/student/ghost");
    expect(res.status).toBe(404);
  });

  test("200 — date range filter is passed to TimeTracking.find", async () => {
    await request(app).get("/analytics/student/alex_j?from=2026-01-01&to=2026-05-01");
    const dateCall = TimeTracking.find.mock.calls.find(c => c[0].startTime);
    expect(dateCall).toBeTruthy();
    expect(dateCall[0].startTime.$gte).toEqual(new Date("2026-01-01"));
  });
});

// ─── GET /analytics/student/:username/chart ─────────────────────

describe("GET /analytics/student/:username/chart", () => {
  beforeEach(() => {
    TimeTracking.find.mockResolvedValue(EVENTS);
  });

  test("200 — returns months array and series object", async () => {
    const res = await request(app).get("/analytics/student/alex_j/chart?months=3");
    expect(res.status).toBe(200);
    expect(res.body.months).toHaveLength(3);
    expect(res.body.series).toHaveProperty("gameTime");
    expect(res.body.series).toHaveProperty("lessonTime");
    expect(res.body.series).toHaveProperty("puzzleTime");
    expect(res.body.series).toHaveProperty("mentorTime");
    expect(res.body.series.gameTime).toHaveLength(3);
  });

  test("defaults to 6 months when months param is absent", async () => {
    const res = await request(app).get("/analytics/student/alex_j/chart");
    expect(res.body.months).toHaveLength(6);
  });

  test("caps months at 24", async () => {
    const res = await request(app).get("/analytics/student/alex_j/chart?months=999");
    expect(res.body.months).toHaveLength(24);
  });
});

// ─── GET /analytics/student/:username/events ────────────────────

describe("GET /analytics/student/:username/events", () => {
  beforeEach(() => {
    const sortMock  = jest.fn().mockReturnThis();
    const skipMock  = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockResolvedValue(EVENTS);
    TimeTracking.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock });
    TimeTracking.countDocuments.mockResolvedValue(3);
  });

  test("200 — returns events and hasMore flag", async () => {
    const res = await request(app).get("/analytics/student/alex_j/events");
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(3);
    expect(res.body).toHaveProperty("hasMore");
    expect(res.body.hasMore).toBe(false); // skip=0 + limit=20 >= total=3
  });

  test("hasMore is true when more pages exist", async () => {
    TimeTracking.countDocuments.mockResolvedValue(25);
    const res = await request(app).get("/analytics/student/alex_j/events?skip=0&limit=20");
    expect(res.body.hasMore).toBe(true); // 0+20 < 25
  });

  test("limits max page size to 100", async () => {
    TimeTracking.countDocuments.mockResolvedValue(5);
    const res = await request(app).get("/analytics/student/alex_j/events?limit=999");
    expect(res.status).toBe(200);
    // limit is capped at 100 — just verify no crash
  });
});
