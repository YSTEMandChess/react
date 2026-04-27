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
        return;
    }
    const userId = currentUser._id;
    return userId;
}

/**
 * GET /activities
 * Retrieves all daily activities for a user
 */
router.get("/:username", async (req, res) => {
    try {
        const db = await getDb();
        const { username } = req.params;
        const userId = await getUserId(db, username);
        if(!userId) {
            return res.status(404).json({error:'User not found'});
        }
        const activities = db.collection("activities");
        const userActivities = await activities.findOne(
            { userId }, { projection: {activities: 1, _id: 0}}
        );
        // Return a safe empty structure if no activities document exists yet
        if (!userActivities) {
            return res.status(200).json({ activities: { activities: [] } });
        }
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({activities: userActivities});

    } catch (err) {
        console.error('Error fetching activities: ', err);
        return res.status(500).json({error: 'Server error'});
    }
})

router.get("/:username/dates", async (req, res) => {
    try {
        const db = await getDb(); 
        const { username } = req.params;
        const userId = await getUserId(db, username);
        if(!userId) {
            return res.status(404).json({error: "User not found"});
        }
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


router.put("/:username/activity", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const db = await getDb();
        const username = req.user.username;
        const { activityName } = req.body;
        const userId = await getUserId(db, username);
        if(!userId) {
            return res.status(404).json({error:'User not found'});
        }
        const activities = db.collection("activities");
        const alreadyCompleted = await activities.findOne(
            { userId, activities: { $elemMatch: { name: activityName, completed: true } } }
        );
        if (alreadyCompleted) {
            return res.status(200).json({ message: 'already completed' });
        }
        const updateResult = await activities.updateOne(
            { userId, "activities.name": activityName },
            { $set: { "activities.$.completed": true } }
        );
        if (updateResult.modifiedCount === 0) {
            // Activity not in today's random selection — add it as completed
            const activityTypes = db.collection("activityTypes");
            const activityType = await activityTypes.findOne({ _id: activityName });
            const type = activityType?.type || "session";
            await activities.updateOne(
                { userId },
                { $push: { activities: { name: activityName, type, completed: true } } }
            );
        }
        const updatedDoc = await activities.findOne({ userId });
        const allDone = updatedDoc.activities.every(activity => activity.completed);
        if (allDone) {
            await activities.updateOne(
                { userId },
                { $push: { completedDates: new Date() } }
            );
        }
        return res.status(200).json({ message: 'success' });
    } catch (err) {
        console.error('Error updating activities: ', err);
        return res.status(500).json({error: 'Server error'});
    }
})


module.exports = router;