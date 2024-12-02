const express = require('express');
const { signup } = require('./signupController');
const router = express.Router();

router.post('/user', signup);

module.exports = router;
