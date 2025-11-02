/**
 * Login Router
 * 
 * Defines API routes for user authentication.
 * Maps POST /auth/login to the login controller function.
 */

import express from 'express';
const { login } = require('./loginController');
const router = express.Router();

// POST endpoint for user login
router.post('/auth/login', login);

module.exports = router;
