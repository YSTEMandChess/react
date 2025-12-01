/**
 * Activities Routes
 * 
 * API endpoints for managing daily student activities.
 * Handles retrieval and completion status of activities.
 * 
 * Features:
 * - Get user's daily activities
 * - Mark activities as completed
 * - Track activity completion for streaks and badges
 */

const config = require("config");
const express = require('express');
const passport = require("passport");
const router = express.Router({mergeParams: true});
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
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
 * Helper function to get user ID from username
 * @param {MongoDB.Db} db - Database instance
 * @param {string} username - Username to lookup
 * @returns {ObjectId} User's MongoDB _id
 */
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

/**
 * GET /activities
 * Retrieves all daily activities for a user
 */
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
        const userActivities = await activities.findOne(
            { userId }, { projection: {activities: 1, _id: 0}}
        );
        //compare move data with activities
    }
    catch (err) {
        console.error('Error checking move: ', err);
        res.status(500).json({error: 'Server error'});
    }
})

module.exports = router;