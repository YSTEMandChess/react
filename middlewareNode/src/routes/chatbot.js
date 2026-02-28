const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { validator } = require('../utils/middleware');

router.post('/respond', validator, chatbotController.handleConversation);
module.exports = router;