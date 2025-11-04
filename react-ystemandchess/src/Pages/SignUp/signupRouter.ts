/**
 * Sign Up Router
 * 
 * Defines API routes for user registration.
 * Maps POST /user to the signup controller function.
 */

const express = require('express');
const { signup } = require('./signupController');
const router = express.Router();

// POST endpoint for new user registration
router.post('/user', signup);

module.exports = router;
