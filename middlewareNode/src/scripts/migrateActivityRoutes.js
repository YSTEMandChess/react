/**
 * One-time migration: add taskId and route to existing activity subdocuments.
 *
 * Usage:
 *   node src/scripts/migrateActivityRoutes.js
 *
 * Safe to run multiple times — only updates activity array entries missing
 * taskId/route. Existing entries with the fields already set are left as-is.
 * Uses activityCatalog as the source of truth for the taskId/route mapping.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config = require("config");
const { getActivityCatalogEntry } = require("../config/activityCatalog");

async function run() {
  await mongoose.connect(config.get("mongoURI"));
  console.log("Connected to MongoDB");

  const activitiesCollection = mongoose.connection.collection("activities");
  const docs = await activitiesCollection
    .find({ "activities.taskId": { $exists: false } })
    .toArray();

  let modifiedCount = 0;

  for (const doc of docs) {
    const updatedActivities = (doc.activities || []).map((activity) => {
      if (activity.taskId && activity.route) return activity;
      const catalogEntry = getActivityCatalogEntry(activity.name);
      return {
        ...activity,
        taskId: activity.taskId || catalogEntry.taskId,
        route: activity.route || catalogEntry.route,
      };
    });

    await activitiesCollection.updateOne(
      { _id: doc._id },
      { $set: { activities: updatedActivities } }
    );
    modifiedCount++;
  }

  console.log(`Migration complete: ${modifiedCount} documents updated`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
