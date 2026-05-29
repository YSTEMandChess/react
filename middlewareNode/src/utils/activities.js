/**
 * Activities Utility
 * 
 * Provides functions for managing daily student activities.
 * Handles random selection of activities from the activity types catalog.
 */

const config = require("config");
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Cache database client to prevent repeated connections
let cachedClient = null;

/**
 * Gets database client, creating connection if needed
 * @returns {MongoDB.Db} Database instance
 */
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(config.get("mongoURI"));
    await cachedClient.connect();
  }
  return cachedClient.db("ystem");
}

/**
 * Fetches all available activity types from the database.
 * Call once and pass the result to selectActivitiesFromList to avoid repeated queries.
 * @returns {Array} Array of activity type documents from MongoDB
 */
const getActivityTypes = async () => {
    const db = await getDb();
    return (db.collection("activityTypes").find({})).toArray();
};

/**
 * Selects 4 random unique activities from a pre-fetched activity list.
 * Pure function — no DB access, safe to call in a loop.
 * @param {Array} activityList - Array of activity type documents
 * @returns {Array} Array of 4 activity objects with name, type, and completed fields
 */
const selectActivitiesFromList = (activityList) => {
    const chosenIds = [];
    const newActivities = [];

    while (newActivities.length < 4) {
        const selectedActivity = activityList[Math.floor(Math.random() * activityList.length)];

        if (!chosenIds.includes(selectedActivity._id)) {
            chosenIds.push(selectedActivity._id);
            newActivities.push({
                name: selectedActivity._id,
                type: selectedActivity.type,
                completed: false,
            });
        }
    }
    return newActivities;
};

/**
 * Convenience wrapper — queries DB then selects 4 activities.
 * Use this for one-off calls. Use getActivityTypes + selectActivitiesFromList in loops.
 * @returns {Array} Array of 4 activity objects
 */
const selectActivities = async () => {
    const activityList = await getActivityTypes();
    return selectActivitiesFromList(activityList);
};

module.exports = { selectActivities, getActivityTypes, selectActivitiesFromList };