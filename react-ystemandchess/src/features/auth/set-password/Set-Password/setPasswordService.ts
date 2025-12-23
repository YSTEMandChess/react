/**
 * Set Password Service
 * 
 * Handles updating user passwords after password reset requests.
 * Validates reset tokens and saves new passwords to the database.
 */

const User = require('../models/User');

/**
 * Updates a user's password using a reset token
 * 
 * Validates the reset token, updates the password if valid,
 * and clears the reset token to prevent reuse.
 * 
 * @param password - The new password to be set (should be pre-hashed)
 * @param token - The reset token from the email link
 * @returns Object with success status and message
 */
export const updatePassword = async (password: any, token: any) => {
  try {
    // Find user by reset token
    const user = await User.findOne({ resetToken: token });

    // Validate token exists
    if (!user) {
      return { success: false, message: 'Invalid or expired token.' };
    }

    // Update password and clear reset token
    user.password = password;
    user.resetToken = null;
    await user.save();

    return { success: true, message: 'Password successfully updated.' };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, message: 'Failed to update password.' };
  }
};
