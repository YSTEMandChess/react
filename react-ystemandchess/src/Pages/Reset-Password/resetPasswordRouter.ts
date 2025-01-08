import express from "express"
const { resetPassword } = require('./resetPasswordController');
const router = express.Router();

router.post('/sendMail', resetPassword);

module.exports = router;
