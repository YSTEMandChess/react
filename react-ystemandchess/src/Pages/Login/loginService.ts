/**
 * Login Service
 * 
 * Handles user authentication and login verification.
 * Validates username and password against the database.
 */

let User: any;

/**
 * Verifies user login credentials
 * 
 * Checks if a user exists with the provided username and hashed password.
 * 
 * @param username - User's username
 * @param hashedPassword - SHA-384 hashed password
 * @returns Object with success status and user data if found
 * @throws Error if database query fails
 */
export const verifyLogin = async (username: any, hashedPassword: any) => {
  try {
    // Search for user with matching username and password
    const user = await User.findOne({
      username: username,
      password: hashedPassword,
    });

    // Return success true if user found, false otherwise
    return {
      success: !!user,
      user,
    };
  } catch (error) {
    console.error('Error verifying login:', error);
    throw error;
  }
};
