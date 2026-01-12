const request = require("supertest");
const express = require("express");
const cors = require("cors");
const { validResponse } = require("./fixtures/stockfishResponse");
const { moveAnalysisResponse, questionResponse } = require("./fixtures/openaiResponse");
const {
  startingFen,
  afterMoveFen,
  sampleMove,
  sampleUciHistory,
  emptyChatHistory,
  sampleQuestion
} = require("./fixtures/testData");

// Mock fetch for Stockfish
global.fetch = jest.fn();

// Set environment to use mock mode for OpenAI
process.env.LLM_MODE = "mock";
delete process.env.OPENAI_API_KEY;

// Mock the AnalysisService
jest.mock("../services/AnalysisService");
const analysisService = require("../services/AnalysisService");

describe("POST /api/analyze", () => {
  let app;

  beforeAll(() => {
    // Create a test app with the same route structure
    app = express();
    app.use(express.json());
    app.use(cors({ origin: "*" }));

    // Define the route handler (same as in index.js)
    function withTimeout(promise, ms, label) {
      let id;
      const timeout = new Promise((_, reject) => {
        id = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      });
      return Promise.race([promise, timeout]).finally(() => clearTimeout(id));
    }

    app.post("/api/analyze", async (req, res) => {
      const TOTAL_MS = 15000;

      try {
        const { type, ...data } = req.body;

        if (type === "move") {
          const result = await withTimeout(
            analysisService.analyzeMoveWithHistory({
              fen_before: data.fen_before,
              fen_after: data.fen_after,
              move: data.move,
              uciHistory: data.uciHistory,
              depth: data.depth || 15,
              chatHistory: data.chatHistory || [],
              multipv: data.multipv || 15,
            }),
            TOTAL_MS,
            "Move analysis"
          );

          return res.json({
            success: true,
            type: "move",
            explanation: result.explanation,
            cached: result.cached,
            bestMove: result.bestMove || null,
          });
        }

        if (type === "question") {
          const result = await withTimeout(
            analysisService.answerQuestion({
              fen: data.fen,
              question: data.question,
              chatHistory: data.chatHistory || [],
            }),
            TOTAL_MS,
            "Question analysis"
          );

          return res.json({
            success: true,
            type: "question",
            answer: result.answer,
            cached: result.cached,
          });
        }

        return res.status(400).json({
          success: false,
          error: `Unknown request type: ${type}. Expected 'move' or 'question'`,
        });
      } catch (error) {
        const msg = error?.message || "Internal server error";
        const msgLower = msg.toLowerCase();
        
        // Classify error types (matching index.js implementation)
        let errorCode = "INTERNAL_ERROR";
        let retryable = false;
        let statusCode = 500;

        if (msg === "OPENAI_INVALID_RESPONSE") {
          errorCode = "OPENAI_INVALID_RESPONSE";
          retryable = true;
          statusCode = 500;
        } else if (msgLower.includes("openai") && msgLower.includes("timeout")) {
          errorCode = "OPENAI_TIMEOUT";
          retryable = true;
          statusCode = 504;
        } else if (msgLower.includes("rate limit") || msgLower.includes("rate_limit")) {
          errorCode = "OPENAI_RATE_LIMIT";
          retryable = true;
          statusCode = 429;
        } else if (msgLower.includes("openai")) {
          errorCode = "OPENAI_API_ERROR";
          retryable = true;
          statusCode = 500;
        } else if (msgLower.includes("stockfish") && msgLower.includes("timeout")) {
          errorCode = "STOCKFISH_TIMEOUT";
          retryable = true;
          statusCode = 504;
        } else if (msgLower.includes("stockfish") && (msgLower.includes("network") || msgLower.includes("fetch"))) {
          errorCode = "STOCKFISH_NETWORK_ERROR";
          retryable = true;
          statusCode = 502;
        } else if (msgLower.includes("stockfish") && msgLower.includes("parse")) {
          errorCode = "STOCKFISH_PARSE_ERROR";
          retryable = false;
          statusCode = 500;
        } else if (msgLower.includes("validation")) {
          errorCode = "VALIDATION_ERROR";
          retryable = false;
          statusCode = 400;
        } else if (msgLower.includes("network") || msgLower.includes("fetch") || msgLower.includes("econnrefused")) {
          errorCode = "NETWORK_ERROR";
          retryable = true;
          statusCode = 502;
        } else if (msgLower.includes("timed out")) {
          errorCode = "TIMEOUT";
          retryable = true;
          statusCode = 504;
        }

        return res.status(statusCode).json({
          success: false,
          error: msg,
          errorCode,
          retryable,
        });
      }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockReset();
    // Reset mock implementations to ensure clean state
    if (analysisService.analyzeMoveWithHistory?.mockReset) {
      analysisService.analyzeMoveWithHistory.mockReset();
    }
    if (analysisService.answerQuestion?.mockReset) {
      analysisService.answerQuestion.mockReset();
    }
  });

  describe("Move Analysis", () => {
    test("valid move analysis request returns success with explanation/cached/bestMove", async () => {
      // Mock AnalysisService response
      analysisService.analyzeMoveWithHistory = jest.fn().mockResolvedValue({
        explanation: moveAnalysisResponse,
        cached: false,
        bestMove: validResponse.cpuMove
      });

      const response = await request(app)
        .post("/api/analyze")
        .send({
          type: "move",
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory,
          depth: 15,
          chatHistory: emptyChatHistory,
          multipv: 15
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("type", "move");
      expect(response.body).toHaveProperty("explanation");
      expect(response.body).toHaveProperty("cached", false);
      expect(response.body).toHaveProperty("bestMove", validResponse.cpuMove);
      
      expect(analysisService.analyzeMoveWithHistory).toHaveBeenCalledWith({
        fen_before: startingFen,
        fen_after: afterMoveFen,
        move: sampleMove,
        uciHistory: sampleUciHistory,
        depth: 15,
        chatHistory: emptyChatHistory,
        multipv: 15
      });
    });

    test("cached move analysis returns cached:true", async () => {
      analysisService.analyzeMoveWithHistory = jest.fn().mockResolvedValue({
        explanation: moveAnalysisResponse,
        cached: true,
        bestMove: validResponse.cpuMove
      });

      const response = await request(app)
        .post("/api/analyze")
        .send({
          type: "move",
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove,
          uciHistory: sampleUciHistory
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cached).toBe(true);
    });
  });

  describe("Question Analysis", () => {
    test("valid question request returns success with answer and cached flag", async () => {
      analysisService.answerQuestion = jest.fn().mockResolvedValue({
        answer: questionResponse,
        cached: false
      });

      const response = await request(app)
        .post("/api/analyze")
        .send({
          type: "question",
          fen: afterMoveFen,
          question: sampleQuestion,
          chatHistory: emptyChatHistory
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("type", "question");
      expect(response.body).toHaveProperty("answer", questionResponse);
      expect(response.body).toHaveProperty("cached", false);

      expect(analysisService.answerQuestion).toHaveBeenCalledWith({
        fen: afterMoveFen,
        question: sampleQuestion,
        chatHistory: emptyChatHistory
      });
    });
  });

  describe("Error Responses", () => {
    test("invalid request type returns 400 with success:false", async () => {
      const response = await request(app)
        .post("/api/analyze")
        .send({
          type: "invalid-type"
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Unknown request type");
    });

    test("missing parameters returns appropriate error", async () => {
      // When required parameters are missing, the service will throw an error
      // The endpoint catches it and returns 500 (not 400, since there's no input validation)
      analysisService.analyzeMoveWithHistory = jest.fn().mockRejectedValue(
        new Error("Missing required parameters: fen_before, fen_after, move")
      );

      const response = await request(app)
        .post("/api/analyze")
        .send({
          type: "move"
          // Missing required fields
        })
        .expect(500);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Missing required parameters");
    });

    test("timeout returns 504 error with TIMEOUT errorCode and retryable:true", async () => {
      // Mock service to throw a timeout error (as if withTimeout caught it)
      analysisService.analyzeMoveWithHistory = jest.fn().mockRejectedValue(
        new Error("Move analysis timed out after 15000ms")
      );

      const response = await request(app)
        .post("/api/analyze")
        .send({
          type: "move",
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove
        })
        .expect(504);

      // Timeout should return 504 with normalized error format
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("errorCode", "TIMEOUT");
      expect(response.body).toHaveProperty("retryable", true);
      expect(response.body.error).toContain("timed out");
    });

    test("OPENAI_INVALID_RESPONSE returns 500 with errorCode and retryable:true", async () => {
      analysisService.analyzeMoveWithHistory = jest.fn().mockRejectedValue(
        new Error("OPENAI_INVALID_RESPONSE")
      );

      const response = await request(app)
        .post("/api/analyze")
        .send({
          type: "move",
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove
        })
        .expect(500);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("errorCode", "OPENAI_INVALID_RESPONSE");
      expect(response.body).toHaveProperty("retryable", true);
      expect(response.body).toHaveProperty("error", "OPENAI_INVALID_RESPONSE");
    });

    test("server error returns 500 with INTERNAL_ERROR errorCode and retryable:false", async () => {
      analysisService.analyzeMoveWithHistory = jest.fn().mockRejectedValue(
        new Error("Internal server error")
      );

      const response = await request(app)
        .post("/api/analyze")
        .send({
          type: "move",
          fen_before: startingFen,
          fen_after: afterMoveFen,
          move: sampleMove
        })
        .expect(500);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("errorCode", "INTERNAL_ERROR");
      expect(response.body).toHaveProperty("retryable", false);
      expect(response.body).toHaveProperty("error");
    });

    test("/api/analyze returns normalized error shape with errorCode and retryable", async () => {
      // Test various error codes
      const errorTests = [
        { error: new Error("OPENAI_INVALID_RESPONSE"), expectedCode: "OPENAI_INVALID_RESPONSE", expectedRetryable: true },
        { error: new Error("OpenAI timeout"), expectedCode: "OPENAI_TIMEOUT", expectedRetryable: true },
        { error: new Error("Rate limit exceeded"), expectedCode: "OPENAI_RATE_LIMIT", expectedRetryable: true },
        { error: new Error("Stockfish network error"), expectedCode: "STOCKFISH_NETWORK_ERROR", expectedRetryable: true },
        { error: new Error("Network fetch failed"), expectedCode: "NETWORK_ERROR", expectedRetryable: true },
      ];

      for (const testCase of errorTests) {
        analysisService.analyzeMoveWithHistory = jest.fn().mockRejectedValue(testCase.error);

        const response = await request(app)
          .post("/api/analyze")
          .send({
            type: "move",
            fen_before: startingFen,
            fen_after: afterMoveFen,
            move: sampleMove
          });

        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("errorCode", testCase.expectedCode);
        expect(response.body).toHaveProperty("retryable", testCase.expectedRetryable);
        expect(response.body).toHaveProperty("error");
      }
    });
  });
});

