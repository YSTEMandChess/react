const { verifyLogin } = require('./loginService');
const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('config');

const login = async (req, res) => {
  const { username, password } = req.query;

  if (!username || !password) {
    console.log('Missing username or password');
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }

  try {
    const sha384 = crypto.createHash('sha384');
    const hashedPassword = sha384.update(password).digest('hex');

    const user = await User.findOne({ username, password: hashedPassword });
    if (!user) {
      console.log('Invalid credentials');
      return res.status(401).send('The username or password is incorrect.');
    }

    const token = jwt.sign(
      {
        username: user.username,
        role: user.role,
      },
      config.get('indexKey'),
      { expiresIn: '1d' }
    );

    console.log(`User ${username} logged in successfully`);
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
};
