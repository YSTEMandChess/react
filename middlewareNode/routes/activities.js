const config = require("config");
const express = require('express');
const passport = require("passport");
const router = express.Router({mergeParams: true});
const jwt = require('jsonwebtoken');
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

async function getUserId(db, username) {
    const users = db.collection("users");
    const currentUser = await users.findOne(
        { username },
    );
    if(!currentUser) {
            return res.status(404).json({error: "User not found!"});
        }
    const userId = currentUser._id;
    return userId;
}

router.get("/", async (req, res) => {
    try {
        const db = await getDb();
        const { username } = req.params;
        if(!username) {
            return res.status(401).json({error:'Authentication required'});
        }
        const userId = getUserId(db, username);
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
        const userId = getUserId(db, username);
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
        const userId = getUserId(db, username);
        const activities = db.collection("activities");
        const activityIncomplete = await activities.findOne(
            { userId, "activities.name": activityName }, 
            { activities: {$elemMatch: { name: activityName }}, _id:0},
        );
        if(activityIncomplete) {
            console.log('incomplete activity: ', activityName);
        }
        /*await activities.updateOne(
            { userId, "activities.name": activityName },
            { $set: { "activities.$.completed": true } }
        );*/
        return res.status(200);
    } catch (err) {
        console.error('Error updating activities: ', err);
        return res.status(500).json({error: 'Server error'});
    }
})

router.put("/activity/check", async (req, res) => {
    try {
        const db = await getDb();
        const { username } = req.params;
        const { moveData } = req.body;
        if(!username) {
            return res.status(401).json({error:'Authentication required'});
        }
        const userId = getUserId(db, username);
        const activities = db.collection("activities");

        /*const userActivities = await activities.findOne(
            { userId, }, { projection: {activities: 1, _id: 0}}
        );*/
        //compare move data with activities
    }
    catch (err) {
        console.error('Error checking move: ', err);
        res.status(500).json({error: 'Server error'});
    }
})

module.exports = router;