/**
 * One-time migration: add country, state, school to existing user documents.
 *
 * Usage:
 *   node src/scripts/migrateLeaderboardUserFields.js
 *
 * Safe to run multiple times — only updates documents where the fields are missing
 * (i.e., $exists: false). Documents already containing the fields are skipped.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config   = require("config");

async function run() {
  await mongoose.connect(config.get("mongoURI"));
  console.log("Connected to MongoDB");

  const result = await mongoose.connection.collection("users").updateMany(
    { $or: [{ country: { $exists: false } }, { state: { $exists: false } }, { school: { $exists: false } }] },
    { $set: { country: null, state: null, school: null } }
  );

  console.log(`Migration complete: ${result.modifiedCount} documents updated`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
