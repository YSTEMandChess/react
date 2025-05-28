const express = require('express');
const passport = require('passport');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const users = require('../models/users');
const { validator } = require('../utils/middleware');

// @route   GET /user/children
// @desc    GET the parent user's children username and their timePlayed fields
// @access  Public with jwt Authentication
router.get('/children', passport.authenticate('jwt'), async (req, res) => {
  try {
    const { role, username } = req.user;
    if (role !== 'parent') {
      res
        .status(400)
        .json('You must have a parent account to access your children');
    } else {
      //Find all children for the parent user and retrieve only the username and timePlayed field
      const childrenArray = await users
        .find({ parentUsername: username })
        .select(['timePlayed', 'username']);
      res.status(200).json(childrenArray);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json('Server error');
  }
});

// @route   POST /user/
// @desc    POST Signup the requested user with the provided credentials
// @access  Public
router.post(
  '/',
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
      const sha384 = crypto.createHash('sha384');
      hashedPassword = sha384.update(password).digest('hex');

      //Error checking to see if a user with the same username exists
      const user = await users.findOne({ username });
      if (user) {
        return res
          .status(400)
          .json('This username has been taken. Please choose another.');
      }

      //Set the account created date for the new user
      const currDate = new Date();

      //Switch statement for functionality depending on role
      if (role === 'parent') {
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
                .json('This username has been taken. Please choose another.');
            }
          }

          //Insert the students into the database one at a time
          await Promise.all(
            studentsArray.map(async (student) => {
              const sha384 = crypto.createHash('sha384');
              const newStudent = new users({
                username: student.username,
                password: sha384.update(student.password).digest('hex'),
                firstName: student.first,
                lastName: student.last,
                email: student.email,
                parentUsername: username,
                role: 'student',
                accountCreatedAt: currDate.toLocaleString(),
                timePlayed: 0,
              });
              await newStudent.save();
            })
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

      res.status(200).json('Added users');
    } catch (error) {
      console.error(error.message);
      res.status(500).json('Server error');
    }
  }
);

// @route   POST /user/children
// @desc    POST Signup the student with the parent account
// @access  Public with jwt Authentication
router.post(
  '/children',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password is required').not().isEmpty(),
    check('first', 'First name is required').not().isEmpty(),
    check('email', 'email is required').not().isEmpty(),
    check('last', 'Last name is required').not().isEmpty(),
  ],
  passport.authenticate('jwt'),
  async (req, res) => {
    //Field validations for checks
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, first, last, email } = req.query;

    try {
      const sha384 = crypto.createHash('sha384');
      hashedPassword = sha384.update(password).digest('hex');

      const user = await users.findOne({ username });
      if (user) {
        return res
          .status(400)
          .json('This username has been taken. Please choose another.');
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
        role: 'student',
        accountCreatedAt: currDate.toLocaleString(),
        recordingList: [],
      });
      await newStudent.save();
      return res.status(200).json('Added student');
    } catch (error) {
      console.error(error.message);
      res.status(500).json('Server error');
    }
  }
);
// @route POST /user/sendMail
// @desc sending the mail based on username and email
router.post('/sendMail', async (req, res) => {
  try {
    const { username, email } = req.query;
    console.log('Reset request for:', { username, email });

    if (!username || !email) {
      return res
        .status(400)
        .json({ message: 'Username and email are required' });
    }

    const user = await users.findOne({ username, email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or email' });
    }

    const token = jwt.sign(
      { username: user.username, email: user.email },
      config.get('indexKey'),
      { expiresIn: '1h' }
    );

    console.log('Generated reset token for:', username);
    return res.status(200).json({
      message: 'Reset link generated',
      token: token,
    });
  } catch (error) {
    console.error('Error in sendMail:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// async function to check that requested username with that particular email is exists or not.
const getEmail = async (username, email) => {
  const data = await users.findOne({ username: username, email: email });
  return data;
};

// Hashing function for password
const hashPassword = (password) => {
  const sha384 = crypto.createHash('sha384');
  return sha384.update(password).digest('hex');
};

// @route POST /user/resetPassword/:token
// @desc for reseting the password.

router.post('/resetPassword', validator, async (req, res) => {
  try {
    const { email, username } = req?.user;
    const getEmailId = await getEmail(username, email);
    if (getEmailId) {
      const password = req?.query;
      const sha384 = crypto.createHash('sha384');
      hashedPassword = sha384?.update(password?.password)?.digest('hex');
      const hashedPasswordUpadate = await updatePassword({
        username,
        password: hashedPassword,
        email,
      });
      if (hashedPasswordUpadate) {
        return res.status(200).send('Changed successfully');
      } else {
        return res.status(400).send('Invalid data');
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
    { new: true }
  );
  return result;
};

// @route   POST /user/setPassword
// @desc    Allows a user to set a new password after verification
router.post('/setPassword', validator, async (req, res) => {
  try {
    const { password } = req.body;
    const { username } = req.user;

    console.log('Attempting password update for user:', username);

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const sha384 = crypto.createHash('sha384');
    const hashedPassword = sha384.update(password).digest('hex');

    console.log('User to update:', username);
    console.log('New hashed password:', hashedPassword);

    const result = await users.findOneAndUpdate(
      { username: username },
      {
        $set: {
          password: hashedPassword,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    console.log('Update result:', result);

    if (!result) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the update
    const updatedUser = await users.findOne({ username: username });
    console.log('Verification - Updated user:', {
      username: updatedUser.username,
      passwordChanged: updatedUser.password === hashedPassword,
    });

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in setPassword:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
