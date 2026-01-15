/**
 * Reset Password Controller
 * 
 * Handles password reset requests by generating secure reset tokens
 * and sending reset links to users via email.
 */

const { sendResetPasswordEmail } = require('./resetPasswordService');
let User: any;
const config = require('config');
const jwt = require('jsonwebtoken');

/**
 * Handles password reset requests
 * 
 * Validates user credentials, generates a secure JWT reset token,
 * and creates a reset link. In development, returns the link directly
 * instead of sending an email.
 * 
 * @param req - Express request with username and email in body
 * @param res - Express response
 * @returns JSON response with reset link or error message
 */
const resetPassword = async (req: any, res: any) => {
  const { username, email } = req.body;

  // Validate required fields
  if (!username || !email) {
    console.log('Missing username or email');
    return res.status(400).json({ message: 'Missing username or email' });
  }

  try {
    // Find user by username and email
    const user = await User.findOne({ username, email });
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate secure JWT token valid for 1 hour
    const token = jwt.sign(
      { username: user.username, email: user.email },
      config.get('indexKey'),
      { expiresIn: '1h' }
    );

    // Create password reset link with embedded token
    const resetLink = `http://localhost:3001/reset-password?token=${token}`;

    // TODO: In production, call sendResetPasswordEmail(user.email, resetLink)
    // Currently bypassing email for development/testing
    console.log('Reset link:', resetLink);
    return res.status(200).json({ message: 'Mail bypassed', resetLink });
  } catch (error) {
    console.error('Error generating reset link:', error);
    return res.status(500).json({ message: 'Error generating reset link' });
  }
};

module.exports = {
  resetPassword,
};
