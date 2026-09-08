/**
 * Integration tests — Badges (Achievements) API
 * Maps to test plan §4.1 (ACH-01..08) and §6 edge cases EDGE-02..04.
 *
 * Users/UserBadges/studentStats mocked. requireAuth uses the default
 * mock-middleware-with-mutable-user-box pattern (see avatarUpload.test.js)
 * since routes/badges.js binds passport.authenticate at require-time.
 */

let mockCurrentAuthUser = { username: "alice", role: "student" };

jest.mock("passport", () => ({
  authenticate: jest.fn(() => (req, res, next) => {
    if (!mockCurrentAuthUser) return res.status(401).json({ error: "Unauthorized" });
    req.user = mockCurrentAuthUser;
    next();
  }),
}));
jest.mock("../src/models/users");
jest.mock("../src/models/UserBadges");
jest.mock("../src/utils/studentStats");

const express = require("express");
const request = require("supertest");
const badgesRoute = require("../src/routes/badges");
const Users = require("../src/models/users");
const UserBadges = require("../src/models/UserBadges");
const studentStats = require("../src/utils/studentStats");
const { BADGE_CATALOG } = require("../src/badges/catalog");

const app = express();
app.use(express.json());
app.use("/badges", badgesRoute);

afterEach(() => {
  jest.clearAllMocks();
  mockCurrentAuthUser = { username: "alice", role: "student" };
});

describe("GET /badges/catalog — ACH-01", () => {
  test("returns all catalog badges with required fields, no auth required", async () => {
    mockCurrentAuthUser = null; // catalog is public
    const res = await request(app).get("/badges/catalog");
    expect(res.status).toBe(200);
    expect(res.body.badges).toHaveLength(BADGE_CATALOG.length);
    res.body.badges.forEach((b) => {
      expect(b).toHaveProperty("id");
      expect(b).toHaveProperty("name");
      expect(b).toHaveProperty("description");
      expect(b).toHaveProperty("icon");
      expect(b).toHaveProperty("criteria");
    });
  });
});

describe("GET /badges/:userId — ACH-02, R-3", () => {
  test("401 without a token", async () => {
    mockCurrentAuthUser = null;
    const res = await request(app).get("/badges/alice");
    expect(res.status).toBe(401);
  });

  test("403 when requesting another user's badges (R-3)", async () => {
    mockCurrentAuthUser = { username: "alice", role: "student" };
    const res = await request(app).get("/badges/bob");
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden/i);
  });

  test("ACH-02 — new user with no UserBadges document returns empty array, not error", async () => {
    UserBadges.findOne.mockResolvedValue(null);
    const res = await request(app).get("/badges/alice");
    expect(res.status).toBe(200);
    expect(res.body.earned).toEqual([]);
  });

  test("returns earned badges for self", async () => {
    UserBadges.findOne.mockResolvedValue({
      earned: [{ badgeId: "streak_5", earnedAt: new Date(), meta: { at: 5 } }],
    });
    const res = await request(app).get("/badges/alice");
    expect(res.status).toBe(200);
    expect(res.body.earned).toHaveLength(1);
    expect(res.body.earned[0].badgeId).toBe("streak_5");
  });
});

describe("POST /badges/:userId/check-and-award — R-1, R-3, ACH-03..06", () => {
  function mockRealStats({ streak = 0, activitiesDays = 0, lessonsCompleted = [] } = {}) {
    Users.findOne
      .mockResolvedValueOnce({ _id: "user-id-1" }) // existence check in computeBadgePredicates
      .mockResolvedValueOnce({ lessonsCompleted }); // lessons lookup
    studentStats.getUserStreak.mockResolvedValue(streak);
    studentStats.getActivitiesCompleted.mockResolvedValue(activitiesDays);
  }

  test("401 without a token", async () => {
    mockCurrentAuthUser = null;
    const res = await request(app).post("/badges/alice/check-and-award").send({});
    expect(res.status).toBe(401);
  });

  test("403 when awarding against another user's id (R-3)", async () => {
    const res = await request(app).post("/badges/bob/check-and-award").send({});
    expect(res.status).toBe(403);
  });

  /**
   * awardIfEligible now does one findOneAndUpdate (ensure doc exists) plus
   * one atomic updateOne per eligible badge (guarded by "earned.badgeId": {$ne}).
   * alreadyEarnedIds simulates which badges the mocked updateOne should
   * treat as "already present" (modifiedCount: 0) vs newly awarded (1).
   */
  function mockAwardOutcome(alreadyEarnedIds = []) {
    UserBadges.findOneAndUpdate.mockResolvedValue({});
    UserBadges.updateOne.mockImplementation((filter) => {
      // filter shape: { userId, "earned.badgeId": { $ne: id } }
      const id = filter["earned.badgeId"]?.$ne;
      const alreadyHad = alreadyEarnedIds.includes(id);
      return Promise.resolve({ modifiedCount: alreadyHad ? 0 : 1 });
    });
  }

  test("R-1 — fabricated request-body predicates are ignored; only real server stats count", async () => {
    // Caller claims a huge streak in the body; real computed streak is 0.
    mockRealStats({ streak: 0 });
    mockAwardOutcome();

    const res = await request(app)
      .post("/badges/alice/check-and-award")
      .send({ streak: 999999, lesson_completed: 999999 });

    expect(res.status).toBe(200);
    expect(res.body.awarded).toEqual([]); // nothing awarded despite the fabricated body
  });

  test("ACH-03 — awards on exact threshold using real computed streak", async () => {
    mockRealStats({ streak: 5 });
    mockAwardOutcome();

    const res = await request(app).post("/badges/alice/check-and-award").send({});

    expect(res.status).toBe(200);
    expect(res.body.awarded).toContain("streak_5");
    expect(res.body.awarded).not.toContain("streak_10");
  });

  test("ACH-04 — no award below threshold", async () => {
    mockRealStats({ streak: 4 });
    mockAwardOutcome();

    const res = await request(app).post("/badges/alice/check-and-award").send({});

    expect(res.body.awarded).toEqual([]);
    expect(UserBadges.updateOne).not.toHaveBeenCalled(); // no criteria met, no write attempted
  });

  test("ACH-05 — idempotent: already-earned badge is not re-awarded", async () => {
    mockRealStats({ streak: 5 });
    mockAwardOutcome(["streak_5"]); // simulate badge already present

    const res = await request(app).post("/badges/alice/check-and-award").send({});

    expect(res.body.awarded).toEqual([]);
  });

  test("ACH-06 — multiple eligible badges awarded in one call", async () => {
    mockRealStats({ streak: 10, lessonsCompleted: [{ piece: "pawn", lessonNumber: 1 }] });
    mockAwardOutcome();

    const res = await request(app).post("/badges/alice/check-and-award").send({});

    expect(res.body.awarded).toEqual(
      expect.arrayContaining(["streak_5", "streak_10", "first_lesson"])
    );
  });

  test("EDGE-04 — user deleted after token issuance surfaces 404, not an unhandled 500", async () => {
    Users.findOne.mockResolvedValueOnce(null); // user doesn't exist despite valid JWT
    const res = await request(app).post("/badges/alice/check-and-award").send({});
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  test("EDGE-04 — a zero/negative-shaped real streak never satisfies a positive threshold", async () => {
    // Not reachable via getUserStreak (min 0) or fabricated input (predicates
    // are server-derived now), but confirms the comparison itself is safe
    // if a future stat source could ever return 0 or less.
    mockRealStats({ streak: 0 });
    mockAwardOutcome();

    const res = await request(app).post("/badges/alice/check-and-award").send({});

    expect(res.body.awarded).toEqual([]);
    expect(UserBadges.updateOne).not.toHaveBeenCalled();
  });
});
