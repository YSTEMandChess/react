const User = require("../models/User");
import * as crypto from "node:crypto";

type UserDataType = {
  username: any;
  password: any;
  firstName: any;
  lastName: any;
  email: any;
  parentUsername: any;
  role: string;
  accountCreatedAt: any;
  timePlayed: number;
};

const createUser = async (userData: UserDataType) => {
  const user = new User(userData);
  return await user.save();
};

const createStudents = async (
  students: any[],
  parentUsername: any,
  date: { toLocaleString: () => any }
) => {
  const studentPromises = students.map((student) => {
    const sha384 = crypto.createHash("sha384");
    const hashedPassword = sha384.update(student.password).digest("hex");

    return createUser({
      username: student.username,
      password: hashedPassword,
      firstName: student.first,
      lastName: student.last,
      email: student.email,
      parentUsername,
      role: "student",
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
