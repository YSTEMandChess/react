const User = require('../models/User');
const crypto = require('crypto');

const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

const createStudents = async (students, parentUsername, date) => {
  const studentPromises = students.map((student) => {
    const sha384 = crypto.createHash('sha384');
    const hashedPassword = sha384.update(student.password).digest('hex');

    return createUser({
      username: student.username,
      password: hashedPassword,
      firstName: student.first,
      lastName: student.last,
      email: student.email,
      parentUsername,
      role: 'student',
      accountCreatedAt: date.toLocaleString(),
      timePlayed: 0,
    });
  });

  return await Promise.all(studentPromises);
};

module.exports = {
  createUser,
  createStudents,
};
