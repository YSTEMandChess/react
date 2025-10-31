const config = require("config");
const { MongoClient } = require('mongodb');
require('dotenv').config();

let cachedClient = null; // cache db client to prevent repeated connections

// get db client
async function getDb() {
  if (!cachedClient) { // if not cached, connect
    cachedClient = new MongoClient(config.get("mongoURI"));
    await cachedClient.connect();
  }
  return cachedClient.db("ystem"); // returned cached client
}

const selectActivities = async () => {
  const db = await getDb();
  const activityList = await (db.collection("activityTypes").find({})).toArray();

  if (!Array.isArray(activityList) || activityList.length === 0) return [];

  // choose up to 4 unique activities
  const needed = Math.min(4, activityList.length);
  const idMap = new Map();
  while (idMap.size < needed) {
    const selectedActivity = activityList[Math.floor(Math.random() * activityList.length)];
    if (!selectedActivity || !selectedActivity._id) continue;
    idMap.set(selectedActivity._id.toString(), selectedActivity._id);
  }
  return Array.from(idMap.values());
};

module.exports = selectActivities;