/**
 * Integration tests — POST/GET /gameResults
 *
 * The GameResults model is mocked; utils/studentStats is NOT, so the scoring
 * these tests assert is the real formula the leaderboard and analytics use.
 *
 * Covers the three properties the design depends on:
 *   - idempotency on gameId (a game can never be counted twice),
 *   - only a participant may report a game,
 *   - win/draw bodies are validated so junk can't reach the collection.
 */

jest.mock("../src/middleware/requireAuth", () => (req, _res, next) => {
  req.user = { username: req.headers["x-test-user"] || "alice", role: "student" };
  next();
});
jest.mock("../src/models/gameResults");

const express = require("express");
const request = require("supertest");
const requireAuth = require("../src/middleware/requireAuth");
const gameResults = require("../src/routes/gameResults");
const GameResults = require("../src/models/gameResults");

const app = express();
app.use(express.json());
app.use("/gameResults", requireAuth, gameResults);

afterEach(() => jest.clearAllMocks());

const WIN_BODY = {
  gameId: "game-1",
  result: "win",
  reason: "checkmate",
  winnerUsername: "alice",
  loserUsername: "bob",
};

const DRAW_BODY = {
  gameId: "game-2",
  result: "draw",
  reason: "draw",
  players: ["alice", "bob"],
};

describe("POST /gameResults — recording", () => {
  beforeEach(() => {
    GameResults.findOne.mockResolvedValue(null);
    GameResults.create.mockImplementation(async (doc) => doc);
  });

  test("201 — records a decisive game", async () => {
    const res = await request(app).post("/gameResults").send(WIN_BODY);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.duplicate).toBe(false);
    expect(res.body.gameResult.winnerUsername).toBe("alice");
    expect(res.body.gameResult.players).toEqual(["alice", "bob"]);
  });

  test("201 — records a draw with both players and no winner", async () => {
    const res = await request(app).post("/gameResults").send(DRAW_BODY);
    expect(res.status).toBe(201);
    expect(res.body.gameResult.result).toBe("draw");
    expect(res.body.gameResult.winnerUsername).toBeNull();
    expect(res.body.gameResult.loserUsername).toBeNull();
    expect(res.body.gameResult.players).toEqual(["alice", "bob"]);
  });

  test("a resign is recorded as a win, not a special result", async () => {
    const res = await request(app)
      .post("/gameResults")
      .send({ ...WIN_BODY, reason: "resign" });
    expect(res.status).toBe(201);
    expect(res.body.gameResult.result).toBe("win");
    expect(res.body.gameResult.reason).toBe("resign");
  });
});

describe("POST /gameResults — idempotency on gameId", () => {
  test("re-reporting a recorded game returns 200 duplicate and writes nothing", async () => {
    GameResults.findOne.mockResolvedValue({ ...WIN_BODY, players: ["alice", "bob"] });

    const res = await request(app).post("/gameResults").send(WIN_BODY);
    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);
    expect(GameResults.create).not.toHaveBeenCalled();
  });

  test("a unique-index race is resolved as a duplicate, not a 500", async () => {
    // Both clients report at once: findOne sees nothing, create loses the race.
    GameResults.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...WIN_BODY, players: ["alice", "bob"] });
    GameResults.create.mockRejectedValue({ code: 11000 });

    const res = await request(app).post("/gameResults").send(WIN_BODY);
    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);
  });
});

describe("POST /gameResults — authorization", () => {
  beforeEach(() => {
    GameResults.findOne.mockResolvedValue(null);
    GameResults.create.mockImplementation(async (doc) => doc);
  });

  test("403 — a student who did not play the game cannot report it", async () => {
    const res = await request(app)
      .post("/gameResults")
      .set("x-test-user", "mallory")
      .send(WIN_BODY);
    expect(res.status).toBe(403);
    expect(GameResults.create).not.toHaveBeenCalled();
  });

  test("the loser may report the game", async () => {
    const res = await request(app).post("/gameResults").set("x-test-user", "bob").send(WIN_BODY);
    expect(res.status).toBe(201);
  });
});

describe("POST /gameResults — validation", () => {
  beforeEach(() => {
    GameResults.findOne.mockResolvedValue(null);
    GameResults.create.mockImplementation(async (doc) => doc);
  });

  const badBodies = [
    ["missing gameId", { ...WIN_BODY, gameId: undefined }],
    ["unknown result", { ...WIN_BODY, result: "forfeit" }],
    ["unknown reason", { ...WIN_BODY, reason: "boredom" }],
    ["win with no loser", { ...WIN_BODY, loserUsername: undefined }],
    ["win against yourself", { ...WIN_BODY, loserUsername: "alice" }],
    ["draw with one player", { ...DRAW_BODY, players: ["alice"] }],
    ["draw with a non-draw reason", { ...DRAW_BODY, reason: "checkmate" }],
  ];

  test.each(badBodies)("400 — %s", async (_label, body) => {
    const res = await request(app).post("/gameResults").send(body);
    expect(res.status).toBe(400);
    expect(GameResults.create).not.toHaveBeenCalled();
  });
});

describe("GET /gameResults/:username", () => {
  test("computes W/D/L and the chess score on read", async () => {
    GameResults.find.mockResolvedValue([
      { players: ["alice", "bob"], result: "win", winnerUsername: "alice" },
      { players: ["alice", "carol"], result: "win", winnerUsername: "alice" },
      { players: ["alice", "bob"], result: "win", winnerUsername: "bob" },
      { players: ["alice", "carol"], result: "draw", winnerUsername: null },
    ]);

    const res = await request(app).get("/gameResults/alice");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      wins: 2,
      draws: 1,
      losses: 1,
      gamesPlayed: 4,
      chessScore: 7, // 2 wins (6) + 1 draw (1) + 1 loss (0)
    });
  });

  test("a student with no games gets zeros, not nulls", async () => {
    GameResults.find.mockResolvedValue([]);
    const res = await request(app).get("/gameResults/newbie");
    expect(res.body.data).toEqual({
      wins: 0,
      draws: 0,
      losses: 0,
      gamesPlayed: 0,
      chessScore: 0,
    });
  });
});
