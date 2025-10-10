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
    const newActivities = [];
    while (newActivities.length < 4) {
        const selectedActivity = activityList[Math.floor(Math.random() * activityList.length)];
        if(!newActivities.includes(selectedActivity._id)) {
            newActivities.push(selectedActivity._id);
        }
    }
    return newActivities;
}

module.exports = { selectActivities };