/**
 * Integration tests — /activities routes
 *
 * Covers Karthik Task 2: requireAuth + self-only enforcement on all three
 * endpoints (previously these had no auth at all — any caller could read
 * or complete any student's activities by guessing a username).
 *
 * routes/activities.js uses the raw MongoClient (not Mongoose), so the
 * mongodb module itself is mocked here rather than a Mongoose model.
 * requireAuth binds passport.authenticate at require-time — same
 * mock-middleware-with-mutable-user-box pattern as badges.test.js.
 */

let mockCurrentAuthUser = { username: "alice", role: "student" };

jest.mock("passport", () => ({
  authenticate: jest.fn(() => (req, res, next) => {
    if (!mockCurrentAuthUser) return res.status(401).json({ error: "Unauthorized" });
    req.user = mockCurrentAuthUser;
    next();
  }),
}));

const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockCollection = jest.fn(() => ({ findOne: mockFindOne, updateOne: mockUpdateOne }));
const mockDb = jest.fn(() => ({ collection: mockCollection }));
const mockConnect = jest.fn().mockResolvedValue(undefined);

jest.mock("mongodb", () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    db: mockDb,
  })),
  ObjectId: jest.fn((id) => id),
}));

jest.mock("config", () => ({ get: jest.fn(() => "mongodb://fake") }));

const express = require("express");
const request = require("supertest");
const activitiesRoute = require("../src/routes/activities");

const app = express();
app.use(express.json());
app.use("/activities", activitiesRoute);

afterEach(() => {
  jest.clearAllMocks();
  mockCurrentAuthUser = { username: "alice", role: "student" };
});

const ALICE_USER_ID = "alice-id-1";
const ALICE_ACTIVITIES_DOC = {
  activities: [
    { name: "captureQueen", type: "puzzle", completed: false, taskId: "captureQueen", route: "/puzzles" },
  ],
};

describe("GET /activities/:username", () => {
  test("401 — no authenticated user", async () => {
    mockCurrentAuthUser = null;
    const res = await request(app).get("/activities/alice");
    expect(res.status).toBe(401);
  });

  test("403 — authenticated as a different user than :username", async () => {
    mockCurrentAuthUser = { username: "bob", role: "student" };
    const res = await request(app).get("/activities/alice");
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden/i);
  });

  test("200 — returns activities for the authenticated user's own record", async () => {
    mockFindOne
      .mockResolvedValueOnce({ _id: ALICE_USER_ID }) // getUserId lookup
      .mockResolvedValueOnce(ALICE_ACTIVITIES_DOC); // activities lookup

    const res = await request(app).get("/activities/alice");

    expect(res.status).toBe(200);
    expect(res.body.activities).toEqual(ALICE_ACTIVITIES_DOC);
  });

  test("404 — user does not exist", async () => {
    mockFindOne.mockResolvedValueOnce(null); // getUserId finds nothing
    const res = await request(app).get("/activities/alice");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/user not found/i);
  });

  test("500 — returns server error on DB failure", async () => {
    mockFindOne.mockRejectedValueOnce(new Error("DB down"));
    const res = await request(app).get("/activities/alice");
    expect(res.status).toBe(500);
  });
});

describe("GET /activities/:username/dates", () => {
  test("401 — no authenticated user", async () => {
    mockCurrentAuthUser = null;
    const res = await request(app).get("/activities/alice/dates");
    expect(res.status).toBe(401);
  });

  test("403 — authenticated as a different user than :username", async () => {
    mockCurrentAuthUser = { username: "bob", role: "student" };
    const res = await request(app).get("/activities/alice/dates");
    expect(res.status).toBe(403);
  });

  test("200 — returns completedDates for the authenticated user's own record", async () => {
    mockFindOne
      .mockResolvedValueOnce({ _id: ALICE_USER_ID })
      .mockResolvedValueOnce({ completedDates: ["2026-07-01"] });

    const res = await request(app).get("/activities/alice/dates");

    expect(res.status).toBe(200);
    expect(res.body.dates).toEqual({ completedDates: ["2026-07-01"] });
  });

  test("404 — user does not exist", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    const res = await request(app).get("/activities/alice/dates");
    expect(res.status).toBe(404);
  });
});

describe("PUT /activities/:username/activity", () => {
  test("401 — no authenticated user", async () => {
    mockCurrentAuthUser = null;
    const res = await request(app)
      .put("/activities/alice/activity")
      .send({ activityName: "captureQueen" });
    expect(res.status).toBe(401);
  });

  test("403 — authenticated as a different user than :username (cannot complete someone else's activity)", async () => {
    mockCurrentAuthUser = { username: "bob", role: "student" };
    const res = await request(app)
      .put("/activities/alice/activity")
      .send({ activityName: "captureQueen" });
    expect(res.status).toBe(403);
  });

  test("200 — marks the authenticated user's own activity as completed", async () => {
    mockFindOne
      .mockResolvedValueOnce({ _id: ALICE_USER_ID }) // getUserId
      .mockResolvedValueOnce(null); // activityIncomplete lookup (not required to be truthy)
    mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const res = await request(app)
      .put("/activities/alice/activity")
      .send({ activityName: "captureQueen" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("success");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { userId: ALICE_USER_ID, "activities.name": "captureQueen" },
      { $set: { "activities.$.completed": true } }
    );
  });

  test("404 — user does not exist", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .put("/activities/alice/activity")
      .send({ activityName: "captureQueen" });
    expect(res.status).toBe(404);
  });

  test("500 — returns server error on DB failure", async () => {
    mockFindOne.mockRejectedValueOnce(new Error("DB down"));
    const res = await request(app)
      .put("/activities/alice/activity")
      .send({ activityName: "captureQueen" });
    expect(res.status).toBe(500);
  });
});
