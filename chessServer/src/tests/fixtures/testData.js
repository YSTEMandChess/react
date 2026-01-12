/**
 * Test data fixtures
 */

module.exports = {
  startingFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  afterMoveFen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  sampleMove: "e2e4",
  sampleUciHistory: "e2e4",
  
  emptyChatHistory: [],
  
  sampleChatHistory: [
    { role: "move", content: "White moved from e2 to e4" },
    { 
      role: "assistant", 
      content: "Good move!",
      explanation: {
        moveIndicator: "Good",
        Analysis: "Previous analysis",
        nextStepHint: "Previous hint"
      }
    },
    { role: "user", content: "Why is this move good?" },
    { role: "assistant", content: "Because it controls the center." }
  ],

  sampleQuestion: "What's the best move here?"
};

