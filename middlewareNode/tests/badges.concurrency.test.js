/**
 * Real-database tests for badge persistence — EDGE-02 (concurrency) and
 * ACH-07 (earnedAt/meta.at correctness).
 *
 * Uses mongodb-memory-server + real Mongoose models (no mocks) so both a
 * genuine race condition in awardIfEligible and the actual persisted
 * document shape can be verified directly, not inferred from a mocked
 * response body.
 *
 * Slower than the rest of the suite (real Mongo boot) — kept in its own
 * file so it can be excluded from fast local test-watch runs if needed.
 */

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

jest.setTimeout(60000);

let mongod;

beforeAll(async () => {
  // Default MongoMemoryServer launchTimeout (10s) can be exceeded when
  // Jest runs this file as a parallel worker alongside other real-Mongo
  // test files (e.g. leaderboard.analytics-consistency.test.js) all
  // contending to boot an instance at once — raised to absorb that
  // contention rather than flaking intermittently in CI.
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 30000 } });
  await mongoose.connect(mongod.getUri() + "ystem");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

describe("EDGE-02 — concurrent check-and-award calls do not duplicate badges", () => {
  test("two simultaneous awards for the same user produce exactly one badge entry", async () => {
    const { awardIfEligible } = require("../src/badges/service");

    const username = "concurrent-user";
    const predicates = { streak: 5 }; // qualifies for streak_5

    const [awardedA, awardedB] = await Promise.all([
      awardIfEligible(username, predicates),
      awardIfEligible(username, predicates),
    ]);

    const UserBadges = require("../src/models/UserBadges");
    const doc = await UserBadges.findOne({ userId: username });

    const streak5Entries = doc.earned.filter((e) => e.badgeId === "streak_5");
    expect(streak5Entries).toHaveLength(1);

    // Exactly one of the two concurrent calls should have "won" the award;
    // the other should see it as already earned (or also win, but never both).
    const totalAwarded = awardedA.filter((b) => b === "streak_5").length +
                          awardedB.filter((b) => b === "streak_5").length;
    expect(totalAwarded).toBeLessThanOrEqual(1);
  });

  test("ten simultaneous first-time award calls still yield exactly one badge document", async () => {
    const { awardIfEligible } = require("../src/badges/service");
    const username = "ten-way-race-user";

    await Promise.all(
      Array.from({ length: 10 }, () => awardIfEligible(username, { streak: 5 }))
    );

    const UserBadges = require("../src/models/UserBadges");
    const docs = await UserBadges.find({ userId: username });

    expect(docs).toHaveLength(1); // upsert never created duplicate user documents
    const streak5Entries = docs[0].earned.filter((e) => e.badgeId === "streak_5");
    expect(streak5Entries).toHaveLength(1); // never duplicated within the document
  });
});

describe("ACH-07 — earnedAt and meta.at are recorded correctly", () => {
  test("earnedAt is set to roughly now, and meta.at records the predicate value that triggered the award", async () => {
    const { awardIfEligible } = require("../src/badges/service");
    const UserBadges = require("../src/models/UserBadges");

    const username = "ach07-user";
    const before = new Date();
    await awardIfEligible(username, { streak: 7 }); // qualifies for streak_5, not streak_10
    const after = new Date();

    const doc = await UserBadges.findOne({ userId: username });
    const entry = doc.earned.find((e) => e.badgeId === "streak_5");

    expect(entry).toBeDefined();
    expect(entry.earnedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(entry.earnedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    // meta.at should reflect the real stat value (7) at time of award, not
    // the badge's threshold (5) — proves the actual predicate was recorded,
    // not just a pass/fail flag.
    expect(entry.meta.at).toBe(7);
  });

  test("a badge earned exactly at threshold records that exact value in meta.at", async () => {
    const { awardIfEligible } = require("../src/badges/service");
    const UserBadges = require("../src/models/UserBadges");

    const username = "ach07-exact-threshold-user";
    await awardIfEligible(username, { activities_days: 10 }); // exact threshold for activities_10

    const doc = await UserBadges.findOne({ userId: username });
    const entry = doc.earned.find((e) => e.badgeId === "activities_10");

    expect(entry.meta.at).toBe(10);
  });
});
