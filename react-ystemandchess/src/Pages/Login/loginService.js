const User = require('../models/User');

const verifyLogin = async (username, hashedPassword) => {
  try {
    const user = await User.findOne({
      username: username,
      password: hashedPassword,
    });

    return {
      success: !!user,
      user,
    };
  } catch (error) {
    console.error('Error verifying login:', error);
    throw error;
  }
};

module.exports = {
  verifyLogin,
};
