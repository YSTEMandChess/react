const express = require("express");
const passport = require("passport");
const router = express.Router();
const crypto = require("crypto");
const { check, validationResult } = require("express-validator");
const users = require("../models/users");
const {
  ChangePasswordTemplateForUser,
} = require("../template/changePasswordTemplate");
const { sendMail } = require("../utils/nodemailer");
const { validator } = require("../utils/middleware");
const { MongoClient } = require('mongodb');
const config = require("config");
const activities = require("../models/activities");
let cachedClient = null; // cache db client to prevent repeated connections

// get db client
async function getDb() {
  if (!cachedClient) { // if not cached, connect
    cachedClient = new MongoClient(config.get("mongoURI"));
    await cachedClient.connect();
  }
  return cachedClient.db("ystem"); // returned cached client
}

// @route   GET /user/children
// @desc    GET the parent user's children username and their timePlayed fields
// @access  Public with jwt Authentication
router.get("/children", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { role, username } = req.user;
    if (role !== "parent") {
      res
        .status(400)
        .json("You must have a parent account to access your children");
    } else {
      //Find all children for the parent user and retrieve only the username and timePlayed field
      const childrenArray = await users
        .find({ parentUsername: username })
        .select(["timePlayed", "username"]);
      res.status(200).json(childrenArray);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});

// @route   POST /user/
// @desc    POST Signup the requested user with the provided credentials
// @access  Public
router.post(
  "/",
  // [
  //   check("username", "Username is required").not().isEmpty(),
  //   check("password", "Password is required").not().isEmpty(),
  //   check("first", "First name is required").not().isEmpty(),
  //   check("last", "Last name is required").not().isEmpty(),
  //   check("email", "Email address is required").not().isEmpty(),
  //   check("role", "Role is required").not().isEmpty(),
  // ],
  async (req, res) => {
    //Field validations for checks
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, first, last, email, role, students } =
      req.query;

    //Error catching when using mongoose functions like Users.findOne()
    try {
      const sha384 = crypto.createHash("sha384");
      hashedPassword = sha384.update(password).digest("hex");
      //Error checking to see if a user with the same username exists
      const user = await users.findOne({ username });
      if (user) {
        return res
          .status(400)
          .json("This username has been taken. Please choose another.");
      }

      //Set the account created date for the new user
      const currDate = new Date();


      //Switch statement for functionality depending on role
      if (role === "parent") {
        let studentsArray = JSON.parse(students);
        //Check if students array is present and is populated
        if (studentsArray && studentsArray.length > 0) {
          //Ensure student usernames aren't already in the database
          for (i = 0; i < studentsArray.length; i++) {
            const studentUser = await users.findOne({
              username: studentsArray[i].username,
            });
            if (studentUser) {
              return res
                .status(400)
                .json("This username has been taken. Please choose another.");
            }
          }

          //Insert the students into the database one at a time
          await Promise.all(
            studentsArray.map(async (student) => {
              const sha384 = crypto.createHash("sha384");
              const newStudent = new users({
                username: student.username,
                password: sha384.update(student.password).digest("hex"),
                firstName: student.first,
                lastName: student.last,
                email: student.email,
                parentUsername: username,
                role: "student",
                accountCreatedAt: currDate.toLocaleString(),
                timePlayed: 0,
              });
              await newStudent.save(function (err, user) {
                console.log(user.id);
                // Create activity document for new user
              });
            }),
          );
        }
      }
      const mainUser = new users({
        username,
        password: hashedPassword,
        firstName: first,
        lastName: last,
        email,
        role,
        accountCreatedAt: currDate.toLocaleString(),
      });
      await mainUser.save();

      res.status(200).json("Added users");
    } catch (error) {
      console.error(error.message);
      res.status(500).json("Server error");
    }
  },
);

// @route   POST /user/children
// @desc    POST Signup the student with the parent account
// @access  Public with jwt Authentication
router.post(
  "/children",
  [
    check("username", "Username is required").not().isEmpty(),
    check("password", "Password is required").not().isEmpty(),
    check("first", "First name is required").not().isEmpty(),
    check("email", "email is required").not().isEmpty(),
    check("last", "Last name is required").not().isEmpty(),
  ],
  passport.authenticate("jwt"),
  async (req, res) => {
    //Field validations for checks
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, first, last, email } = req.query;

    try {
      const sha384 = crypto.createHash("sha384");
      hashedPassword = sha384.update(password).digest("hex");

      const user = await users.findOne({ username });
      if (user) {
        return res
          .status(400)
          .json("This username has been taken. Please choose another.");
      }

      //Set the account created date for the new user
      const currDate = new Date();

      const newStudent = new users({
        username,
        password: hashedPassword,
        firstName: first,
        lastName: last,
        email: email,
        parentUsername: req.user.username,
        role: "student",
        accountCreatedAt: currDate.toLocaleString(),
        recordingList: [],
      });
      await newStudent.save();
      return res.status(200).json("Added student");
    } catch (error) {
      console.error(error.message);
      res.status(500).json("Server error");
    }
  },
);
// @route POST /user/sendMail
// @desc sending the mail based on username and email
router.post("/sendMail", async (req, res) => {
  const { username, email } = req?.query;
  let data = await getEmail(username, email);
  if (data) {
    const passwordChange = await ChangePasswordTemplateForUser(username, email);
    await sendMail(passwordChange);
    res.status(200).send("Mail Sent Successfully");
  } else {
    res.status(400).send("Invalid request payload");
  }
});
// async function to check that requested username with that particular email is exists or not.
const getEmail = async (username, email) => {
  const data = await users.findOne({ username: username, email: email });
  return data;
};

// @route POST /user/resetPassword/:token
// @desc for reseting the password.

router.post("/resetPassword", validator, async (req, res) => {
  try {
    const { email, username } = req?.user;
    const getEmailId = await getEmail(username, email);
    if (getEmailId) {
      const password = req?.query;
      const sha384 = crypto.createHash("sha384");
      hashedPassword = sha384?.update(password?.password)?.digest("hex");
      const hashedPasswordUpadate = await updatePassword({
        username,
        password: hashedPassword,
        email,
      });
      if (hashedPasswordUpadate) {
        return res.status(200).send("Changed successfully");
      } else {
        return res.status(400).send("Invalid data");
      }
    }
    return res.status(200).send(hashedPasswordUpadate);
  } catch (error) {
    console.log(error);
  }
});

const updatePassword = async (body) => {
  const result = await users.findOneAndUpdate(
    { username: body.username, email: body.email },
    { password: body.password },
    { new: true },
  );
  return result;
};

// @route GET /user/mentorless/:keyword
// @desc for getting the mentorless students whose username matches keyword.
router.get("/mentorless", async (req, res) => {
  const keyword = req.query.keyword || ''; // get the keyword
  try {
    const db = await getDb();
    const users = db.collection("users");

    const userList = await users.find({
      role: 'student',// get student
      username: { $regex: keyword, $options: 'i' }, // case-insensitive match for username
      mentorshipUsername: "" // students who don't have mentors
    }).toArray();;
    res.json(userList.map(user => user.username)); // return a list of the usernames
  } catch (err) {
    res.status(500).json({ error: err.message }); // error
  }
});

// @route PUT /user/updateMentorship/:mentorship
// @desc if user is student, update its mentor username to the mentorship= query
// @desc if user is mentor, update its student username to the mentorship= query
// @access  Public with jwt Authentication
router.put(
  "/updateMentorship", 
  async (req, res, next) => {
    passport.authenticate("jwt", { session: false }, async (err, user, info) => {
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.user = user;
      next();
    })(req, res, next) // authenticate jwt
  }, 
  async (req, res) => {
    // get the student/mentor username
    const mentorship = req.query.mentorship;
    if (!mentorship) { // mentorship query is required
      return res.status(400).json({ message: "Missing mentorship username in query" });
    }

    try {
      // get db & collection
      const db = await getDb();
      const users = db.collection("users");
      // update user's mentor relationship
      const result = await users.updateOne(
        { username: req.user.username },
        { $set: { mentorshipUsername: mentorship } }
      );
      // update mentor relationshp both ways
      const result2 = await users.updateOne(
        { username: mentorship },
        { $set: { mentorshipUsername: req.user.username } }
      );

      // if mentorship field is not modified
      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: "User not found or already has that mentorshipUsername, username: " + req.user.username });
      }

      res.json({ message: "Mentorship updated successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message }); // error
    }
    }
);

// @route GET /user/getMentorship
// @desc if user is a student, responds with its mentor's object {username, firstName, lastName}
// @desc if user is a mentor, responds with its student's object {username, firstName, lastName}
// @access  Public with jwt Authentication
router.get("/getMentorship",
  async (req, res, next) => {
    passport.authenticate("jwt", { session: false }, async (err, user, info) => {
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.user = user;
      next();
    })(req, res, next) // authenticate jwt
  }, 
  async (req, res) => {
    try {
      const db = await getDb();
      const users = db.collection("users");
      const mentorshipUsername = req.user.mentorshipUsername;
      // error if it does not have mentorship established
      if (!mentorshipUsername) {
        return res.status(404).json({ message: "Mentorship not set" });
      }

      // now find the mentor/student by that username
      const mentorUser = await users.findOne(
        { username: mentorshipUsername },
        { projection: { _id: 0, username: 1, firstName: 1, lastName: 1 } }
      );
      if (!mentorUser) {
        return res.status(404).json({ message: "Mentorship user not found" });
      }
      res.json(mentorUser); // { username, firstName, lastName }
    } catch (error) {
      console.error("Error in getMentorship:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
