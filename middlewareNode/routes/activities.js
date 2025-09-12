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

router.get("/:username", async (req, res) => {
    try {
        const db = await getDb();
        const username = req.params.username;
        
        if(!username) {
            res.status(401).json({error:'Authentication required'})
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

module.exports = router;