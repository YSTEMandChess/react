const schedule = require("node-schedule");
const config = require("config");
const { MongoClient } = require('mongodb');
const { selectActivities } = require("../utils/activities");
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

const activityScheduler = async () => {
    return schedule.scheduleJob('0 0 * * *', async function () {
    /*const db = await getDb();
    const activities = db.collection("activities");
    const activitiesArray = await (activities.find({})).toArray();
    for(const userActivity of activitiesArray) {
        const newActivities = await selectActivities();
        const id = userActivity._id;
        await activities.updateOne(
            { _id: id},
            { $set: { activities: newActivities } }
        )
    }*/
   console.log(`Resetting activities (${new Date().toLocaleString()})`);
})}

module.exports = { activityScheduler };