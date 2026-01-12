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

        // Assert OpenAI was called
        expect(openaiClient.chat.completions.create).toHaveBeenCalled();
        const openaiCall = openaiClient.chat.completions.create.mock.calls[0][0];
        expect(openaiCall.messages).toBeDefined();
        expect(openaiCall.messages.length).toBeGreaterThan(0);
        expect(openaiCall.messages[openaiCall.messages.length - 1].role).toBe("user");

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

        // Assert OpenAI was NOT called (cache hit)
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
      test("chat history is correctly formatted for OpenAI messages array", async () => {
        global.fetch = createMockStockfishFetch(validResponse);

        await analysisService.analyzeMoveWithHistory({
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: sampleChatHistory,
          multipv: 15
        });

        const openaiCall = openaiClient.chat.completions.create.mock.calls[0][0];
        const messages = openaiCall.messages;

        // Check system message
        expect(messages[0].role).toBe("system");

        // Check chat history conversion
        // move -> user, assistant -> assistant, user -> user
        let historyIndex = 1;
        for (const msg of sampleChatHistory) {
          if (msg.role === "move") {
            expect(messages[historyIndex].role).toBe("user");
          } else if (msg.role === "assistant" || msg.role === "user") {
            expect(messages[historyIndex].role).toBe(msg.role);
          }
          historyIndex++;
        }

        // Last message should be the current move prompt
        expect(messages[messages.length - 1].role).toBe("user");
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

        // Mock OpenAI to return invalid JSON
        openaiClient.chat.completions.create = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: "This is not valid JSON { incomplete"
            }
          }]
        });

        // Should return fallback response (not throw) when Stockfish succeeded
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

        // Verify fallback response structure
        const parsedExplanation = JSON.parse(result.explanation);
        expect(parsedExplanation).toHaveProperty("moveIndicator");
        expect(parsedExplanation).toHaveProperty("Analysis");
        expect(parsedExplanation).toHaveProperty("nextStepHint");
        expect(parsedExplanation.moveIndicator).toBe(validResponse.classify);
        expect(parsedExplanation.Analysis).toContain("trouble providing a detailed analysis");
      });

      test("missing required fields in JSON returns fallback when Stockfish succeeded", async () => {
        global.fetch = createMockStockfishFetch(validResponse);

        // Mock OpenAI to return JSON missing required fields
        openaiClient.chat.completions.create = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                // Missing moveIndicator and Analysis
                nextStepHint: "Some hint"
              })
            }
          }]
        });

        // Should return fallback response (not throw) when Stockfish succeeded
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

        // Verify fallback response structure
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

        // Mock OpenAI to fail
        openaiClient.chat.completions.create = jest.fn().mockRejectedValue(
          new Error("OPENAI_INVALID_RESPONSE")
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

        // Should return fallback response (success, not error)
        expect(result).toHaveProperty("explanation");
        expect(result).toHaveProperty("bestMove");
        expect(result).toHaveProperty("cached", false);
        expect(result.bestMove).toBe(validResponse.cpuMove);

        // Verify fallback response structure
        const parsedExplanation = JSON.parse(result.explanation);
        expect(parsedExplanation).toHaveProperty("moveIndicator");
        expect(parsedExplanation).toHaveProperty("Analysis");
        expect(parsedExplanation).toHaveProperty("nextStepHint");
        expect(parsedExplanation.moveIndicator).toBe(validResponse.classify);
        expect(parsedExplanation.Analysis).toContain("trouble providing a detailed analysis");
      });

      test("fallback response uses Stockfish classify for moveIndicator", async () => {
        const customStockfishResponse = {
          ...validResponse,
          classify: "Mistake"
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

