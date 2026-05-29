function generateBotResponse({ currentState, userMessage, developmentPlan }) {
  return {
    botMessage: "This is a temporary stub response while the conversation engine is being implemented.",
    nextState: "ASK_SCHOOL"
  };
}

module.exports = { generateBotResponse };