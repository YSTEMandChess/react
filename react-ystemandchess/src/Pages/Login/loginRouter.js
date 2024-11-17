const express = require('express');
const { login } = require('./loginController');
const router = express.Router();

router.post('/auth/login', login);

module.exports = router;
