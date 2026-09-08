/**
 * Security tests — leaderboard endpoint with real requireAuth
 *
 * Unlike leaderboard.test.js, requireAuth is NOT mocked here.
 * Passport is mocked to control who is "authenticated" so we can
 * verify auth enforcement without a live JWT or DB connection.
 *
 * Verifies:
 *   - No token           → 401 Unauthorized
 *   - Student JWT         → reaches the route (leaderboard is student-facing)
 *   - Admin JWT            → also reaches the route (no role restriction)
 *   - Passport error       → 500
 */

jest.mock("passport", () => ({ authenticate: jest.fn() }));
jest.mock("../src/models/users");
jest.mock("../src/utils/studentStats");

const express = require("express");
const request = require("supertest");
const passport = require("passport");
const requireAuth = require("../src/middleware/requireAuth");
const leaderboard = require("../src/routes/leaderboard");
const Users = require("../src/models/users");
const studentStats = require("../src/utils/studentStats");

const app = express();
app.use(express.json());
app.use("/leaderboard", requireAuth, leaderboard);

afterEach(() => jest.clearAllMocks());

function mockPassportUser(user) {
  passport.authenticate.mockImplementation((_, __, cb) => () => cb(null, user));
}

describe("Leaderboard security — auth enforcement", () => {
  test("missing/invalid token receives 401", async () => {
    passport.authenticate.mockImplementation((_, __, cb) => () => cb(null, false));
    const res = await request(app).get("/leaderboard");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/unauthorized/i);
  });

  test("student JWT reaches the route handler (not blocked)", async () => {
    mockPassportUser({ username: "alice", role: "student" });
    Users.find.mockResolvedValue([]);

    const res = await request(app).get("/leaderboard");
    expect(res.status).toBe(200);
  });

  test("admin JWT also reaches the route handler (no role restriction)", async () => {
    mockPassportUser({ username: "admin", role: "admin" });
    Users.find.mockResolvedValue([]);

    const res = await request(app).get("/leaderboard");
    expect(res.status).toBe(200);
  });

  test("passport error returns 500", async () => {
    passport.authenticate.mockImplementation((_, __, cb) => () => cb(new Error("JWT lib failure"), false));
    const res = await request(app).get("/leaderboard");
    expect(res.status).toBe(500);
  });
});
