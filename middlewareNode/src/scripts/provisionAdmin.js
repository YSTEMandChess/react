/**
 * Admin Role Provisioning Script
 *
 * Promotes an existing user account to role="admin" in production.
 * Safe to run multiple times — uses findOneAndUpdate with { new: true }.
 *
 * Usage:
 *   ADMIN_USERNAME=karthik node src/scripts/provisionAdmin.js
 *
 * The target user must already exist. Create via the normal signup flow first,
 * then run this script to elevate the role.
 *
 * Requires the MONGO_URI environment variable or a valid config/default.json.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config   = require("config");

const targetUsername = process.env.ADMIN_USERNAME;
if (!targetUsername) {
  console.error("Error: ADMIN_USERNAME environment variable is required.");
  console.error("Usage: ADMIN_USERNAME=karthik node src/scripts/provisionAdmin.js");
  process.exit(1);
}

async function run() {
  await mongoose.connect(config.get("mongoURI"));
  console.log("Connected to MongoDB");

  const result = await mongoose.connection
    .collection("users")
    .findOneAndUpdate(
      { username: targetUsername },
      { $set: { role: "admin" } },
      { returnDocument: "after" }
    );

  if (!result) {
    console.error(`User "${targetUsername}" not found. Create the account first.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Success: "${targetUsername}" is now role="${result.role}"`);
  console.log(`Email: ${result.email}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Provisioning failed:", err.message);
  process.exit(1);
});
