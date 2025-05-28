const { createUser, createStudents } = require('./signupService');
const User = require('../models/User');
import * as crypto from 'node:crypto';

const signup = async (req: any, res: any) => {
  const { username, password, first, last, email, role, students } = req.query;

  try {
    const sha384 = crypto.createHash('sha384');
    const hashedPassword = sha384.update(password).digest('hex');

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json('This username has been taken. Please choose another.');
    }

    const currDate = new Date();

    if (role === 'parent' && students) {
      const studentsArray = JSON.parse(students);

      if (studentsArray.length > 0) {
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

        await createStudents(studentsArray, username, currDate);
      }
    }

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
