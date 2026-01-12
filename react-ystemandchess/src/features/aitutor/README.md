# AITutor Component Tests

Tests for the AITutor React component using React Testing Library.

## Test File

- **`Aitutor.test.tsx`** - Component tests for move making, chat functionality, error handling, and UI states

## Running Tests

### Run all frontend tests:
```bash
cd react-ystemandchess
npm test
```

### Run only AITutor tests:
```bash
cd react-ystemandchess
npm test -- Aitutor.test.tsx
```

### Run tests in watch mode:
```bash
cd react-ystemandchess
npm test -- --watch
```

### Run tests with coverage:
```bash
cd react-ystemandchess
npm test -- --coverage --collectCoverageFrom='src/features/aitutor/**/*.{ts,tsx}'
```

## Test Environment

Tests use:
- **Mocked fetch** - All API calls to chess server are mocked
- **Mocked react-chessboard** - Chessboard component is mocked for testing
- **Mocked environment** - Environment URLs are mocked

## Test Coverage

The tests cover:
- Component rendering
- Move making and analysis flow
- Chat functionality (questions and answers)
- Error handling (network errors, API errors)
- Loading states and UI feedback
- Input validation and state management

