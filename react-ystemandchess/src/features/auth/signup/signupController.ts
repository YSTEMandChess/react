/**
 * Sign Up Controller
 * 
 * Handles user registration requests including parent and student accounts.
 * Validates usernames, hashes passwords, and creates accounts in the database.
 */

const { createUser, createStudents } = require('./signupService');
const User = require('../models/User');
import * as crypto from 'node:crypto';

/**
 * Handles user signup requests
 * 
 * Creates new user accounts with proper password hashing and validation.
 * For parent accounts, also creates linked student accounts if provided.
 * 
 * @param req - Express request with user data in query
 * @param res - Express response
 * @returns JSON response with success or error message
 */
const signup = async (req: any, res: any) => {
  const { username, password, first, last, email, role, students } = req.query;

  try {
    // Hash password using SHA-384
    const sha384 = crypto.createHash('sha384');
    const hashedPassword = sha384.update(password).digest('hex');

    // Check if username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json('This username has been taken. Please choose another.');
    }

    const currDate = new Date();

    // Handle parent accounts with student children
    if (role === 'parent' && students) {
      const studentsArray = JSON.parse(students);

      if (studentsArray.length > 0) {
        // Validate all student usernames are available
        for (const student of studentsArray) {
          const studentExists = await User.findOne({
            username: student.username,
          });
          if (studentExists) {
            return res
              .status(400)
              .json('This username has been taken. Please choose another.');
          }
        }

        // Create all student accounts
        await createStudents(studentsArray, username, currDate);
      }
    }

    // Create the main user account
    const user = await createUser({
      username,
      password: hashedPassword,
      firstName: first,
      lastName: last,
      email,
      role,
      accountCreatedAt: currDate.toLocaleString(),
    });

    res.status(200).json('Added users');
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json('Server error');
  }
};

module.exports = {
  signup,
};
