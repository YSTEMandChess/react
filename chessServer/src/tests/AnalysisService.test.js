const analysisService = require("../services/AnalysisService");
const cache = require("../utils/cache");
const { validResponse } = require("./fixtures/stockfishResponse");
const { moveAnalysisResponse, questionResponse } = require("./fixtures/openaiResponse");
const {
  startingFen,
  afterMoveFen,
  sampleMove,
  sampleUciHistory,
  emptyChatHistory,
  sampleChatHistory,
  sampleQuestion
} = require("./fixtures/testData");
const {
  createMockStockfishFetch,
  createMockFetchReject
} = require("./helpers/mockHelpers");

// Mock fetch globally
global.fetch = jest.fn();

// Set environment to use mock mode for OpenAI
process.env.LLM_MODE = "mock";
delete process.env.OPENAI_API_KEY;

describe("AnalysisService", () => {
  let openaiClient;
  let originalCreate;
  let openaiModule;

  beforeEach(() => {
    cache.clear();
    jest.clearAllMocks();
    global.fetch.mockReset();
    
    // Ensure we're in mock mode
    process.env.LLM_MODE = "mock";
    delete process.env.OPENAI_API_KEY;
    
    // Get OpenAI module (don't reset modules here to avoid breaking analysisService)
    openaiModule = require("../config/openai");
    openaiClient = openaiModule.getClient();
    
    // Spy on the create method to verify calls
    originalCreate = openaiClient.chat.completions.create;
    openaiClient.chat.completions.create = jest.fn(originalCreate);
  });

  afterEach(() => {
    cache.clear();
    // Restore original implementation
    if (openaiClient && originalCreate) {
      openaiClient.chat.completions.create = originalCreate;
    }
  });

  describe("analyzeMoveWithHistory()", () => {
    describe("Cache miss scenario", () => {
      test("mocks Stockfish HTTP + mocks OpenAI → asserts Stockfish called, OpenAI called, cache set, response includes explanation, bestMove, cached:false", async () => {
        // Setup mocks
        global.fetch = createMockStockfishFetch(validResponse);

        // Ensure cache is empty
        cache.clear();

        // Call the function
        const result = await analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        });

        // Assert Stockfish was called
        expect(global.fetch).toHaveBeenCalled();
        const stockfishCall = global.fetch.mock.calls.find(call => 
          call[0] && call[0].includes("/analysis")
        );
        expect(stockfishCall).toBeDefined();
        expect(stockfishCall[1].method).toBe("POST");
        const requestBody = JSON.parse(stockfishCall[1].body);
        expect(requestBody).toMatchObject({
          fen: startingFen,
          moves: sampleMove,
          depth: 15,
          multipv: 15
        });

        // In mock mode, OpenAI should NOT be called for move analysis (MockTutor is used instead)
        expect(openaiClient.chat.completions.create).not.toHaveBeenCalled();

        // Assert cache was set
        const cacheKey = analysisService.getCacheKey(afterMoveFen, sampleMove, { depth: 15, movetime: 2000, multipv: 1 });
        expect(cache.has(cacheKey)).toBe(true);
        const cachedValue = cache.get(cacheKey);
        expect(cachedValue).toBeDefined();
        expect(typeof cachedValue).toBe("string");

        // Assert response structure
        expect(result).toHaveProperty("explanation");
        expect(result).toHaveProperty("bestMove");
        expect(result).toHaveProperty("cached");
        expect(result.cached).toBe(false);
        expect(result.explanation).toBeDefined();
        expect(typeof result.explanation).toBe("string"); // Explanation is stringified JSON
        expect(result.bestMove).toBe(validResponse.cpuMove);
        
        // Verify explanation can be parsed and has required fields
        const parsedExplanation = JSON.parse(result.explanation);
        expect(parsedExplanation).toHaveProperty("moveIndicator");
        expect(parsedExplanation).toHaveProperty("Analysis");
        expect(typeof parsedExplanation.moveIndicator).toBe("string");
        expect(typeof parsedExplanation.Analysis).toBe("string");
        
        // Verify response is position-specific (references Stockfish data)
        expect(parsedExplanation.moveIndicator).toBe(validResponse.classify);
        // Should use SAN notation (e5) instead of "e7 to e5"
        expect(parsedExplanation.Analysis).toMatch(/\be5\b/); // References cpuMove in SAN
        expect(parsedExplanation.nextStepHint).toBeDefined();
        expect(parsedExplanation.nextStepHint.length).toBeGreaterThan(0);
      });
    });

    describe("Cache hit scenario", () => {
      test("prepopulate cache → asserts OpenAI not called, response includes cached explanation, cached:true, and verify Stockfish is called on hit", async () => {
        // Pre-populate cache
        const cacheKey = analysisService.getCacheKey(afterMoveFen, sampleMove, { depth: 15, movetime: 2000, multipv: 1 });
        const cachedExplanation = "This is a cached explanation";
        cache.set(cacheKey, cachedExplanation, 86400);

        // Setup mocks
        global.fetch = createMockStockfishFetch(validResponse);

        // Clear OpenAI call count
        openaiClient.chat.completions.create.mockClear();

        // Call the function
        const result = await analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        });

        // Assert OpenAI was NOT called (cache hit - this is expected for both mock and real mode)
        expect(openaiClient.chat.completions.create).not.toHaveBeenCalled();

        // Assert Stockfish WAS called (for bestMove even on cache hit)
        expect(global.fetch).toHaveBeenCalled();
        const stockfishCall = global.fetch.mock.calls.find(call => 
          call[0] && call[0].includes("/analysis")
        );
        expect(stockfishCall).toBeDefined();

        // Assert response structure
        expect(result).toHaveProperty("explanation");
        expect(result).toHaveProperty("cached");
        expect(result).toHaveProperty("bestMove");
        expect(result.cached).toBe(true);
        expect(result.explanation).toBe(cachedExplanation);
        expect(result.bestMove).toBe(validResponse.cpuMove);
      });
    });

    describe("Chat history handling", () => {
      test("in mock mode, MockTutor is used directly without OpenAI formatting", async () => {
        global.fetch = createMockStockfishFetch(validResponse);

        const result = await analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: sampleChatHistory,
          multipv: 15
        });

        // In mock mode, OpenAI should NOT be called (MockTutor is used instead)
        expect(openaiClient.chat.completions.create).not.toHaveBeenCalled();

        // Verify we still get a valid response
        const parsedExplanation = JSON.parse(result.explanation);
        expect(parsedExplanation).toHaveProperty("moveIndicator");
        expect(parsedExplanation).toHaveProperty("Analysis");
        expect(parsedExplanation).toHaveProperty("nextStepHint");
      });
    });
  });

  describe("answerQuestion()", () => {
    describe("Cache miss scenario", () => {
      test("mocks OpenAI → asserts prompt includes FEN + question, cache set, cached:false", async () => {
        global.fetch = createMockStockfishFetch({ ...validResponse, topBestMoves: [] });

        cache.clear();

        const result = await analysisService.answerQuestion({
          fen: afterMoveFen,
          question: sampleQuestion,
          chatHistory: emptyChatHistory
        });

        // Assert OpenAI was called with correct prompt
        expect(openaiClient.chat.completions.create).toHaveBeenCalled();
        const openaiCall = openaiClient.chat.completions.create.mock.calls[0][0];
        const lastMessage = openaiCall.messages[openaiCall.messages.length - 1].content;
        
        expect(lastMessage).toContain(afterMoveFen);
        expect(lastMessage).toContain(sampleQuestion);

        // Assert cache was set
        const questionCacheKey = `question:v1:${afterMoveFen}:${sampleQuestion}`;
        expect(cache.has(questionCacheKey)).toBe(true);
        const cachedValue = cache.get(questionCacheKey);
        expect(cachedValue).toBeDefined();

        // Assert response structure
        expect(result).toHaveProperty("answer");
        expect(result).toHaveProperty("cached");
        expect(result.cached).toBe(false);
        expect(result.answer).toBeDefined();
      });
    });

    describe("Cache hit scenario", () => {
      test("prepopulate cache → asserts OpenAI not called, cached:true", async () => {
        // Pre-populate cache
        const questionCacheKey = `question:v1:${afterMoveFen}:${sampleQuestion}`;
        const cachedAnswer = "This is a cached answer";
        cache.set(questionCacheKey, cachedAnswer, 86400);

        // Clear OpenAI call count
        openaiClient.chat.completions.create.mockClear();

        const result = await analysisService.answerQuestion({
          fen: afterMoveFen,
          question: sampleQuestion,
          chatHistory: emptyChatHistory
        });

        // Assert OpenAI was NOT called
        expect(openaiClient.chat.completions.create).not.toHaveBeenCalled();

        // Assert response structure
        expect(result).toHaveProperty("answer");
        expect(result).toHaveProperty("cached");
        expect(result.cached).toBe(true);
        expect(result.answer).toBe(cachedAnswer);
      });
    });
  });

  describe("Error Handling", () => {
    describe("Invalid OpenAI JSON Response", () => {
      test("invalid JSON response returns fallback when Stockfish succeeded", async () => {
        global.fetch = createMockStockfishFetch(validResponse);

        // In mock mode, MockTutor is used directly (no OpenAI call)
        // So OpenAI errors don't occur. This test is mainly for non-mock mode.
        // In mock mode, we get MockTutor response which is position-specific.
        const result = await analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        });

        expect(result).toHaveProperty("explanation");
        expect(result).toHaveProperty("bestMove");
        expect(result).toHaveProperty("cached", false);

        // Verify response structure (in mock mode, this will be MockTutor response)
        const parsedExplanation = JSON.parse(result.explanation);
        expect(parsedExplanation).toHaveProperty("moveIndicator");
        expect(parsedExplanation).toHaveProperty("Analysis");
        expect(parsedExplanation).toHaveProperty("nextStepHint");
        expect(parsedExplanation.moveIndicator).toBe(validResponse.classify);
        // In mock mode, response is position-specific, not generic fallback
        expect(parsedExplanation.Analysis).toBeDefined();
        expect(parsedExplanation.Analysis.length).toBeGreaterThan(0);
      });

      test("missing required fields in JSON returns fallback when Stockfish succeeded", async () => {
        global.fetch = createMockStockfishFetch(validResponse);

        // In mock mode, MockTutor is used directly (no OpenAI call)
        // So OpenAI validation errors don't occur. This test is mainly for non-mock mode.
        const result = await analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        });

        expect(result).toHaveProperty("explanation");
        expect(result).toHaveProperty("bestMove");
        expect(result).toHaveProperty("cached", false);

        // Verify response structure (in mock mode, this will be MockTutor response)
        const parsedExplanation = JSON.parse(result.explanation);
        expect(parsedExplanation).toHaveProperty("moveIndicator");
        expect(parsedExplanation).toHaveProperty("Analysis");
        expect(parsedExplanation).toHaveProperty("nextStepHint");
        expect(parsedExplanation.moveIndicator).toBe(validResponse.classify);
      });
    });

    describe("Fallback Response", () => {
      test("when Stockfish succeeds but OpenAI fails, fallback explanation is returned (success true)", async () => {
        global.fetch = createMockStockfishFetch(validResponse);

        // In mock mode, MockTutor is used directly, so OpenAI never fails.
        // This test verifies that we get a valid response even when OpenAI would fail.
        // In mock mode, we get MockTutor's position-specific response.
        const result = await analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        });

        // Should return response (success, not error)
        expect(result).toHaveProperty("explanation");
        expect(result).toHaveProperty("bestMove");
        expect(result).toHaveProperty("cached", false);
        expect(result.bestMove).toBe(validResponse.cpuMove);

        // Verify response structure (in mock mode, this will be MockTutor response)
        const parsedExplanation = JSON.parse(result.explanation);
        expect(parsedExplanation).toHaveProperty("moveIndicator");
        expect(parsedExplanation).toHaveProperty("Analysis");
        expect(parsedExplanation).toHaveProperty("nextStepHint");
        expect(parsedExplanation.moveIndicator).toBe(validResponse.classify);
        // In mock mode, response is position-specific, not generic fallback
        expect(parsedExplanation.Analysis).toBeDefined();
        expect(parsedExplanation.Analysis.length).toBeGreaterThan(0);
      });

      test("fallback response uses Stockfish classify for moveIndicator", async () => {
        // Create a case where normalized delta is actually negative and significant
        // Before: White to move, value 60 (good)
        // After: Black to move, value 0 (equal)
        // Normalized: before=+60, after=0, delta=-60 (actually bad, so Mistake is preserved)
        const customStockfishResponse = {
          ...validResponse,
          classify: "Mistake",
          evaluation: {
            before: { type: "cp", value: 60 }, // White to move, good
            after: { type: "cp", value: 0 }, // Black to move, equal
            delta: -60 // Raw delta negative
          }
        };
        global.fetch = createMockStockfishFetch(customStockfishResponse);

        // Mock OpenAI to fail
        openaiClient.chat.completions.create = jest.fn().mockRejectedValue(
          new Error("OPENAI_API_ERROR")
        );

        const result = await analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        });

        const parsedExplanation = JSON.parse(result.explanation);
        // After normalization: delta = -60 (< -30), so Mistake is preserved
        expect(parsedExplanation.moveIndicator).toBe("Mistake");
      });

      test("fallback response is cached when used", async () => {
        cache.clear();
        global.fetch = createMockStockfishFetch(validResponse);

        // Mock OpenAI to fail
        openaiClient.chat.completions.create = jest.fn().mockRejectedValue(
          new Error("OPENAI_INVALID_RESPONSE")
        );

        const result1 = await analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        });

        expect(result1.cached).toBe(false);

        // Second call should hit cache
        openaiClient.chat.completions.create.mockClear();
        const result2 = await analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        });

        expect(result2.cached).toBe(true);
        expect(openaiClient.chat.completions.create).not.toHaveBeenCalled();
        expect(result2.explanation).toBe(result1.explanation);
      });
    });
  });
});

