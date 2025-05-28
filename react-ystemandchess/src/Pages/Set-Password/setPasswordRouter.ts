/**
 * Express router for handling password setting.
 */
import express from "express"
const { setPassword } = require('./setPasswordController');
const router = express.Router();

router.post('/set-password', setPassword);

module.exports = router;
