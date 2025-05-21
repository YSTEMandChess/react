const config = require("config");
const express = require('express');
const passport = require("passport");
const router = express.Router();
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(config.get("mongoURI"));

// Get the number of lessons completed for a chess piece for a specific user
// example: `${environment.urls.middlewareURL}/lessons/getCompletedLesson?piece=pawn`
router.get(
  "/getCompletedLesson",
  async (req, res, next) => {
    passport.authenticate("jwt", { session: false }, async (err, user, info) => {
      req.user = user || null;
      next();
    })(req, res, next) // authenticate jwt
  },
  async (req, res) => {
    const piece = decodeURIComponent(req.query.piece);

    if (!piece) {
      return res.status(400).json("Error: 400. Please provide a piece.");
    }
    try {
      await client.connect();
      const db = client.db("ystem");
      const users = db.collection("users"); // get users collection
      const guests = db.collection("guests"); // get guests collection

      if (req.user) {
        const { username } = req.user; // get username from jwt

        const userDoc = await users.findOne( // get the userDoc according to username
          { username: username },
          { projection: { lessonsCompleted: 1 } }
        );

        let lessonNum = 0;

        if (!userDoc) throw new Error("User does not exist");
        if (!userDoc.lessonsCompleted) throw new Error("User does not have lesson record");

        for (const chessPiece of userDoc.lessonsCompleted) {
          if (chessPiece.piece === piece) {
            lessonNum = chessPiece.lessonNumber; // the number of lessons completed for the piece
            break;
          }
        }

        res.json(lessonNum);
      } else {
        const clientIp = getClientIp(req);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await guests.updateOne(
          { ip: clientIp },
          {
            $set: {
              ip: clientIp,
              updatedAt: new Date(),
              expiresAt,
            },
            $setOnInsert: {
              lessonsCompleted: [
                { piece: "rook", lessonNumber: 0 },
                { piece: "bishop", lessonNumber: 0 },
                { piece: "queen", lessonNumber: 0 },
                { piece: "king", lessonNumber: 0 },
                { piece: "pawn", lessonNumber: 0 },
                { piece: "horse", lessonNumber: 0 },
              ],
            },
          },
          { upsert: true }
        );

        const guestDoc = await guests.findOne(
          { ip: clientIp },
          { projection: { lessonsCompleted: 1 } }
        );

        let lessonNum = 0;

        if (!guestDoc) throw new Error("Guest does not exist");

        for (const chessPiece of guestDoc.lessonsCompleted) {
          if (chessPiece.piece === piece) {
            lessonNum = chessPiece.lessonNumber; // the number of lessons completed for the piece
            break;
          }
        }
        
        res.json(lessonNum);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    } finally {
      await client.close();
    }
  }
);

// Get how many lessons there are for a specific piece
// example: `${environment.urls.middlewareURL}/lessons/getTotalPieceLesson?piece=pawn`
router.get(
  "/getTotalPieceLesson",
  passport.authenticate("jwt", { session: false }), //authenticate jwt
  async (req, res) => {
    const piece = decodeURIComponent(req.query.piece); // get the chess piece

    if (!piece) {
      return res.status(400).json("Error: 400. Please provide a piece.");
    }

    try {
      await client.connect();
      const db = client.db("ystem");
      const lessonsCollection = db.collection("lessons"); // get lessons collection

      const total = await lessonsCollection.countDocuments({ piece }); // get # of lessons for that piece
      res.json(total);
    } catch (err) {
      console.error(err);
      res.status(500).json("Internal server error.");
    } finally {
      await client.close();
    }
  }
);

// Get the lesson content for a piece, note that parameter lessonNum is # of lessons completed
// so lessonNum=0 will get lesson #1 and lessonNum=1 will get lesson #2
// example: `${environment.urls.middlewareURL}/lessons/getLesson?piece=pawn&lessonNum=0`
router.get(
  "/getLesson",
  passport.authenticate("jwt", { session: false }), //authenticate jwt
  async (req, res) => {
    // get piece & lessonNum from query
    const piece = decodeURIComponent(req.query.piece);
    const lessonNum = Number(decodeURIComponent(req.query.lessonNum));

    if (!piece || isNaN(lessonNum)) {
      return res.status(400).json("Error: 400. Missing or invalid parameters.");
    }

    try {
      await client.connect();
      const db = client.db("ystem");
      const lessons = db.collection("lessons"); // get lessons collection

      const lessonDoc = await lessons.findOne( // get lessonDoc for specific chess piece
        { piece: piece }
      );
      if (!lessonDoc) return res.status(400).json("Error: 400. Invalid piece.");;

      let found = false;
      for (const lesson of lessonDoc.lessons) { // try to find lesson content for that lessonNum
        if (lesson.lessonNumber === lessonNum + 1) {
          res.json(lesson); // put lesson in response
          found = true;
          break;
        }
      // not found
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

// Update a user's progress in lessons for a chess piece
// Note that lessonNum is current progress, passing lessonNum=0 will update progress to 1
// example: `${environment.urls.middlewareURL}/lessons/updateLessonCompletion?piece=pawn&lessonNum=0`
router.get(
  "/updateLessonCompletion",
  async (req, res, next) => {
    passport.authenticate("jwt", { session: false }, async (err, user, info) => {
      req.user = user || null;
      next();
    })(req, res, next) // authenticate jwt
  },
  async (req, res) => {
    // get parameters from query
    const piece = decodeURIComponent(req.query.piece);
    const lessonNum = Number(decodeURIComponent(req.query.lessonNum));

    if (!piece || isNaN(lessonNum)) {
      return res.status(400).json("Error: 400. Missing or invalid parameters.");
    }
    try {
      await client.connect();
      const db = client.db("ystem");
      const users = db.collection("users"); // get users collection
      const guests = db.collection("guest"); // get users collection

      if (req.user){
        const userDoc = await users.findOne( // get userDoc by username
          { username: username },
          { projection: { lessonsCompleted: 1 } }
        );

        if (!userDoc) throw new Error("User does not exist");
        if (!userDoc.lessonsCompleted) throw new Error("User does not have lesson record");

        let index = -1; // index for that piece
        userDoc.lessonsCompleted.forEach((lesson, i) => { // try finding user's progress for that piece
          if (lesson.piece === piece) {
            index = i;
          }
        });

        if (index === -1) { // piece progress not found
          return res.status(404).json("Piece not found in lessonsCompleted");
        }

        const updateResult = await users.updateOne(
          { username },
          {
            $set: {
              [`lessonsCompleted.${index}`]: {
                piece,
                lessonNumber: lessonNum + 1, // update user's lesson progress for the piece
              },
            },
          }
        );

        // check if changes have been made in db
        if (updateResult.modifiedCount > 0) {
          res.status(200).json("Lesson progress updated");
        } else {
          res.status(304).json("No changes made");
        }
      } else {
        const clientIp = getClientIp(req);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await guests.updateOne(
          { ip: clientIp },
          {
            $set: {
              ip: clientIp,
              updatedAt: new Date(),
              expiresAt,
            },
            $setOnInsert: {
              lessonsCompleted: [
                { piece: "rook", lessonNumber: 0 },
                { piece: "bishop", lessonNumber: 0 },
                { piece: "queen", lessonNumber: 0 },
                { piece: "king", lessonNumber: 0 },
                { piece: "pawn", lessonNumber: 0 },
                { piece: "horse", lessonNumber: 0 },
              ],
            },
          },
          { upsert: true }
        );

        const updateResult = await guests.updateOne(
          { ip: clientIp, "lessonsCompleted.piece": piece },
          {
            $inc: {
              "lessonsCompleted.$.lessonNumber": 1,
            },
          }
        )

        if (updateResult.modifiedCount === 0) {
          console.warn("Lesson not updated. Piece may not exist in lessonsCompleted.");
        }

        console.log(await guests.find({}).toArray())
        return res.status(200).json("Guest lesson progress saved");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    } finally {
      await client.close();
    }
  }
);

function getClientIp(req) {
  return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
}

module.exports = router;
