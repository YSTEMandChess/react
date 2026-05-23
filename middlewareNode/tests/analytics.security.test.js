/**
 * Security tests — analytics endpoints with real adminGuard
 *
 * Unlike other analytics tests, adminGuard is NOT mocked here.
 * Passport is mocked to control who is "authenticated" so we can
 * verify role enforcement without a live JWT or DB connection.
 *
 * Verifies:
 *   - Student JWT  → 403 Forbidden
 *   - Mentor JWT   → 403 Forbidden
 *   - No token     → 401 Unauthorized
 *   - Admin JWT    → request reaches the route (not blocked)
 */

jest.mock("passport", () => ({ authenticate: jest.fn() }));
jest.mock("../src/models/users");
jest.mock("../src/models/timeTracking");
jest.mock("../src/models/activities");
jest.mock("../src/models/UserBadges");

const express      = require("express");
const request      = require("supertest");
const passport     = require("passport");
const adminGuard   = require("../src/middleware/adminGuard");
const analytics    = require("../src/routes/analytics");
const Users        = require("../src/models/users");
const TimeTracking = require("../src/models/timeTracking");

const app = express();
app.use(express.json());
app.use("/analytics", adminGuard, analytics);

afterEach(() => jest.clearAllMocks());

// ─── helpers ────────────────────────────────────────────────────

function mockPassportUser(user) {
  passport.authenticate.mockImplementation((_, __, cb) => () => cb(null, user));
}

// ─── role enforcement ────────────────────────────────────────────

describe("Analytics security — role enforcement", () => {
  test("student JWT receives 403", async () => {
    mockPassportUser({ username: "alice", role: "student" });
    const res = await request(app).get("/analytics/global");
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/admin/i);
  });

  test("mentor JWT receives 403", async () => {
    mockPassportUser({ username: "mentor1", role: "mentor" });
    const res = await request(app).get("/analytics/global");
    expect(res.status).toBe(403);
  });

  test("missing/invalid token receives 401", async () => {
    passport.authenticate.mockImplementation((_, __, cb) => () => cb(null, false));
    const res = await request(app).get("/analytics/global");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/unauthorized/i);
  });

  test("admin JWT reaches the route handler (not blocked)", async () => {
    mockPassportUser({ username: "admin", role: "admin" });

    // Provide enough mocks so the route completes normally
    Users.countDocuments.mockResolvedValue(10);
    TimeTracking.aggregate
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(app).get("/analytics/global");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalUsers", 10);
  });

  test("student JWT blocked on individual endpoint too", async () => {
    mockPassportUser({ username: "alice", role: "student" });
    const res = await request(app).get("/analytics/students/search?keyword=test");
    expect(res.status).toBe(403);
  });

  test("passport error returns 500", async () => {
    passport.authenticate.mockImplementation((_, __, cb) => () => cb(new Error("JWT lib failure"), false));
    const res = await request(app).get("/analytics/global");
    expect(res.status).toBe(500);
  });
});
