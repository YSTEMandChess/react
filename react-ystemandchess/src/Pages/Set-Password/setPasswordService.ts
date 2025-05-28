/**
 * Service function that handles updating a user's password in the database.
 * password - The new password to be set.
 * token - The token used to validate the password reset request.
 * return an object containing the success status and a message.
 */

const User = require('../models/User');

export const updatePassword = async (password: any, token: any) => {
  try {
    const user = await User.findOne({ resetToken: token });

    if (!user) {
      return { success: false, message: 'Invalid or expired token.' };
    }

    user.password = password;
    user.resetToken = null;
    await user.save();

    return { success: true, message: 'Password successfully updated.' };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, message: 'Failed to update password.' };
  }
};
