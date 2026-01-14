# AI Tutor Test Suite

This directory contains comprehensive tests for the AI Tutor flow.

## Test Files

### Backend Tests

- **`cache.test.js`** - Cache utility tests (TTL, expiration, cleanup)
- **`openai.test.js`** - OpenAI client initialization and mock mode tests
- **`AnalysisService.test.js`** - Main service tests for move analysis and question answering
- **`mockTutor.test.js`** - Mock tutor response generation tests (UCI to SAN conversion, evaluation normalization, contradiction resolution)
- **`errorHandling.test.js`** - Error scenarios (timeouts, API failures)
- **`api.test.js`** - REST API endpoint tests using supertest

### Test Fixtures

- **`fixtures/stockfishResponse.js`** - Mock Stockfish server responses
- **`fixtures/openaiResponse.js`** - Mock OpenAI responses
- **`fixtures/testData.js`** - Common test data (FEN positions, moves, chat history)

### Test Helpers

- **`helpers/mockHelpers.js`** - Utility functions for creating mocks

## Running Tests

### Run all backend tests:

```bash
cd chessServer
npm test
```

### Run specific test file:

```bash
cd chessServer
npm test -- AnalysisService.test.js
npm test -- cache.test.js
npm test -- openai.test.js
npm test -- mockTutor.test.js
npm test -- errorHandling.test.js
npm test -- api.test.js
```

### Run tests in watch mode:

```bash
cd chessServer
npm test -- --watch
```

### Run tests with coverage:

```bash
cd chessServer
npm test -- --coverage
```

## Test Environment

Tests use:

- **Mock mode for OpenAI** - Set via `LLM_MODE=mock` environment variable
- **Mocked fetch** - Global fetch is mocked for Stockfish server calls
- **In-memory cache** - Each test gets a clean cache instance

## Notes

- Tests do not require a real OpenAI API key
- Tests do not make actual network calls (all external services are mocked)
- Tests are isolated and can run in parallel
- Fake timers are used for TTL/expiration tests
