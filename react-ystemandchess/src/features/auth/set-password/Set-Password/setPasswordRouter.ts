/**
 * Set Password Router
 * 
 * Defines API routes for setting/updating passwords after reset.
 * Maps POST /set-password to the set password controller function.
 */

import express from "express"
const { setPassword } = require('./setPasswordController');
const router = express.Router();

// POST endpoint for setting new password
router.post('/set-password', setPassword);

module.exports = router;
