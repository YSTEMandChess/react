/**
 * Reset Password Router
 * 
 * Defines API routes for password reset requests.
 * Maps POST /sendMail to the reset password controller function.
 */

import express from "express"
const { resetPassword } = require('./resetPasswordController');
const router = express.Router();

// POST endpoint for initiating password reset
router.post('/sendMail', resetPassword);

module.exports = router;
