const { sendResetPasswordEmail } = require('./resetPasswordService');
const User = require('../models/User'); // Adjust the path as necessary

const resetPassword = async (req, res) => {
  // Log the request body to ensure it is being received correctly
  console.log('Received request body:', req.body);

  const { username, email } = req.body; // Ensure you are reading req.body for POST requests

  if (!username || !email) {
    console.log('Missing username or email');
    return res.status(400).json({ message: 'Missing username or email' });
  }

  try {
    // Verify user details
    const user = await User.findOne({ username, email });
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset link (example link, replace with actual link generation logic)
    const resetLink = `${process.env.CHESS_CLIENT_URL}/reset-password?token=exampleToken`;

    // Send reset password email
    await sendResetPasswordEmail(email, resetLink);
    console.log('Sending response: { message: "Mail Sent" }');
    return res.status(200).json({ message: 'Mail Sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Error sending email' });
  }
};

module.exports = {
  resetPassword,
};