/**
 * Integration tests — Leaderboard endpoint
 *
 * Users model and studentStats helpers are mocked.
 * Uses supertest against a minimal Express app. requireAuth is mocked
 * to always pass through (auth enforcement is covered separately in
 * requireAuth.test.js and leaderboard.security.test.js).
 *
 * Endpoint tested: GET /leaderboard
 */

jest.mock("../src/middleware/requireAuth", () => (req, _res, next) => {
  req.user = { username: "alice", role: "student" };
  next();
});

jest.mock("../src/models/users");
jest.mock("../src/utils/studentStats");
jest.mock("../src/utils/avatars");

const express = require("express");
const request = require("supertest");
const requireAuth = require("../src/middleware/requireAuth");
const leaderboard = require("../src/routes/leaderboard");
const Users = require("../src/models/users");
const studentStats = require("../src/utils/studentStats");
const { getAvatarUrl } = require("../src/utils/avatars");

const app = express();
app.use(express.json());
app.use("/leaderboard", requireAuth, leaderboard);

afterEach(() => jest.clearAllMocks());

const STUDENTS = [
  { _id: "1", username: "alice", country: "USA", state: "FL", school: "Jefferson Middle" },
  { _id: "2", username: "bob", country: "USA", state: "GA", school: "Pine View School" },
  { _id: "3", username: "carol", country: "Canada", state: null, school: null },
];

function mockStatsFor(scoreByUsername) {
  studentStats.getUserTimeStats.mockImplementation(async (username) => ({
    puzzleTimeHours: scoreByUsername[username]?.puzzleTimeHours || 0,
    lessonTimeHours: scoreByUsername[username]?.lessonTimeHours || 0,
    totalTimeHours: 0,
    gameTimeHours: 0,
    mentorTimeHours: 0,
  }));
  studentStats.getUserStreak.mockImplementation(
    async (username) => scoreByUsername[username]?.streak || 0
  );
  studentStats.getActivitiesCompleted.mockImplementation(
    async () => 0
  );
  studentStats.getBadgesEarned.mockImplementation(
    async (username) => scoreByUsername[username]?.badges || 0
  );
}

describe("GET /leaderboard", () => {
  beforeEach(() => {
    Users.find.mockResolvedValue(STUDENTS);
    getAvatarUrl.mockImplementation((avatarKey) =>
      avatarKey ? `https://s3.example.com/${avatarKey}` : null
    );
    mockStatsFor({
      alice: { puzzleTimeHours: 10, streak: 5, badges: 2 },
      bob: { puzzleTimeHours: 5, streak: 2, badges: 1 },
      carol: { puzzleTimeHours: 1, streak: 0, badges: 0 },
    });
  });

  test("200 — returns entries with expected shape", async () => {
    const res = await request(app).get("/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("entries");
    expect(res.body).toHaveProperty("hasMore");
    expect(res.body).toHaveProperty("total");
    expect(res.body.entries[0]).toHaveProperty("rank");
    expect(res.body.entries[0]).toHaveProperty("username");
    expect(res.body.entries[0]).toHaveProperty("school");
    expect(res.body.entries[0]).toHaveProperty("score");
    expect(res.body.entries[0]).toHaveProperty("avatarUrl", null);
  });

  test("returns a presigned avatarUrl when the student has an avatarKey", async () => {
    Users.find.mockResolvedValue([
      { _id: "1", username: "dave", country: "USA", state: "TX", school: "Test School", avatarKey: "dave/abc123.png" },
    ]);
    const res = await request(app).get("/leaderboard");
    expect(res.body.entries[0].avatarUrl).toBe("https://s3.example.com/dave/abc123.png");
    expect(getAvatarUrl).toHaveBeenCalledWith("dave/abc123.png");
  });

  test("returns null avatarUrl when the student has no avatarKey", async () => {
    Users.find.mockResolvedValue([
      { _id: "1", username: "eve", country: "USA", state: "TX", school: "Test School", avatarKey: null },
    ]);
    const res = await request(app).get("/leaderboard");
    expect(res.body.entries[0].avatarUrl).toBeNull();
  });

  test("does not include firstName/PII fields in response", async () => {
    const res = await request(app).get("/leaderboard");
    expect(res.body.entries[0]).not.toHaveProperty("firstName");
    expect(res.body.entries[0]).not.toHaveProperty("lastName");
    expect(res.body.entries[0]).not.toHaveProperty("email");
  });

  test("entries are ranked by score descending", async () => {
    const res = await request(app).get("/leaderboard");
    const scores = res.body.entries.map((e) => e.score);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
    expect(res.body.entries[0].username).toBe("alice"); // highest score
  });

  test("rank is 1-indexed and sequential", async () => {
    const res = await request(app).get("/leaderboard");
    res.body.entries.forEach((entry, idx) => {
      expect(entry.rank).toBe(idx + 1);
    });
  });

  test("filters by country", async () => {
    await request(app).get("/leaderboard?country=USA");
    expect(Users.find).toHaveBeenCalledWith(
      expect.objectContaining({ role: "student", country: "USA" }),
      expect.anything()
    );
  });

  test("filters by state", async () => {
    await request(app).get("/leaderboard?state=FL");
    expect(Users.find).toHaveBeenCalledWith(
      expect.objectContaining({ role: "student", state: "FL" }),
      expect.anything()
    );
  });

  test("filters by school", async () => {
    await request(app).get("/leaderboard?school=Jefferson Middle");
    expect(Users.find).toHaveBeenCalledWith(
      expect.objectContaining({ role: "student", school: "Jefferson Middle" }),
      expect.anything()
    );
  });

  test("combines multiple filters with AND semantics", async () => {
    await request(app).get("/leaderboard?country=USA&state=FL");
    expect(Users.find).toHaveBeenCalledWith(
      expect.objectContaining({ role: "student", country: "USA", state: "FL" }),
      expect.anything()
    );
  });

  test("does not use regex for filter values (exact match only)", async () => {
    await request(app).get("/leaderboard?school=Jefferson Middle");
    const filterArg = Users.find.mock.calls[0][0];
    expect(filterArg.school).toBe("Jefferson Middle");
    expect(filterArg.school).not.toBeInstanceOf(RegExp);
  });

  test("pagination — limit restricts entry count", async () => {
    const res = await request(app).get("/leaderboard?limit=2");
    expect(res.body.entries.length).toBeLessThanOrEqual(2);
  });

  test("pagination — skip offsets results", async () => {
    const full = await request(app).get("/leaderboard");
    const skipped = await request(app).get("/leaderboard?skip=1");
    expect(skipped.body.entries[0].username).toBe(full.body.entries[1].username);
  });

  test("pagination — hasMore is true when more results exist", async () => {
    const res = await request(app).get("/leaderboard?limit=1");
    expect(res.body.hasMore).toBe(true);
  });

  test("pagination — hasMore is false on last page", async () => {
    const res = await request(app).get("/leaderboard?limit=10");
    expect(res.body.hasMore).toBe(false);
  });

  test("limit is capped at 100", async () => {
    Users.find.mockResolvedValue(
      Array.from({ length: 150 }, (_, i) => ({
        _id: String(i),
        username: `user${i}`,
        country: "USA",
        state: "FL",
        school: "Test School",
      }))
    );
    mockStatsFor({});
    const res = await request(app).get("/leaderboard?limit=500");
    expect(res.body.entries.length).toBeLessThanOrEqual(100);
  });

  test("200 — returns empty entries when no students match filter", async () => {
    Users.find.mockResolvedValue([]);
    const res = await request(app).get("/leaderboard?country=Antarctica");
    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(0);
    expect(res.body.total).toBe(0);
    expect(res.body.hasMore).toBe(false);
  });

  test("500 — returns server error when Users.find throws", async () => {
    Users.find.mockRejectedValue(new Error("DB connection failed"));
    const res = await request(app).get("/leaderboard");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Server error");
  });

  test("students with null state/school are handled without crashing", async () => {
    const res = await request(app).get("/leaderboard");
    const carolEntry = res.body.entries.find((e) => e.username === "carol");
    expect(carolEntry.state).toBeNull();
    expect(carolEntry.school).toBeNull();
  });
});
