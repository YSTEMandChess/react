
exports.generateBotResponse = jest.fn(({ currentState, userMessage, developmentPlan, conversationHistory }) => {

  console.log('Mocked Conversation Engine received:', { currentState, userMessage, developmentPlan, conversationHistory });
  return {
    botMessage: `Mocked response for: "${userMessage}" in state "${currentState}"`,
    nextState: 'MOCKED_NEXT_STATE' // A predictable next state
  };
});