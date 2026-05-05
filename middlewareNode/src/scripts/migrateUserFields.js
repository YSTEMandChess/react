/**
 * One-time migration: add zipcode, gender, gradeLevel to existing user documents.
 *
 * Usage:
 *   node src/scripts/migrateUserFields.js
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
    // Only touch documents missing the new fields
    { $or: [{ zipcode: { $exists: false } }, { gender: { $exists: false } }, { gradeLevel: { $exists: false } }] },
    { $set: { zipcode: null, gender: null, gradeLevel: null } }
  );

  console.log(`Migration complete: ${result.modifiedCount} documents updated`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
