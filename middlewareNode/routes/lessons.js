const config = require("config");
const express = require('express');
const passport = require("passport");
const router = express.Router();
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(config.get("mongoURI"));

router.get(
  "/getCompletedLesson",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { username } = req.user;
    const piece = decodeURIComponent(req.query.piece);

    if (!piece) {
      return res.status(400).json("Error: 400. Please provide a piece.");
    }
    try {
      await client.connect();
      const db = client.db("ystem");
      const users = db.collection("users");

      const userDoc = await users.findOne(
        { username: username },
        { projection: { lessonsCompleted: 1 } }
      );

      let lessonNum = 0;

      if (!userDoc) throw new Error("User does not exist");
      if (!userDoc.lessonsCompleted) throw new Error("User does not have lesson record");

      for (const chessPiece of userDoc.lessonsCompleted) {
        if (chessPiece.piece === piece) {
          lessonNum = chessPiece.lessonNumber;
          break;
        }
      }

      res.json(lessonNum);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    } finally {
      await client.close();
    }
  }
);

router.get(
  "/getTotalPieceLesson",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const piece = decodeURIComponent(req.query.piece);

    if (!piece) {
      return res.status(400).json("Error: 400. Please provide a piece.");
    }

    try {
      await client.connect();
      const db = client.db("ystem");
      const lessonsCollection = db.collection("lessons");

      const total = await lessonsCollection.countDocuments({ piece });
      res.json(total);
    } catch (err) {
      console.error(err);
      res.status(500).json("Internal server error.");
    } finally {
      await client.close();
    }
  }
);

router.get(
  "/getLesson",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const piece = decodeURIComponent(req.query.piece);
    const lessonNum = Number(decodeURIComponent(req.query.lessonNum));

    if (!piece || isNaN(lessonNum)) {
      return res.status(400).json("Error: 400. Missing or invalid parameters.");
    }

    try {
      await client.connect();
      const db = client.db("ystem");
      const lessons = db.collection("lessons");

      const lessonDoc = await lessons.findOne(
        { piece: piece }
      );
      if (!lessonDoc) return res.status(400).json("Error: 400. Invalid piece.");;

      let found = false;
      for (const lesson of lessonDoc.lessons) {
        console.log(typeof lesson.lessonNumber, lesson.lessonNumber);
        console.log(typeof lessonNum, lessonNum);
        if (lesson.lessonNumber === lessonNum + 1) {
          res.json(lesson);
          found = true;
          break;
        }
      if (!found) return res.status(400).json("Error: 400. No more lessons left.");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    } finally {
      await client.close();
    }
  }
);

router.get(
  "/updateLessonCompletion",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { username } = req.user;
    const piece = decodeURIComponent(req.query.piece);
    const lessonNum = Number(decodeURIComponent(req.query.lessonNum));

    if (!piece || isNaN(lessonNum)) {
      return res.status(400).json("Error: 400. Missing or invalid parameters.");
    }
    try {
      await client.connect();
      const db = client.db("ystem");
      const users = db.collection("users");

      const userDoc = await users.findOne(
        { username: username },
        { projection: { lessonsCompleted: 1 } }
      );

      if (!userDoc) throw new Error("User does not exist");
      if (!userDoc.lessonsCompleted) throw new Error("User does not have lesson record");

      let index = -1;
      userDoc.lessonsCompleted.forEach((lesson, i) => {
        if (lesson.piece === piece) {
          index = i;
        }
      });

      if (index === -1) {
        return res.status(404).json("Piece not found in lessonsCompleted");
      }

      const updateResult = await users.updateOne(
      { username },
      {
        $set: {
          [`lessonsCompleted.${index}`]: {
            piece,
            lessonNumber: lessonNum + 1,
          },
        },
      }
    );
    if (updateResult.modifiedCount > 0) {
      res.status(200).json("Lesson progress updated");
    } else {
      res.status(304).json("No changes made");
    }

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    } finally {
      await client.close();
    }
  }
);

module.exports = router;
