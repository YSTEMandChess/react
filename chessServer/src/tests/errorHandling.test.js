const analysisService = require("../services/AnalysisService");
const cache = require("../utils/cache");
const {
  startingFen,
  afterMoveFen,
  sampleMove,
  sampleUciHistory,
  emptyChatHistory
} = require("./fixtures/testData");
const {
  createMockFetchReject,
  createMockFetchTimeout
} = require("./helpers/mockHelpers");

// Set environment to use mock mode for OpenAI
process.env.LLM_MODE = "mock";
delete process.env.OPENAI_API_KEY;

// Mock fetch globally
global.fetch = jest.fn();

describe("Error Handling", () => {
  beforeEach(() => {
    cache.clear();
    jest.clearAllMocks();
    global.fetch.mockReset();
  });

  afterEach(() => {
    cache.clear();
  });

  describe("Stockfish fetch errors", () => {
    test("Stockfish fetch rejects → analyzeMoveWithHistory throws expected error", async () => {
      global.fetch = createMockFetchReject("Network error: ECONNREFUSED");

      await expect(
        analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        })
      ).rejects.toThrow();
    });

    test("Stockfish fetch timeout → throws timeout error", async () => {
      // Mock fetch to timeout after 7000ms (longer than the 6000ms timeout)
      global.fetch = createMockFetchTimeout(7000);

      await expect(
        analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        })
      ).rejects.toThrow(/timed out|timeout/i);
    }, 10000);

    test("Stockfish server returns 500 error → throws error", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: "Internal server error" })
        })
      );

      await expect(
        analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        })
      ).rejects.toThrow(/Stockfish server error/i);
    });

    test("Stockfish server returns 404 error → throws error", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ error: "Not found" })
        })
      );

      await expect(
        analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        })
      ).rejects.toThrow(/Stockfish server error/i);
    });
  });

  describe("OpenAI call errors", () => {
    test("when Stockfish succeeds but OpenAI fails, fallback explanation is returned (success true)", async () => {
      // Mock Stockfish to succeed
      const stockfishResponse = {
        fen: startingFen,
        cpuMove: "e7e5",
        classify: "Good",
        topBestMoves: [],
        nextBestMoves: [],
        cpuPV: "e7e5"
      };
      
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => stockfishResponse
        })
      );

      // Get OpenAI client and override to reject with OPENAI error
      const openai = require("../config/openai");
      const client = openai.getClient();
      
      // Override the create method to reject with OPENAI_INVALID_RESPONSE or OPENAI_API_ERROR
      const originalCreate = client.chat.completions.create;
      client.chat.completions.create = jest.fn(() =>
        Promise.reject(new Error("OPENAI_INVALID_RESPONSE"))
      );

      // When Stockfish succeeds but OpenAI fails, should return fallback (not throw)
      const result = await analysisService.analyzeMoveWithHistory({
        fen_before: startingFen,
        fen_after: afterMoveFen,
        move: sampleMove,
        uciHistory: sampleUciHistory,
        depth: 15,
        chatHistory: emptyChatHistory,
        multipv: 15
      });

      // Should return fallback response (success, not error)
      expect(result).toHaveProperty("explanation");
      expect(result).toHaveProperty("bestMove", "e7e5");
      expect(result).toHaveProperty("cached", false);

      // Verify fallback response structure
      const parsedExplanation = JSON.parse(result.explanation);
      expect(parsedExplanation).toHaveProperty("moveIndicator", "Good");
      expect(parsedExplanation).toHaveProperty("Analysis");
      expect(parsedExplanation).toHaveProperty("nextStepHint");
      expect(parsedExplanation.Analysis).toContain("trouble providing a detailed analysis");

      // Restore original
      client.chat.completions.create = originalCreate;
    });

    test("when Stockfish also fails, OpenAI error is thrown", async () => {
      // Mock Stockfish to fail (no classify field)
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            // Missing classify field means Stockfish didn't succeed properly
            fen: startingFen,
            cpuMove: null
          })
        })
      );

      // Get OpenAI client and override to reject
      const openai = require("../config/openai");
      const client = openai.getClient();
      
      // Override the create method to reject
      const originalCreate = client.chat.completions.create;
      client.chat.completions.create = jest.fn(() =>
        Promise.reject(new Error("OPENAI_API_ERROR"))
      );

      // When Stockfish also fails (no classify), should throw
      await expect(
        analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        })
      ).rejects.toThrow();

      // Restore original
      client.chat.completions.create = originalCreate;
    });
  });
});

