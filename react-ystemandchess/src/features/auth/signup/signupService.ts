/**
 * Sign Up Service
 * 
 * Handles user registration and account creation.
 * Supports creating individual users and bulk student account creation for parents.
 */

const User = require("../models/User");
import * as crypto from "node:crypto";

/**
 * Type definition for user data structure
 */
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

/**
 * Creates a new user account in the database
 * 
 * @param userData - User information including username, password, name, email, role
 * @returns Saved user document
 */
const createUser = async (userData: UserDataType) => {
  const user = new User(userData);
  return await user.save();
};

/**
 * Creates multiple student accounts for a parent user
 * 
 * Used when parents sign up and want to create accounts for their children.
 * Automatically hashes passwords and links students to parent account.
 * 
 * @param students - Array of student data (username, password, first, last, email)
 * @param parentUsername - Username of the parent account
 * @param date - Account creation date
 * @returns Array of created student user documents
 */
const createStudents = async (
  students: any[],
  parentUsername: any,
  date: { toLocaleString: () => any }
) => {
  // Create a promise for each student account
  const studentPromises = students.map((student) => {
    // Hash the student's password using SHA-384
    const sha384 = crypto.createHash("sha384");
    const hashedPassword = sha384.update(student.password).digest("hex");

    // Create user with student role and link to parent
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

  // Wait for all student accounts to be created
  return await Promise.all(studentPromises);
};

module.exports = {
  createUser,
  createStudents,
};
