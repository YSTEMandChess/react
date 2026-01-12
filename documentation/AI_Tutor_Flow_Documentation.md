# AI Tutor End-to-End Flow Documentation

## Table of Contents

1. [HTTP Endpoints & WebSocket Events](#1-http-endpoints--websocket-events)
2. [Full Request Chain](#2-full-request-chain)
3. [Step-by-Step Sequence: User Makes a Move → Gets Tutor Feedback](#3-step-by-step-sequence-user-makes-a-move--gets-tutor-feedback)
4. [Cache Check/Set Locations](#4-cache-checkset-locations)
5. [OpenAI Initialization & Usage](#5-openai-initialization--usage)
6. [Error Handling & Fallback Responses](#6-error-handling--fallback-responses)
7. [Performance Monitoring & Rate Limiting](#7-performance-monitoring--rate-limiting)
8. [Key Files & Responsibilities](#8-key-files--responsibilities)
9. [Performance Optimizations](#9-performance-optimizations)

---

## 1. HTTP Endpoints

### HTTP Endpoints

#### `POST /api/analyze`

- **Called by:** React `Aitutor.tsx` component
- **Location:** `chessServer/src/index.js:52`

- **Payload Shape:**

  ```json
  // Move analysis
  {
    "type": "move",
    "fen_before": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "fen_after": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    "move": "e2e4",
    "uciHistory": "e2e4",
    "depth": 15,
    "multipv": 15,
    "chatHistory": [
      { "role": "move", "content": "White moved from e2 to e4" },
      { "role": "assistant", "content": "...", "explanation": {...} }
    ]
  }

  // Question answering
  {
    "type": "question",
    "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    "question": "What's the best move here?",
    "chatHistory": [...]
  }
  ```

- **What it does:**

  1. Routes request to appropriate service based on `type` field
  2. Calls `analysisService.analyzeMoveWithHistory()` for moves
  3. Calls `analysisService.answerQuestion()` for questions
  4. Wraps call in 15-second timeout (`TOTAL_MS = 15000`)
  5. Returns success/error JSON response

- **Returns:**

  ```json
  // Move analysis response
  {
    "success": true,
    "type": "move",
    "explanation": "{\"moveIndicator\":\"Good\",\"Analysis\":\"...\",\"nextStepHint\":\"...\"}",
    "cached": false,
    "bestMove": "e7e5"
  }

  // Question response
  {
    "success": true,
    "type": "question",
    "answer": "The best move here is...",
    "cached": false
  }

  // Error response (standardized format)
  {
    "success": false,
    "error": "User-friendly error message",
    "errorCode": "OPENAI_TIMEOUT",
    "retryable": true
  }
  ```

### WebSocket Events

**Note:** The AI Tutor feature uses **REST only** - no WebSocket/Socket.IO connections. All communication between `chessServer` and `stockfishServer` is via HTTP REST API (`POST /analysis` endpoint).

**Important:** Socket.IO is still used by other features (game management, puzzles) but **not** by AI Tutor.

---

## 2. Full Request Chain

### A. Move Analysis Flow

```
UI (Aitutor.tsx)
  → POST /api/analyze (chessServer/index.js)
    → analysisService.analyzeMoveWithHistory() (AnalysisService.js)
      → [Cache Check] cache.has(cacheKey)
        → [Cache HIT] Return cached explanation + fetch Stockfish for bestMove
        → [Cache MISS] Continue to:
          → HTTP POST ${STOCKFISH_URL}/analysis (stockfishServer/index.js)
            → runStockfish() × 3 (current position, after player move, after CPU move)
            → classifyMove(), extractTopBestMoves()
            → Return: { topBestMoves, cpuMove, cpuPV, classify, evaluation, ... }
          → callOpenAIWithHistory(stockfishFacts, moveContext, "move")
            → [Rate Limiter Check] openai.rateLimiter.acquire()
              → [If rate limited] Throw OPENAI_RATE_LIMIT error
            → openai.getClient() (openai.js)
              → [Lazy Init] Check LLM_MODE / OPENAI_API_KEY
                → Initialize OpenAI client OR create mock client
            → buildPromptFromDoc() - Format prompt with Stockfish context
            → client.chat.completions.create() - Call OpenAI API
            → parseOpenAIJson() - Parse JSON, handle markdown fences
            → validateTutorResponse() - Validate response shape
              → [If invalid] Throw OPENAI_INVALID_RESPONSE
              → [If OpenAI fails but Stockfish succeeded] Generate fallback response
          → cache.set(cacheKey, explanation, 86400) - Cache for 24 hours
      → Return { explanation, cached, bestMove }
  → UI receives response, updates chat, applies CPU move if bestMove provided
```

### B. Question Answering Flow

```
UI (Aitutor.tsx)
  → POST /api/analyze (type: "question")
    → analysisService.answerQuestion()
      → [Cache Check] cache.has(questionCacheKey)
        → [Cache HIT] Return cached answer
        → [Cache MISS] Continue to:
          → HTTP POST ${STOCKFISH_URL}/analysis (optional, for position context)
          → callOpenAIWithHistory(stockfishFacts, questionContext, "question")
            → buildQuestionPrompt()
            → OpenAI API call with chat history
          → cache.set(questionCacheKey, answer, 86400)
      → Return { answer, cached }
  → UI displays answer in chat
```

---

## 3. Step-by-Step Sequence: User Makes a Move → Gets Tutor Feedback

### Detailed Sequence:

1. **User drops piece on board**

   - Location: `Aitutor.tsx:318`
   - Function: `onDrop(sourceSquare, targetSquare)` called
   - Prevents moves while analyzing: `if (isAnalyzing) return false`

2. **Validate & apply move**

   - Location: `Aitutor.tsx:324`
   - `chessRef.current.move()` validates and applies move
   - Computes `fenBefore`, `fenAfter`, `currentMoveUci`, `uciMoves`

3. **Update UI state immediately**

   - Location: `Aitutor.tsx:336-344`
   - Creates move message: `{ role: "move", content: "White moved from e2 to e4" }`
   - Updates `chatMessages`, `fen`, `history`, `moves` states

4. **Call analysis function**

   - Location: `Aitutor.tsx:145`
   - Function: `sendMoveForAnalysis(fenBefore, fenAfter, moveUci, uciMoves, chatHistory)`

5. **Set analyzing state**

   - Location: `Aitutor.tsx:153`
   - `setIsAnalyzing(true)`
   - Adds placeholder assistant message: `{ role: "assistant", content: "", explanation: undefined }`

6. **Send HTTP request**

   - Location: `Aitutor.tsx:171`
   - Method: `POST ${chessServer}/api/analyze`
   - Payload: `{ type: "move", fen_before, fen_after, move, uciHistory, depth: 15, chatHistory }`

7. **Backend receives request**

   - Location: `chessServer/src/index.js:52`
   - Handler: `/api/analyze` endpoint
   - Wraps in timeout: `withTimeout(analysisService.analyzeMoveWithHistory(...), 15000)`

8. **AnalysisService.analyzeMoveWithHistory()**

   - Location: `AnalysisService.js:648`
   - Builds cache key: `analysis:v1:${fen_after}:${move}:depth15:movetime2000:multipv1`

9. **Check cache (FIRST TIME - MISS)**

   - Location: `AnalysisService.js:661`
   - `cache.has(cacheKey)` returns `false`
   - Continues to Stockfish analysis

10. **Call Stockfish server**

    - Location: `AnalysisService.js:674`
    - Method: `fetchWithTimeout(${STOCKFISH_URL}/analysis, {...}, 6000)`
    - Payload: `{ fen: fen_before, moves: move, depth: 15, multipv: 15 }`

11. **Stockfish server processes**

    - Location: `stockfishServer/src/index.js:183`
    - Endpoint: `POST /analysis`
    - Runs 3 Stockfish analyses:
      a. Current position (before player move)
      b. After player move
      c. After CPU best response
    - Extracts top moves, classifies move quality, computes evaluation delta
    - Returns: `{ topBestMoves, cpuMove, cpuPV, classify, evaluation, nextBestMoves }`

12. **Build OpenAI prompt**

    - Location: `AnalysisService.js:227`
    - Function: `buildPromptFromDoc()`
    - Includes: FEN states, move quality label, top moves context, CPU response

13. **Prepare OpenAI call with chat history**

    - Location: `AnalysisService.js:475`
    - Function: `callOpenAIWithHistory(stockfishFacts, moveContext, "move")`
    - Converts chat history to OpenAI message format
    - Maps roles: `"move"` → `"user"`, `"assistant"` → `"assistant"`

14. **Initialize OpenAI client (lazy)**

    - Location: `openai.js:23`
    - Function: `getClient()`
    - Checks `LLM_MODE` and `OPENAI_API_KEY`
    - Initializes OpenAI client OR creates mock client
    - First call initializes the client (singleton pattern)

15. **Call OpenAI API**

    - Location: `openai.js:48` (mock) or real OpenAI API
    - Model: `gpt-4o` (or `OPENAI_MODEL` env var)
    - Temperature: `0.2`
    - Returns JSON: `{ moveIndicator, Analysis, nextStepHint }`

16. **Cache result**

    - Location: `AnalysisService.js:723`
    - `cache.set(cacheKey, explanation, 86400)`
    - TTL: 24 hours (86400 seconds)

17. **Return to Express handler**

    - Location: `AnalysisService.js:725`
    - Returns: `{ explanation, cached: false, bestMove }`

18. **Express sends HTTP response**

    - Location: `index.js:73`
    - `res.json({ success: true, type: "move", explanation, cached: false, bestMove })`

19. **Frontend receives response**

    - Location: `Aitutor.tsx:185`
    - Parses JSON response

20. **Parse explanation JSON**

    - Location: `Aitutor.tsx:201`
    - Extracts `moveIndicator`, `Analysis`, `nextStepHint`
    - Handles markdown code blocks if present

21. **Update chat UI**

    - Location: `Aitutor.tsx:218`
    - Function: `replaceLatestAssistantPlaceholder()`
    - Replaces placeholder with: `{ role: "assistant", content: explanation.Analysis, explanation: {...} }`

22. **Apply CPU move (if provided)**

    - Location: `Aitutor.tsx:227`
    - If `data.bestMove` exists, calls `applyCpuMove(bestMove)`
    - Updates board, adds CPU move message to chat

23. **Reset analyzing state**

    - Location: `Aitutor.tsx:216`
    - `setIsAnalyzing(false)`
    - UI updates to show avatar based on `moveIndicator`

24. **Display result**
    - Avatar changes based on move quality (`moveIndicator`)
    - Speech bubble displays analysis text
    - Next step hint displayed if present

---

## 4. Cache Check/Set Locations

### Cache Key Format:

- **Move analysis:** `analysis:v1:${fenAfter}:${moveUci}:depth${depth}:movetime${movetime}:multipv${multipv}`
- **Questions:** `question:v1:${fen}:${question}`

### Cache Operations:

#### 1. Check Cache (MOVE ANALYSIS)

- **Location:** `AnalysisService.js:661`
- **Code:** `cache.has(cacheKey)`
- **Behavior:**
  - If **HIT**: Returns cached explanation + fetches Stockfish for `bestMove` only
  - If **MISS**: Proceeds with full analysis pipeline

#### 2. Set Cache (MOVE ANALYSIS)

- **Location:** `AnalysisService.js:723`
- **Code:** `cache.set(cacheKey, explanation, 86400)`
- **Timing:** After OpenAI response, before returning to caller

#### 3. Check Cache (QUESTION)

- **Location:** `AnalysisService.js:749`
- **Code:** `cache.has(questionCacheKey)`
- **Behavior:**
  - If **HIT**: Returns immediately
  - If **MISS**: Proceeds with OpenAI call

#### 4. Set Cache (QUESTION)

- **Location:** `AnalysisService.js:801`
- **Code:** `cache.set(questionCacheKey, answer, 86400)`
- **Timing:** After OpenAI response

### Cache Implementation:

- **File:** `chessServer/src/utils/cache.js`
- **Storage:** In-memory `Map` with TTL support and LRU eviction
- **Structure:** `Map<key, { value, expiresAt, lastAccess }>`
- **Size Limit:** 5000 entries (configurable via `CACHE_MAX_SIZE` env var)
- **Eviction:** LRU (Least Recently Used) when cache exceeds max size
- **Cleanup:** Auto-cleanup on `get()`/`has()` if expired
- **TTL:** 86400 seconds (24 hours) default
- **Metrics:** Tracks hits, misses, and hit rate via `getStats()`

---

## 5. OpenAI Initialization & Usage

### Initialization Flow:

#### 1. Lazy Initialization

- **Location:** `openai.js:17`
- **Pattern:** Singleton with lazy initialization
- **Initial State:** `_client = null`
- **First Call:** `getClient()` initializes the client

#### 2. Configuration Check

- **Location:** `openai.js:11`
- **Function:** `hasOpenAIKey()` checks `OPENAI_API_KEY` env var
- **Mode:** `LLM_MODE` env var (default: `"openai"`)

#### 3. Client Creation

- **Location:** `openai.js:29-92`
- **Real Mode:** (`LLM_MODE=openai` + API key exists)
  - Creates `new OpenAI({ apiKey, timeout: 7000, maxRetries: 0 })`
  - Rate limiting is enforced before API calls (see Rate Limiting section)
- **Mock Mode:** (`LLM_MODE=mock` OR no API key)
  - Creates mock client with sample responses
  - Returns JSON for move analysis: `{ moveIndicator: "Good", Analysis: "...", nextStepHint: "..." }`
  - Returns plain text for questions
  - Rate limiting still applies in mock mode

#### 4. Singleton Pattern

- Client created once, reused for all requests
- `_client !== null` check prevents re-initialization

### OpenAI API Calls:

#### 1. Move Analysis (with history)

- **Location:** `AnalysisService.js:476`
- **Function:** `callOpenAIWithHistory(stockfishFacts, moveContext, "move")`
- **Rate Limiting:** Checks `openai.rateLimiter.acquire()` before API call (location: `AnalysisService.js:394`)
- **Model:** `gpt-4o` (or `OPENAI_MODEL` env var)
- **Messages:**
  - System prompt: "You are a chess coach..."
  - Chat history (converted to OpenAI format)
  - Current move prompt (from `buildPromptFromDoc()`)
- **Temperature:** `0.2`
- **Response Processing:**
  - Raw response parsed via `parseOpenAIJson()` (handles markdown code fences)
  - Validated via `validateTutorResponse()` (checks required fields)
  - Returns normalized object: `{ moveIndicator, Analysis, nextStepHint }`
- **Error Handling:** If parsing/validation fails, throws `OPENAI_INVALID_RESPONSE`

#### 2. Question Answering (with history)

- **Location:** `AnalysisService.js:794`
- **Function:** `callOpenAIWithHistory(stockfishFacts, questionContext, "question")`
- **Model:** `gpt-4o`
- **Messages:**
  - System prompt: "You are a chess coach answering questions..."
  - Chat history
  - Question prompt (from `buildQuestionPrompt()`)
- **Temperature:** `0.2`
- **Expected Response:** Plain text answer

#### 3. Move Analysis (without history)

- **Location:** `AnalysisService.js:429`
- **Function:** `callOpenAI(stockfishFacts, moveContext)`
- **Used by:** Internal helper function (AI Tutor uses `callOpenAIWithHistory()` for REST API)
- **No chat history:** Only current move context

### Prompt Building:

#### Move Prompt (`buildPromptFromDoc`)

- **Location:** `AnalysisService.js:227`
- **Includes:**
  - Board state (FEN before/after)
  - Stockfish classification (Best/Good/Inaccuracy/Mistake/Blunder)
  - Top best moves context
  - CPU response (best move + PV)
  - Next best moves for hint generation
- **Output Format:** Instructs JSON with exact fields: `moveIndicator`, `Analysis`, `nextStepHint`

#### Question Prompt (`buildQuestionPrompt`)

- **Location:** `AnalysisService.js:319`
- **Includes:**
  - Current FEN position
  - Optional Stockfish context
  - Student's question
- **Output Format:** Plain text answer

---

## 6. Error Handling & Fallback Responses

### Error Response Format

All API errors return a standardized JSON format:

```json
{
  "success": false,
  "error": "User-friendly error message",
  "errorCode": "ERROR_CODE",
  "retryable": true
}
```

### Error Codes

| Error Code                | Description                                             | Retryable | HTTP Status |
| ------------------------- | ------------------------------------------------------- | --------- | ----------- |
| `OPENAI_INVALID_RESPONSE` | OpenAI returned invalid JSON or missing required fields | Yes       | 500         |
| `OPENAI_TIMEOUT`          | OpenAI API call timed out                               | Yes       | 504         |
| `OPENAI_RATE_LIMIT`       | Rate limit exceeded (token bucket exhausted)            | Yes       | 429         |
| `OPENAI_API_ERROR`        | General OpenAI API error                                | Yes       | 500         |
| `STOCKFISH_TIMEOUT`       | Stockfish analysis timed out                            | Yes       | 504         |
| `STOCKFISH_NETWORK_ERROR` | Network error connecting to Stockfish                   | Yes       | 502         |
| `STOCKFISH_PARSE_ERROR`   | Failed to parse Stockfish response                      | No        | 500         |
| `VALIDATION_ERROR`        | Request validation failed                               | No        | 400         |
| `NETWORK_ERROR`           | General network error                                   | Yes       | 502         |
| `TIMEOUT`                 | Request timed out (15s limit)                           | Yes       | 504         |
| `INTERNAL_ERROR`          | Unexpected server error                                 | No        | 500         |

### JSON Parsing & Validation

**Location:** `AnalysisService.js:74-118`

- **`parseOpenAIJson(rawText)`**: Safely parses OpenAI JSON responses
  - Removes markdown code fences (`` json` and  `` `)
  - Returns `null` if parsing fails (does not throw)
- **`validateTutorResponse(obj)`**: Validates response shape
  - Required: `moveIndicator` (string), `Analysis` (string)
  - Optional: `nextStepHint` (string, defaults to empty string)
  - Returns `false` if validation fails

### Fallback Response Generation

**Location:** `AnalysisService.js:125-137`

When OpenAI fails but Stockfish analysis succeeded, the system generates a fallback response:

- **Trigger:** OpenAI throws error but `stockfishFacts.classify` exists
- **Response:** Uses Stockfish classification for `moveIndicator`
- **Analysis:** Generic message indicating detailed analysis unavailable
- **Caching:** Fallback responses are cached (24 hour TTL)
- **Behavior:** Returns success response (not error) with fallback data

**Example Fallback:**

```json
{
  "moveIndicator": "Good",
  "Analysis": "I'm having trouble providing a detailed analysis right now, but based on the engine evaluation, this appears to be a good move. Consider the position carefully and look for tactical opportunities.",
  "nextStepHint": "Continue developing your pieces and controlling key squares."
}
```

### Frontend Error Handling

**Location:** `react-ystemandchess/src/features/aitutor/Aitutor.tsx`

- **Error Message Mapping:** `getErrorMessage(errorCode, fallbackMessage)` maps error codes to user-friendly messages
- **Retry Button:** Displays "Retry" button for errors where `retryable: true`
- **Retry Logic:** `retryLastFailedRequest()` re-sends the last failed request payload
- **Error Display:** Errors are shown in chat UI with appropriate styling
- **State Management:** Failed request payload stored in `lastFailedRequest` state for retry

### Error Classification

**Location:** `chessServer/src/index.js:105-161`

Errors are classified in the `/api/analyze` catch block:

- Analyzes error message content to determine error type
- Sets appropriate `errorCode`, `retryable` flag, and HTTP status code
- Returns standardized error response format

---

## 7. Performance Monitoring & Rate Limiting

### Rate Limiting

**Implementation:** Token bucket algorithm

**Location:** `chessServer/src/utils/rateLimiter.js`

- **Algorithm:** Token bucket with configurable rate and capacity
- **Default:** 60 requests per minute (1 token/second, capacity 60)
- **Configuration:** `OPENAI_RATE_LIMIT_RPM` environment variable
- **Behavior:**
  - Tokens refill at constant rate (tokens per second)
  - Each API call consumes 1 token
  - If no tokens available, returns `{ allowed: false, retryAfter: ms }`
  - `retryAfter` indicates milliseconds until next token available

**Integration:** `chessServer/src/config/openai.js:14-15`

- Rate limiter initialized on module load
- Exported via `module.exports.rateLimiter`

**Usage:** `chessServer/src/services/AnalysisService.js:394-400`

- Before OpenAI API call, checks `openai.rateLimiter.acquire()`
- If not allowed, throws `OPENAI_RATE_LIMIT` error with `retryAfter` attached
- Rate limiting applies to both real and mock modes

### Performance Metrics

**Location:** `chessServer/src/services/AnalysisService.js:41-58`

Structured JSON logging for performance monitoring:

#### Metric Types

1. **Cache Metrics**

   - `cache_hit`: Cache hit event
   - `cache_miss`: Cache miss event
   - Includes cache statistics: `{ size, maxSize, hits, misses, hitRate }`

2. **Latency Metrics**

   - `stockfish_latency`: Stockfish API call duration (ms)
   - `openai_latency`: OpenAI API call duration (ms)
   - Includes success/failure status and error details

3. **Rate Limit Metrics**
   - `openai_rate_limit`: Rate limit event
   - Includes `retryAfter` information

#### Log Format

All metrics logged as structured JSON:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "metric": "stockfish_latency",
  "duration_ms": 1234,
  "success": true,
  "key": "analysis:v1:...",
  "stats": { "size": 100, "hits": 50, "misses": 10, "hitRate": 0.83 }
}
```

#### Logging Control

- **Environment Variable:** `METRICS_LOG_ENABLED` (default: `true`)
- **Disable:** Set `METRICS_LOG_ENABLED=false` to disable metric logging
- **Output:** Logs to `console.log` as JSON strings (can be piped to log aggregation)

#### Cache Statistics

**Location:** `chessServer/src/utils/cache.js:135-146`

- **`getStats()`**: Returns current cache statistics
  - `size`: Current number of entries
  - `maxSize`: Maximum cache size (default: 5000)
  - `hits`: Total cache hits
  - `misses`: Total cache misses
  - `hitRate`: Hit rate (hits / (hits + misses))

**Usage:** Logged with cache hit/miss events for monitoring

---

## 8. Key Files & Responsibilities

| File                                                   | Responsibility                                                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `react-ystemandchess/src/features/aitutor/Aitutor.tsx` | React UI component, handles move input, chat display, HTTP requests, error handling, retry UI                        |
| `chessServer/src/index.js`                             | Express REST API endpoint (`/api/analyze`), timeout wrapper, error classification & formatting                       |
| `chessServer/src/services/AnalysisService.js`          | Core orchestration: cache → Stockfish → OpenAI → cache, JSON parsing/validation, fallback responses, metrics logging |
| `chessServer/src/utils/cache.js`                       | In-memory TTL cache with LRU eviction, size limits (5000), hit/miss tracking, statistics                             |
| `chessServer/src/utils/rateLimiter.js`                 | Token bucket rate limiter implementation for API call throttling                                                     |
| `chessServer/src/config/openai.js`                     | Lazy OpenAI client initialization, mock mode support, rate limiter integration, singleton pattern                    |
| `stockfishServer/src/index.js`                         | HTTP `/analysis` endpoint, runs 3 Stockfish evaluations, returns classified analysis                                 |
| `chessServer/src/managers/GameManager.js`              | **NOT used by AI Tutor** (used by socket-based games for student/mentor pairs)                                       |

---

## 9. Performance Optimizations

1. **Caching:** 24-hour TTL for identical move/position combinations, prevents redundant OpenAI calls
   - LRU eviction when cache exceeds 5000 entries
   - Cache hit/miss tracking for performance monitoring
2. **Timeout Protection:** 15s total timeout (6s for Stockfish, 7s for OpenAI), prevents hanging requests
3. **HTTP Fetch:** All Stockfish communication uses HTTP REST API with timeout protection
4. **Lazy Initialization:** OpenAI client created only when needed, not on server startup
5. **HTTP Communication:** All Stockfish communication uses stateless HTTP REST API calls
6. **Rate Limiting:** Token bucket algorithm prevents API abuse and cost overruns (default: 60 req/min)
7. **Graceful Degradation:** Fallback responses when OpenAI fails but Stockfish succeeds
8. **Performance Monitoring:** Structured JSON logging for cache metrics, latency tracking
9. **Mock Mode:** Allows development/testing without OpenAI API key

---

## Additional Notes

### Environment Variables:

- `OPENAI_API_KEY`: Required for real OpenAI mode
- `LLM_MODE`: `"openai"` (default) or `"mock"`
- `OPENAI_MODEL`: Model name (default: `"gpt-4o"`)
- `OPENAI_TIMEOUT_MS`: OpenAI API timeout in milliseconds (default: `7000`)
- `OPENAI_MAX_RETRIES`: Maximum retries for OpenAI API (default: `0`)
- `OPENAI_RATE_LIMIT_RPM`: Rate limit in requests per minute (default: `60`)
- `STOCKFISH_SERVER_URL`: Stockfish server URL (default: `"http://localhost:4002"`)
- `PORT`: Chess server port (default: `4000`)
- `CACHE_MAX_SIZE`: Maximum cache entries before LRU eviction (default: `5000`)
- `METRICS_LOG_ENABLED`: Enable/disable structured JSON metric logging (default: `true`)

### Error Handling:

- **Standardized Error Format:** All errors return `{ success: false, error, errorCode, retryable }`
- **Error Classification:** Errors classified by type with appropriate HTTP status codes
- **Retry Logic:** Frontend provides retry button for retryable errors
- **Fallback Responses:** When OpenAI fails but Stockfish succeeds, returns fallback explanation
- **JSON Validation:** OpenAI responses validated for required fields before use
- **Graceful Degradation:** System continues to function even when OpenAI is unavailable

### Mock Mode:

When `LLM_MODE=mock` or no `OPENAI_API_KEY`:

- Returns sample JSON for move analysis: `{ moveIndicator: "Good", Analysis: "...", nextStepHint: "..." }`
- Returns sample text for questions
- Rate limiting still applies (prevents excessive mock calls)
- Logs responses to console
- Allows full flow testing without API costs
- **Note:** Mock responses are generic and do not reflect actual move quality (see future enhancements)
