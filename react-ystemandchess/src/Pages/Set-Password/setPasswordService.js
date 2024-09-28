const User = require('../models/User');

const updatePassword = async (password, token) => {
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

module.exports = {
  updatePassword,
};
