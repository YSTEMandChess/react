const config = require("config");
const express = require('express');
const router = express.Router({mergeParams: true});
const { MongoClient, ObjectId } = require('mongodb');
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

router.get("/", async (req, res) => {
    try {
        const db = await getDb();
        const { username } = req.params;
        if(!username) {
            return res.status(401).json({error:'Authentication required'});
        }
        const users = db.collection("users");
        const currentUser = await users.findOne(
            { username },
        );
        if(!currentUser) {
            return res.status(404).json({error: "User not found!"});
        }
        const userId = currentUser._id;
        const activities = db.collection("activities");
        const userActivities = await activities.findOne(
            { userId }, { projection: {activities: 1, _id: 0}}
        );
        return res.status(200).json({activities: userActivities});

    } catch (err) {
        console.error('Error fetching activities: ', err);
        return res.status(500).json({error: 'Server error'});
    }
})

router.get("/dates", async (req, res) => {
    try {
        const db = await getDb(); 
        const { username } = req.params;
        if(!username) {
            return res.status(401).json({error: "User not found"});
        }
        const users = db.collection("users");
        const currentUser = await users.findOne({ 
            username ,
        });
        if(!currentUser) {
            return res.status(401).json({error: "User not found"});
        }
        const userId = currentUser._id;
        const activities = db.collection("activities");
        const completedDates = await activities.findOne(
            { userId }, {projection: {_id: 0, completedDates: 1}}
        );
        return res.status(200).json({dates: completedDates});
    } catch (err) {
        console.error("Error fetching activity completion dates: ", err);
        return res.status(500).json({error: 'Server error'});
    }
});


router.put("/activity/:activityName", async (req, res) => {
    try {
        const db = await getDb();
        const { username, activityName } = req.params;
        if(!username) {
            return res.status(401).json({error:'Authentication required'});
        }
        const users = db.collection("users");
        const currentUser = await users.findOne(
            { username }, 
        );
        if(!currentUser) {
            return res.status(404).json({error:"User not found!"});
        }
        const userId = currentUser._id;
        const activities = db.collection("activities");
        await activities.updateOne(
            { userId, "activities.name": activityName },
            { $set: { "activities.$.completed": true } }
        );
        return res.status(200);
    } catch (err) {
        console.error('Error updating activities: ', err);
        return res.status(500).json({error: 'Server error'});
    }
})

router.post("/activity/complete", async (req, res) => {
    try {
        const db = await getDb();
        const { username } = req.params;
        if(!username) {
            return res.status(401).json({error:'Authentication required'});
        }
        const users = db.collection("users");
        const currentUser = await users.findOne(
            { username }, 
        );
        if(!currentUser) {
            return res.status(404).json({error:"User not found!"});
        }
        const userId = currentUser._id;
        const activities = db.collection("activities");
        await activities.updateOne(
            { userId },
            { $push: { lastCompleted: new Date() } }
        );
        return res.status(200);
    } catch (err) {
        console.error('Error updating activity completion: ', err);
        res.status(500).json({error: 'Server error'});
    }
})


module.exports = router;