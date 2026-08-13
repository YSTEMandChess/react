/**
 * Integration tests — /streak auth guard
 *
 * Companion to activities.test.js. Both /streak endpoints identify their
 * subject via ?username= instead of a path param, so they need their own
 * self-only guard rather than routes/activities.js's requireSelf.
 *
 * requireAuth binds passport.authenticate at require-time, so passport is
 * mocked with a mutable user box — same pattern as activities.test.js.
 */

let mockCurrentAuthUser = { username: "alice", role: "student" };

jest.mock("passport", () => ({
  authenticate: jest.fn(() => (req, res, next) => {
    if (!mockCurrentAuthUser) return res.status(401).json({ error: "Unauthorized" });
    req.user = mockCurrentAuthUser;
    next();
  }),
}));

const mockGetStreakSummary = jest.fn();
jest.mock("../src/utils/studentStats", () => ({
  getStreakSummary: (...args) => mockGetStreakSummary(...args),
  isDayCompleted: jest.fn(() => true),
}));

const mockLean = jest.fn();
jest.mock("../src/models/timeTracking", () => ({
  find: jest.fn(() => ({ lean: mockLean })),
}));

const express = require("express");
const request = require("supertest");
const streakRoute = require("../src/routes/streak");

const app = express();
app.use(express.json());
app.use("/streak", streakRoute);

beforeEach(() => {
  mockCurrentAuthUser = { username: "alice", role: "student" };
  mockGetStreakSummary.mockResolvedValue({
    currentStreak: 3,
    longestStreak: 7,
    lastCompletedDate: "2026-08-12",
  });
  mockLean.mockResolvedValue([]);
});

afterEach(() => jest.clearAllMocks());

describe("GET /streak — auth guard", () => {
  it("returns the streak for the authenticated user's own username", async () => {
    const res = await request(app).get("/streak?username=alice");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      currentStreak: 3,
      longestStreak: 7,
      lastCompletedDate: "2026-08-12",
    });
  });

  it("rejects an unauthenticated caller with 401", async () => {
    mockCurrentAuthUser = null;
    const res = await request(app).get("/streak?username=alice");
    expect(res.status).toBe(401);
    // The pre-guard behaviour: this route would have returned another
    // student's streak to any caller who guessed a username.
    expect(mockGetStreakSummary).not.toHaveBeenCalled();
  });

  it("rejects reading another student's streak with 403", async () => {
    const res = await request(app).get("/streak?username=bob");
    expect(res.status).toBe(403);
    expect(mockGetStreakSummary).not.toHaveBeenCalled();
  });

  it("still returns 400 when username is omitted, not 403", async () => {
    const res = await request(app).get("/streak");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/username is required/);
  });
});

describe("GET /streak/calendar — auth guard", () => {
  it("returns the calendar for the authenticated user's own username", async () => {
    const res = await request(app).get("/streak/calendar?username=alice&month=2026-08");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("days");
  });

  it("rejects an unauthenticated caller with 401", async () => {
    mockCurrentAuthUser = null;
    const res = await request(app).get("/streak/calendar?username=alice&month=2026-08");
    expect(res.status).toBe(401);
  });

  it("rejects reading another student's calendar with 403", async () => {
    const res = await request(app).get("/streak/calendar?username=bob&month=2026-08");
    expect(res.status).toBe(403);
  });

  it("still returns 400 when month is omitted", async () => {
    const res = await request(app).get("/streak/calendar?username=alice");
    expect(res.status).toBe(400);
  });

  it("returns 400 when username is omitted, before any auth-subject check", async () => {
    const res = await request(app).get("/streak/calendar?month=2026-08");
    expect(res.status).toBe(400);
  });
});
