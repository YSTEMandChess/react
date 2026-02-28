const { ConversationState } = require('../models/conversationsModel');
const { generateBotResponse } = require('../utils/conversationEngine');
const logger = require('../utils/logger');
const { validateInput } = require('../utils/inputValidation');

exports.handleConversation = async (req, res) => {
  try{
    //get user input
    const userId = req.user.id; // or req.user._id depending on token
    const { userMessage, currentState } = req.body;

    //check user input
    if (!userId || !userMessage || !currentState) {
      return res.status(400).json({ error: 'userId, userMessage, and currentState are required' });
    }
    if (!validateInput(userMessage)) {
      return res.status(400).json({ error: 'Invalid user message' });
    }

    //find user state
    let conversationState = await ConversationState.findOne({ userId });

    //create new state if not exist
    if (!conversationState) {
        conversationState = new ConversationState({ userId, currentState });
    } else {
        // If currentState is provided in the request body, use it. Otherwise, use the one from the database.
        conversationState.currentState = currentState;
    }

    //log convo to history
    conversationState.conversationHistory.push({ speaker: 'student', message: userMessage });

    // Fetch student's development plan (placeholder - implement as needed)
    const studentDevelopmentPlan = { focusAreas: ['discipline', 'problem-solving'] }; // Mock data for now

    //generate bot response
    const { botMessage, nextState } = await generateBotResponse({
      currentState: conversationState.currentState,
      userMessage,
      developmentPlan: studentDevelopmentPlan,
      conversationHistory: conversationState.conversationHistory,
    });

    //add response to history
    conversationState.conversationHistory.push({ speaker: 'bot', message: botMessage });

    //update current state
    conversationState.currentState = nextState;

    //save state
    await conversationState.save();

    //log for analytics
    logger.info(`User ${userId} conversation handled. Current state: ${nextState}`);

    res.status(200).json({ botMessage, nextState });
  } catch (error) {
    logger.error('Error handling conversation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

