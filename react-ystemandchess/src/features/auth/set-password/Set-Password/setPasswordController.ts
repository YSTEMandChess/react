/**
 * Set Password Controller
 * 
 * Handles password update requests after password reset.
 * Validates reset tokens and updates passwords in the database.
 */

import { updatePassword } from "./setPasswordService";

/**
 * Handles password setting/updating requests
 * 
 * Validates the reset token and new password, then updates
 * the user's password in the database if the token is valid.
 * 
 * @param req - Express request with password and token in body
 * @param res - Express response
 * @returns JSON response with success or error message
 */
const setPassword = async (req: any, res: any) => {
  const { password, token } = req.body;

  // Validate required fields
  if (!password || !token) {
    return res
      .status(400)
      .json({ message: 'Password and token are required.' });
  }

  try {
    // Call service to update password with token validation
    const result = await updatePassword(password, token);

    // Return success or error based on service result
    if (result.success) {
      return res
        .status(200)
        .json({ message: 'Password successfully updated.' });
    } else {
      return res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error setting password:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  setPassword,
};
