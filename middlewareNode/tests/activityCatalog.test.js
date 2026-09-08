/**
 * Unit tests for the activity catalog — the source of truth mapping
 * activity names to taskId/route/displayName.
 */

const { activityCatalog, getActivityCatalogEntry } = require("../src/config/activityCatalog");

describe("activityCatalog", () => {
  test("every catalog entry has taskId, displayName, and route", () => {
    Object.entries(activityCatalog).forEach(([name, entry]) => {
      expect(entry).toHaveProperty("taskId");
      expect(entry).toHaveProperty("displayName");
      expect(entry).toHaveProperty("route");
      expect(typeof entry.taskId).toBe("string");
      expect(typeof entry.displayName).toBe("string");
      expect(typeof entry.route).toBe("string");
    });
  });

  test("every route starts with a leading slash", () => {
    Object.values(activityCatalog).forEach((entry) => {
      expect(entry.route.startsWith("/")).toBe(true);
    });
  });
});

describe("getActivityCatalogEntry", () => {
  test("returns the correct entry for a known activity name", () => {
    const entry = getActivityCatalogEntry("captureQueen");
    expect(entry.taskId).toBe("captureQueen");
    expect(entry.displayName).toBe("Capture a Queen");
    expect(entry.route).toBe("/puzzles");
  });

  test("returns a fallback entry for an unknown activity name (not undefined)", () => {
    const entry = getActivityCatalogEntry("someFutureActivity");
    expect(entry).toBeDefined();
    expect(entry.taskId).toBe("someFutureActivity");
    expect(entry.route).toBe("/student");
  });

  test("fallback entry still has all required fields", () => {
    const entry = getActivityCatalogEntry("unknownActivity123");
    expect(entry).toHaveProperty("taskId");
    expect(entry).toHaveProperty("displayName");
    expect(entry).toHaveProperty("route");
  });
});
