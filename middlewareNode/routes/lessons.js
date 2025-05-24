const config = require("config");
const express = require('express');
const passport = require("passport");
const router = express.Router();
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
require('dotenv').config();

let cachedClient = null;

async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(config.get("mongoURI"));
    await cachedClient.connect();
  }
  return cachedClient.db("ystem");
}

router.get(
  "/peek",
  async (req, res, next) => {
    passport.authenticate("jwt", { session: false }, async (err, user, info) => {
      req.user = user || null;
      next();
    })(req, res, next) // authenticate jwt
  },
  async (req, res) => {
    try {
      const db = await getDb();
      const guest = db.collection("guest");
      const guestDoc = await guest.find({}).toArray();
      console.log(guestDoc)
    } catch (err) {
      console.error(err);
      res.status(500).json("Internal server error.");
    }
  }
);

router.get(
  "/test",
  async (req, res, next) => {
    passport.authenticate("jwt", { session: false }, async (err, user, info) => {
      req.user = user || null;
      next();
    })(req, res, next) // authenticate jwt
  },
  async (req, res) => {
    try {
      const db = await getDb();
      const lessons = db.collection("newLessons");
      
      for(let i = 0; i < array.length; i++){
        let rawInput = array[i];
        let document = {
          piece: rawInput.name,
          lessons: rawInput.subSections.map((section, index) => ({
            lessonNum: index + 1,
            name: section.name,
            startFen: section.fen,
            info: section.info
          }))
        };
        let result = await lessons.insertOne(document);
        console.log(result)
      }
    } catch (err) {
      console.error(err);
      res.status(500).json("Internal server error.");
    }
  }
);

// Get the number of lessons completed for a chess piece for a specific user
// example: `${environment.urls.middlewareURL}/lessons/getCompletedLessonCount?piece=pawn`
router.get(
  "/getCompletedLessonCount",
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
      const db = await getDb();
      const users = db.collection("users"); // get users collection
      const guests = db.collection("guest"); // get guests collection

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
  {
    piece: 'Piece Checkmate 1 Basic checkmates',
    lessonNumber: 0
  },
  {
    piece: 'Checkmate Pattern 1 Recognize the patterns',
    lessonNumber: 0
  },
  {
    piece: 'Checkmate Pattern 2 Recognize the patterns',
    lessonNumber: 0
  },
  {
    piece: 'Checkmate Pattern 3 Recognize the patterns',
    lessonNumber: 0
  },
  {
    piece: 'Checkmate Pattern 4 Recognize the patterns',
    lessonNumber: 0
  },
  {
    piece: 'Piece checkmates 2 Challenging checkmates',
    lessonNumber: 0
  },
  {
    piece: 'Knight and Bishop Mate interactive lesson',
    lessonNumber: 0
  },
  { piece: 'The Pin Pin it to win it', lessonNumber: 0 },
  { piece: 'The Skewer Yum - Skewers!', lessonNumber: 0 },
  { piece: 'The Fork Use the fork, Luke', lessonNumber: 0 },
  {
    piece: 'Discovered Attacks Including discovered checks',
    lessonNumber: 0
  },
  { piece: 'Double Check A very powerfull tactic', lessonNumber: 0 },
  {
    piece: 'Overloaded Pieces They have too much work',
    lessonNumber: 0
  },
  { piece: 'Zwischenzug In-between moves', lessonNumber: 0 },
  { piece: 'X-Ray Attacking through an enemy piece', lessonNumber: 0 },
  { piece: 'Zugzwang Being forced to move', lessonNumber: 0 },
  {
    piece: 'Interference Interpose a piece to great effect',
    lessonNumber: 0
  },
  {
    piece: 'Greek Gift Study the greek gift scrifice',
    lessonNumber: 0
  },
  { piece: 'Deflection Distracting a defender', lessonNumber: 0 },
  { piece: 'Attraction Lure a piece to bad square', lessonNumber: 0 },
  {
    piece: 'Underpromotion Promote - but not to a queen!',
    lessonNumber: 0
  },
  {
    piece: 'Desperado A piece is lost, but it can still help',
    lessonNumber: 0
  },
  {
    piece: 'Counter Check Respond to a check with a check',
    lessonNumber: 0
  },
  { piece: 'Undermining Remove the defending piece', lessonNumber: 0 },
  { piece: 'Clearance Get out of the way!', lessonNumber: 0 },
  { piece: 'Key Squares Reach the key square', lessonNumber: 0 },
  { piece: 'Opposition take the opposition', lessonNumber: 0 },
  { piece: '7th-Rank Rook Pawn Versus a Queen', lessonNumber: 0 },
  {
    piece: '7th-Rank Rook Pawn And Passive Rook vs Rook',
    lessonNumber: 0
  },
  { piece: 'Basic Rook Endgames Lucena and Philidor', lessonNumber: 0 }
],
            },
          },
          { upsert: true }
        );

        const guestDoc = await guests.findOne(
          { ip: clientIp }
        );

        let lessonNum = -1;

        if (!guestDoc) throw new Error("Guest does not exist");

        for (const chessPiece of guestDoc.lessonsCompleted) {
          if (chessPiece.piece === piece) {
            lessonNum = chessPiece.lessonNumber; // the number of lessons completed for the piece
            break;
          }
        }
        if(lessonNum == -1) return res.status(400).json("Error: 400. Invalid piece.");
        else res.json(lessonNum);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Get how many lessons there are for a specific piece
// example: `${environment.urls.middlewareURL}/lessons/getTotalPieceLesson?piece=pawn`
router.get(
  "/getTotalPieceLesson",
  async (req, res, next) => {
    passport.authenticate("jwt", { session: false }, async (err, user, info) => {
      req.user = user || null;
      next();
    })(req, res, next) // authenticate jwt
  },
  async (req, res) => {
    const piece = decodeURIComponent(req.query.piece); // get the chess piece

    if (!piece) {
      return res.status(400).json("Error: 400. Please provide a piece.");
    }

    try {
      const db = await getDb();
      const lessons= db.collection("newLessons"); // get lessons collection
      const lessonDoc = await lessons.findOne({ piece: piece });

      res.json(lessonDoc.lessons.length);
    } catch (err) {
      console.error(err);
      res.status(500).json("Internal server error.");
    }
  }
);

// Get the lesson content for a piece, note that parameter lessonNum is # of lessons completed
// so lessonNum=0 will get lesson #1 and lessonNum=1 will get lesson #2
// example: `${environment.urls.middlewareURL}/lessons/getLesson?piece=pawn&lessonNum=0`
router.get(
  "/getLesson",
  async (req, res, next) => {
    passport.authenticate("jwt", { session: false }, async (err, user, info) => {
      req.user = user || null;
      next();
    })(req, res, next) // authenticate jwt
  },
  async (req, res) => {
    // get piece & lessonNum from query
    const piece = decodeURIComponent(req.query.piece);
    const lessonNum = Number(decodeURIComponent(req.query.lessonNum));

    if (!piece || isNaN(lessonNum)) {
      return res.status(400).json("Error: 400. Missing or invalid parameters.");
    }

    try {
      const db = await getDb();
      const lessons = db.collection("newLessons"); // get lessons collection

      const lessonDoc = await lessons.findOne({ piece: piece });

      if (!lessonDoc) return res.status(400).json("Error: 400. Invalid piece.");;

      if (lessonNum <= 0 || lessonNum > lessonDoc.lessons.length) {
        return res.status(404).json("Lesson index out of range");
      } else {
        res.json(lessonDoc.lessons[lessonNum - 1]); 
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
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
      const db = await getDb();
      const users = db.collection("users"); // get users collection
      const guests = db.collection("guest"); // get users collection

      if (req.user){
        const { username } = req.user;

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
  {
    piece: 'Piece Checkmate 1 Basic checkmates',
    lessonNumber: 0
  },
  {
    piece: 'Checkmate Pattern 1 Recognize the patterns',
    lessonNumber: 0
  },
  {
    piece: 'Checkmate Pattern 2 Recognize the patterns',
    lessonNumber: 0
  },
  {
    piece: 'Checkmate Pattern 3 Recognize the patterns',
    lessonNumber: 0
  },
  {
    piece: 'Checkmate Pattern 4 Recognize the patterns',
    lessonNumber: 0
  },
  {
    piece: 'Piece checkmates 2 Challenging checkmates',
    lessonNumber: 0
  },
  {
    piece: 'Knight and Bishop Mate interactive lesson',
    lessonNumber: 0
  },
  { piece: 'The Pin Pin it to win it', lessonNumber: 0 },
  { piece: 'The Skewer Yum - Skewers!', lessonNumber: 0 },
  { piece: 'The Fork Use the fork, Luke', lessonNumber: 0 },
  {
    piece: 'Discovered Attacks Including discovered checks',
    lessonNumber: 0
  },
  { piece: 'Double Check A very powerfull tactic', lessonNumber: 0 },
  {
    piece: 'Overloaded Pieces They have too much work',
    lessonNumber: 0
  },
  { piece: 'Zwischenzug In-between moves', lessonNumber: 0 },
  { piece: 'X-Ray Attacking through an enemy piece', lessonNumber: 0 },
  { piece: 'Zugzwang Being forced to move', lessonNumber: 0 },
  {
    piece: 'Interference Interpose a piece to great effect',
    lessonNumber: 0
  },
  {
    piece: 'Greek Gift Study the greek gift scrifice',
    lessonNumber: 0
  },
  { piece: 'Deflection Distracting a defender', lessonNumber: 0 },
  { piece: 'Attraction Lure a piece to bad square', lessonNumber: 0 },
  {
    piece: 'Underpromotion Promote - but not to a queen!',
    lessonNumber: 0
  },
  {
    piece: 'Desperado A piece is lost, but it can still help',
    lessonNumber: 0
  },
  {
    piece: 'Counter Check Respond to a check with a check',
    lessonNumber: 0
  },
  { piece: 'Undermining Remove the defending piece', lessonNumber: 0 },
  { piece: 'Clearance Get out of the way!', lessonNumber: 0 },
  { piece: 'Key Squares Reach the key square', lessonNumber: 0 },
  { piece: 'Opposition take the opposition', lessonNumber: 0 },
  { piece: '7th-Rank Rook Pawn Versus a Queen', lessonNumber: 0 },
  {
    piece: '7th-Rank Rook Pawn And Passive Rook vs Rook',
    lessonNumber: 0
  },
  { piece: 'Basic Rook Endgames Lucena and Philidor', lessonNumber: 0 }
],
            },
          },
          { upsert: true }
        );

        const guestDoc = await guests.findOne( // get userDoc by ip
          { ip: clientIp }
        );

        let index = -1; // index for that piece
        guestDoc.lessonsCompleted.forEach((lesson, i) => { // try finding user's progress for that piece
          if (lesson.piece === piece) {
            index = i;
          }
        });

        if (index === -1) { // piece progress not found
          return res.status(404).json("Piece not found in lessonsCompleted");
        }

        const updateResult = await guests.updateOne(
          { ip: clientIp },
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
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

function getClientIp(req) {
  return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
}

module.exports = router;


const array = [
{
    name: 'Piece Checkmate 1 Basic checkmates',
    subSections: [
    {
        name: 'Queen and rook mate',
        fen: '8/8/3k4/8/8/4K3/8/Q6R w - - 0 1',
        info: 'Use your queen and rook to restrict the king and deliver checkmate. Mate in 3 if played perfectly.',
    },
    {
        name: 'Two rook mate',
        fen: '8/8/3k4/8/8/4K3/8/R6R w - - 0 1',
        info: `Use your rooks to restrict the king and deliver checkmate. Mate in 4 if played perfectly.`,
    },
    {
        name: 'Queen and bishop mate',
        fen: '8/8/3k4/8/8/2QBK3/8/8 w - - 0 1',
        info: `Use your queen and bishop to restrict the king and deliver checkmate. Mate in 5 if played perfectly.`,
    },
    {
        name: 'Queen and knight mate',
        fen: '8/8/3k4/8/8/2QNK3/8/8 w - - 0 1',
        info: `Use your queen and knight to restrict the king and deliver checkmate. Mate in 5 if played perfectly.`,
    },
    {
        name: 'Queen mate',
        fen: '8/8/3k4/8/8/4K3/8/4Q3 w - - 0 1',
        info: `Use your queen to restrict the king, force it to the edge of the board and deliver checkmate. The queen can't do it alone, so use your king to help. Mate in 6 if played perfectly.`,
    },
    {
        name: 'Rook mate',
        fen: '8/8/3k4/8/8/4K3/8/4R3 w - - 0 1',
        info: `Use your rook to restrict the king, force it to the edge of the board and deliver checkmate. The rook can't do it alone, so use your king to help. Mate in 11 if played perfectly.`,
    },
    ],
},];