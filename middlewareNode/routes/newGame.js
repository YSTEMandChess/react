const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
const config = require("config");

const verifyJWT = require("../utils/verifyJWT");

const mongoURI = config.get("mongoURI");

// @route   GET /waiting/join
// @desc    Add mentor or student to waiting list if not already waiting
// @access  Public via JWT
router.get("/join", async (req, res) => {
  const token = decodeURIComponent(req.query.jwt || "");
  const credentials = verifyJWT(token);

  if (typeof credentials === "string") {
    return res.status(400).send(credentials); // error message returned by verifyJWT
  }

  const { role, username, firstName, lastName } = credentials;

  if (role !== "mentor" && role !== "student") {
    return res.status(400).send("Please be either a student or a mentor.");
  }

  const client = new MongoClient(mongoURI);
  try {
    await client.connect();
    const db = client.db("ystem");
    const collection =
      role === "mentor"
        ? db.collection("waitingMentors")
        : db.collection("waitingStudents");

    const existing = await collection.findOne({ username });
    if (existing) {
      return res.status(409).send("Person already waiting for game.");
    }

    await collection.insertOne({
      username,
      firstName,
      lastName,
      requestedGameAt: Math.floor(Date.now() / 1000),
    });

    return res.status(200).send("Person Added Sucessfully.");
  } catch (err) {
    console.error("Error adding person to waitlist:", err);
    return res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
  }
});

router.delete("/leave", async (req, res) => {
  const token = decodeURIComponent(req.query.jwt || "");
  const credentials = verifyJWT(token);

  if (typeof credentials === "string") {
    return res.status(400).send(credentials); // "Error: 405..." or "406..."
  }

  const { username, role } = credentials;

  if (role !== "mentor" && role !== "student") {
    return res.status(400).send("Please be either a student or a mentor.");
  }

  const client = new MongoClient(mongoURI);
  try {
    await client.connect();
    const db = client.db("ystem");
    const collection =
      role === "mentor"
        ? db.collection("waitingMentors")
        : db.collection("waitingStudents");

    const existing = await collection.findOne({ username });

    if (!existing) {
      return res.status(404).send("Person is not waiting for a match.");
    }

    await collection.deleteOne({ username });

    return res.status(200).send("Person Removed Successfully.");
  } catch (error) {
    console.error("Error removing from waiting list:", error);
    return res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
  }
});

module.exports = router;
