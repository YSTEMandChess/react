/**
 * Unit tests for computeBadgePredicates — server-side derivation of badge
 * eligibility stats. Exists to close R-1: check-and-award must never trust
 * a client-supplied predicates body.
 */

jest.mock("../src/models/users");
jest.mock("../src/utils/studentStats");

const Users = require("../src/models/users");
const studentStats = require("../src/utils/studentStats");
const { computeBadgePredicates, getLessonsCompletedCount } = require("../src/badges/predicates");

afterEach(() => jest.clearAllMocks());

describe("getLessonsCompletedCount", () => {
  test("counts only entries with lessonNumber > 0 — every user starts with the full catalog at 0", async () => {
    // Regression case: every new user's lessonsCompleted array is
    // pre-populated with the full lesson catalog, each at lessonNumber: 0
    // (models/defaultLessons.js) — that's "not started," not "completed."
    // A version of this function that merely checked field presence
    // counted every default-0 entry as completed, awarding first_lesson
    // to every brand-new signup (caught by a real E2E run against a
    // freshly-signed-up user, not by mocked unit tests with hand-picked
    // fixtures that never exercised the true default shape).
    Users.findOne.mockResolvedValue({
      lessonsCompleted: [
        { piece: "pawn", lessonNumber: 3 },   // real progress
        { piece: "rook", lessonNumber: 0 },   // untouched default — must NOT count
        { piece: "bishop", lessonNumber: 0 }, // untouched default — must NOT count
      ],
    });
    const count = await getLessonsCompletedCount("alice");
    expect(count).toBe(1);
  });

  test("an entry with no lessonNumber field at all also does not count", async () => {
    Users.findOne.mockResolvedValue({
      lessonsCompleted: [{ piece: "bishop" }],
    });
    const count = await getLessonsCompletedCount("alice");
    expect(count).toBe(0);
  });

  test("returns 0 when user has no lessonsCompleted field", async () => {
    Users.findOne.mockResolvedValue({});
    const count = await getLessonsCompletedCount("bob");
    expect(count).toBe(0);
  });

  test("returns 0 when user does not exist", async () => {
    Users.findOne.mockResolvedValue(null);
    const count = await getLessonsCompletedCount("nobody");
    expect(count).toBe(0);
  });
});

describe("computeBadgePredicates", () => {
  test("returns real stats keyed to catalog criteria types", async () => {
    Users.findOne
      .mockResolvedValueOnce({ _id: "user-1" }) // existence check
      .mockResolvedValueOnce({ lessonsCompleted: [{ piece: "pawn", lessonNumber: 1 }] }); // lessons lookup
    studentStats.getUserStreak.mockResolvedValue(5);
    studentStats.getActivitiesCompleted.mockResolvedValue(12);

    const predicates = await computeBadgePredicates("alice");

    expect(predicates).toEqual({
      streak: 5,
      activities_days: 12,
      lesson_completed: 1,
    });
  });

  test("throws a 404-flagged error when the user does not exist", async () => {
    Users.findOne.mockResolvedValueOnce(null);
    await expect(computeBadgePredicates("nobody")).rejects.toMatchObject({
      message: "User not found",
      status: 404,
    });
  });

  test("ignores any client-supplied override — predicates are always server-derived", async () => {
    // computeBadgePredicates takes only a username; there is no parameter
    // through which a caller could inject a fabricated stat value.
    expect(computeBadgePredicates.length).toBe(1);
  });
});
