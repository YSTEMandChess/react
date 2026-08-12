/**
 * Unit tests for shared studentStats helpers, extracted from analytics.js
 * so leaderboard.js and analytics.js compute identical numbers.
 */

jest.mock("../src/models/timeTracking");
jest.mock("../src/models/activities");
jest.mock("../src/models/UserBadges");

const TimeTracking = require("../src/models/timeTracking");
const Activities = require("../src/models/activities");
const UserBadges = require("../src/models/UserBadges");
const {
  dateFilter,
  getUserTimeStats,
  getUserStreak,
  getActivitiesCompleted,
  getBadgesEarned,
} = require("../src/utils/studentStats");

afterEach(() => jest.clearAllMocks());

describe("dateFilter", () => {
  test("returns empty object when neither from nor to given", () => {
    expect(dateFilter(undefined, undefined)).toEqual({});
  });

  test("builds $gte when only from given", () => {
    const result = dateFilter("2026-01-01", undefined);
    expect(result.startTime.$gte).toEqual(new Date("2026-01-01"));
    expect(result.startTime.$lte).toBeUndefined();
  });

  test("builds $gte and $lte when both given", () => {
    const result = dateFilter("2026-01-01", "2026-02-01");
    expect(result.startTime.$gte).toEqual(new Date("2026-01-01"));
    expect(result.startTime.$lte).toEqual(new Date("2026-02-01"));
  });
});

describe("getUserTimeStats", () => {
  test("aggregates seconds into hours per event type", async () => {
    TimeTracking.find.mockResolvedValue([
      { eventType: "play", totalTime: 3600 },
      { eventType: "lesson", totalTime: 1800 },
      { eventType: "puzzle", totalTime: 900 },
    ]);

    const stats = await getUserTimeStats("alice");
    expect(stats.gameTimeHours).toBe(1);
    expect(stats.lessonTimeHours).toBe(0.5);
    expect(stats.puzzleTimeHours).toBe(0.25);
    expect(stats.totalTimeHours).toBe(1.75);
  });

  test("returns zeros when no events found", async () => {
    TimeTracking.find.mockResolvedValue([]);
    const stats = await getUserTimeStats("bob");
    expect(stats.totalTimeHours).toBe(0);
  });

  test("ignores unrecognized event types", async () => {
    TimeTracking.find.mockResolvedValue([{ eventType: "website", totalTime: 5000 }]);
    const stats = await getUserTimeStats("carol");
    expect(stats.totalTimeHours).toBe(0);
  });
});

describe("getUserStreak", () => {
  test("counts consecutive days with both lesson and puzzle events", async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    TimeTracking.find.mockResolvedValue([
      { eventType: "lesson", startTime: today },
      { eventType: "puzzle", startTime: today },
      { eventType: "lesson", startTime: yesterday },
      { eventType: "puzzle", startTime: yesterday },
    ]);

    const streak = await getUserStreak("alice");
    expect(streak).toBe(2);
  });

  test("a day with only lesson (missing puzzle) breaks the streak", async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    TimeTracking.find.mockResolvedValue([
      { eventType: "lesson", startTime: today },
      { eventType: "puzzle", startTime: today },
      { eventType: "lesson", startTime: yesterday }, // puzzle missing this day
    ]);

    const streak = await getUserStreak("bob");
    expect(streak).toBe(1);
  });

  test("only counts days present in the data — does not detect calendar gaps between recorded days", async () => {
    // Known behavior: the function iterates recorded days only, it does not
    // verify calendar adjacency between them. A gap in real-world dates with
    // no events on the gap day still counts as consecutive here.
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    TimeTracking.find.mockResolvedValue([
      { eventType: "lesson", startTime: today },
      { eventType: "puzzle", startTime: today },
      { eventType: "lesson", startTime: twoDaysAgo },
      { eventType: "puzzle", startTime: twoDaysAgo },
    ]);

    const streak = await getUserStreak("bob");
    expect(streak).toBe(2);
  });

  test("returns 0 when no events", async () => {
    TimeTracking.find.mockResolvedValue([]);
    const streak = await getUserStreak("carol");
    expect(streak).toBe(0);
  });
});

describe("getActivitiesCompleted", () => {
  test("returns total count when no date range given", async () => {
    Activities.findOne.mockResolvedValue({
      completedDates: [new Date("2026-01-01"), new Date("2026-01-02")],
    });
    const count = await getActivitiesCompleted("user-id-1");
    expect(count).toBe(2);
  });

  test("returns 0 when no activities document exists", async () => {
    Activities.findOne.mockResolvedValue(null);
    const count = await getActivitiesCompleted("user-id-2");
    expect(count).toBe(0);
  });

  test("filters by date range when given", async () => {
    Activities.findOne.mockResolvedValue({
      completedDates: [new Date("2026-01-01"), new Date("2026-03-01")],
    });
    const count = await getActivitiesCompleted("user-id-3", "2026-02-01", "2026-04-01");
    expect(count).toBe(1);
  });
});

describe("getBadgesEarned", () => {
  test("returns badge count for a user", async () => {
    UserBadges.findOne.mockResolvedValue({ earned: ["badge1", "badge2", "badge3"] });
    const count = await getBadgesEarned("alice");
    expect(count).toBe(3);
  });

  test("returns 0 when user has no badges document", async () => {
    UserBadges.findOne.mockResolvedValue(null);
    const count = await getBadgesEarned("bob");
    expect(count).toBe(0);
  });
});
