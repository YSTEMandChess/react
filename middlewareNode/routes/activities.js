const config = require("config");
const express = require('express');
const passport = require("passport");
const router = express.Router();
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

router.get("/", async (req, res) => {
    try {
        const db = await getDb();
        const username = req.params.username;
        
        if(!username) {
            res.status(401).json({error:'Authentication required'});
        }
        const users = db.collection("users");
        const currentUser = await users.findOne(
            { username },
        );
        if(!currentUser) {
            res.status(404).json({error: "User not found!"});
        }
        const userId = currentUser._id;
        const activities = db.collection("activities");
        const userActivities = await activities.find(
            { userId },
        );
        res.status(200).json({activities: userActivities});

    } catch (err) {
        console.error('Error fetching activities: ', err);
        res.status(500).json({error: 'Server error'});
    }
})


router.put("/activity/:activityName", async (req, res) => {
    try {
        const db = await getDb();
        const { username, activityName } = req.params;
        if(!username) {
            res.status(401).json({error:'Authentication required'});
        }
        const users = db.collection("users");
        const currentUser = await users.findOne(
            { username }, 
        );
        if(!currentUser) {
            res.status(404).json({error:"User not found!"});
        }
        const userId = currentUser._id;
        //use userId as parameter to select document to update
            //pass activity name in reqeust to update to completed
        const activities = db.collection("activities");
        /*await activities.updateOne(
            { userId, "activities.name": activityName },
            { $set: { "activities.$.completed": true } }
        );*/
        res.status(200);
    } catch (err) {
        console.error('Error updating activities: ', err);
        res.status(500).json({error: 'Server error'});
    }
})

router.post("/activity/complete", async (req, res) => {
    try {
        const db = await getDb();
        const { username } = req.params;
        if(!username) {
            res.status(401).json({error:'Authentication required'});
        }
        const users = db.collection("users");
        const currentUser = await users.findOne(
            { username }, 
        );
        if(!currentUser) {
            res.status(404).json({error:"User not found!"});
        }
        const userId = currentUser._id;
        //use userId as parameter to select document to update
            //pass activity name in reqeust to update to completed
        const activities = db.collection("activities");
        /*await activities.updateOne(
            { userId },
            { $push: { lastCompleted: new Date() } }
        );*/
        res.status(200);
    } catch (err) {
        console.error('Error updating activity completion: ', err);
        res.status(500).json({error: 'Server error'});
    }
})


module.exports = router;