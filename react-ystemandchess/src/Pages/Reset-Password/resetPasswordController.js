const { sendResetPasswordEmail } = require('./resetPasswordService');
const User = require('../models/User');
const config = require('config');

const jwt = require('jsonwebtoken');

const resetPassword = async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    console.log('Missing username or email');
    return res.status(400).json({ message: 'Missing username or email' });
  }

  try {
    const user = await User.findOne({ username, email });
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate JWT token for resetting password
    const token = jwt.sign(
      { username: user.username, email: user.email },
      config.get('indexKey'),
      { expiresIn: '1h' }
    );

    // Create reset link with the generated token
    const resetLink = `http://localhost:3001/reset-password?token=${token}`;

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
