/**
 * Edge-case integration tests — Week 5 (task 5.2)
 *
 * Covers data scenarios that are easy to miss in happy-path testing:
 *   - New student with zero activity (no timeTracking records)
 *   - /events when no events exist
 *   - /chart for a student with no data
 *   - Date range producing zero results
 *   - Profile with null demographic fields
 *
 * JWT / role security edge-cases (expired, tampered, student role) are
 * covered separately in analytics.security.test.js.
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
const Activities   = require("../src/models/activities");
const UserBadges   = require("../src/models/UserBadges");

const app = express();
app.use(express.json());
app.use("/analytics", adminGuard, analytics);

afterEach(() => jest.clearAllMocks());

const NEW_STUDENT = {
  _id: "newuser1",
  username: "new_student",
  firstName: "New",
  lastName: "Student",
  email: "new@example.com",
  role: "student",
  zipcode: null,
  gender: null,
  gradeLevel: null,
  accountCreatedAt: "2026-05-01",
};

function mockEmptyTracking() {
  TimeTracking.find.mockResolvedValue([]);
  Activities.findOne.mockResolvedValue({ completedDates: [] });
  UserBadges.findOne.mockResolvedValue({ earned: [] });
}

function mockEmptyEventsFeed() {
  const sortMock  = jest.fn().mockReturnThis();
  const skipMock  = jest.fn().mockReturnThis();
  const limitMock = jest.fn().mockResolvedValue([]);
  TimeTracking.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock });
  TimeTracking.countDocuments.mockResolvedValue(0);
}

// ─── New student — zero activity ─────────────────────────────────

describe("Student with no activity records", () => {
  beforeEach(() => {
    Users.findOne.mockResolvedValue(NEW_STUDENT);
    mockEmptyTracking();
  });

  test("GET /student/:username — 200 with all stats at zero", async () => {
    const res = await request(app).get("/analytics/student/new_student");
    expect(res.status).toBe(200);
    expect(res.body.stats.totalTimeHours).toBe(0);
    expect(res.body.stats.gameTimeHours).toBe(0);
    expect(res.body.stats.lessonTimeHours).toBe(0);
    expect(res.body.stats.puzzleTimeHours).toBe(0);
    expect(res.body.stats.currentStreak).toBe(0);
    expect(res.body.stats.activitiesCompleted).toBe(0);
    expect(res.body.stats.badgesEarned).toBe(0);
  });

  test("GET /student/:username/chart — 200 with all-zero series", async () => {
    const res = await request(app).get("/analytics/student/new_student/chart?months=3");
    expect(res.status).toBe(200);
    expect(res.body.months).toHaveLength(3);
    expect(res.body.series.gameTime.every((v) => v === 0)).toBe(true);
    expect(res.body.series.lessonTime.every((v) => v === 0)).toBe(true);
    expect(res.body.series.puzzleTime.every((v) => v === 0)).toBe(true);
    expect(res.body.series.mentorTime.every((v) => v === 0)).toBe(true);
  });

  test("GET /student/:username/events — 200 with empty list and hasMore false", async () => {
    mockEmptyEventsFeed();
    const res = await request(app).get("/analytics/student/new_student/events");
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(0);
    expect(res.body.hasMore).toBe(false);
  });

  test("GET /student/:username — badgesEarned is 0 when UserBadges doc is null", async () => {
    UserBadges.findOne.mockResolvedValue(null);
    const res = await request(app).get("/analytics/student/new_student");
    expect(res.status).toBe(200);
    expect(res.body.stats.badgesEarned).toBe(0);
  });

  test("GET /student/:username — activitiesCompleted is 0 when Activities doc is null", async () => {
    Activities.findOne.mockResolvedValue(null);
    const res = await request(app).get("/analytics/student/new_student");
    expect(res.status).toBe(200);
    expect(res.body.stats.activitiesCompleted).toBe(0);
  });
});

// ─── Profile with null demographics ──────────────────────────────

describe("Student profile with null demographic fields", () => {
  test("profile zipcode/gender/gradeLevel default to null when undefined on document", async () => {
    Users.findOne.mockResolvedValue({
      ...NEW_STUDENT,
      zipcode: undefined,
      gender: undefined,
      gradeLevel: undefined,
    });
    mockEmptyTracking();

    const res = await request(app).get("/analytics/student/new_student");
    expect(res.status).toBe(200);
    expect(res.body.profile.zipcode).toBeNull();
    expect(res.body.profile.gender).toBeNull();
    expect(res.body.profile.gradeLevel).toBeNull();
  });
});

// ─── Date range producing zero results ───────────────────────────

describe("Date range with no matching data", () => {
  test("GET /student/:username — all stats zero for empty date window", async () => {
    Users.findOne.mockResolvedValue(NEW_STUDENT);
    mockEmptyTracking();

    const res = await request(app).get(
      "/analytics/student/new_student?from=2020-01-01&to=2020-01-31"
    );
    expect(res.status).toBe(200);
    expect(res.body.stats.totalTimeHours).toBe(0);
    expect(res.body.stats.activitiesCompleted).toBe(0);
  });

  test("GET /student/:username/events — empty array for out-of-range period", async () => {
    mockEmptyEventsFeed();
    const res = await request(app).get(
      "/analytics/student/new_student/events?from=2020-01-01&to=2020-01-31"
    );
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(0);
    expect(res.body.hasMore).toBe(false);
  });

  test("GET /student/:username/chart — all-zero arrays for out-of-range period", async () => {
    Users.findOne.mockResolvedValue(NEW_STUDENT);
    TimeTracking.find.mockResolvedValue([]);

    const res = await request(app).get(
      "/analytics/student/new_student/chart?from=2020-01-01&to=2020-01-31"
    );
    expect(res.status).toBe(200);
    expect(res.body.series.gameTime.every((v) => v === 0)).toBe(true);
  });
});

// ─── Student search — no matches ─────────────────────────────────

describe("Student search with no results", () => {
  test("returns empty array (not 404) when keyword matches nothing", async () => {
    Users.find.mockReturnValue({ limit: jest.fn().mockResolvedValue([]) });
    const res = await request(app).get("/analytics/students/search?keyword=zzznomatch");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});
