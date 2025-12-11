import { render } from '@testing-library/react';
import Puzzles from './Puzzles';

// 1. Mock useChessSocket
jest.mock('../../../features/lessons/piece-lessons/lesson-overlay/hooks/useChessSocket', () => ({
  useChessSocket: jest.fn(() => ({
    connected: false,
    sendMessage: jest.fn(),
    startNewPuzzle: jest.fn(),
    setPuzzleMoves: jest.fn(),
    setGameStateWithColor: jest.fn(),
    sendMove: jest.fn(),
    sendLastMove: jest.fn(),
    undo: jest.fn(),
    fen: '',
    playerColor: null,
    assignedRole: null,
    startNewGame: jest.fn(),
    endGame: jest.fn(),
    setExpectedMove: jest.fn(),
    setGameState: jest.fn(),
    sendHighlight: jest.fn(),
    sendGreySquare: jest.fn(),
    sendRemoveGrey: jest.fn(),
    sendPieceDrag: jest.fn(),
    sendPieceDrop: jest.fn(),
    sendMousePosition: jest.fn(),
    startMouseTracking: jest.fn(),
    stopMouseTracking: jest.fn(),
    setUserInfo: jest.fn(),
    socketRef: { current: null },
    currentFenRef: { current: '' },
    gameStateRef: { current: null },
  })),
}));

// 2. Mock sweetalert2
jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
    close: jest.fn(),
    showLoading: jest.fn(),
  },
}));

// 3. Mock globals
jest.mock('../../../globals', () => ({
  SetPermissionLevel: jest.fn(() => Promise.resolve({ error: true })),
}));

// 4. Mock react-cookie
jest.mock('react-cookie', () => ({
  useCookies: jest.fn(() => [{ login: null }, jest.fn(), jest.fn()]),
}));

// 5. Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// 6. Mock ChessBoard component
jest.mock('../../../components/ChessBoard/ChessBoard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => (
      <div data-testid="chess-board" ref={ref}>
        Mocked ChessBoard
      </div>
    )),
  };
});

// 7. Mock chess.js
jest.mock('chess.js', () => ({
  Chess: jest.fn().mockImplementation(() => ({
    load: jest.fn(),
    move: jest.fn(),
    undo: jest.fn(),
    fen: jest.fn(() => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
  })),
}));

// 8. Mock themesService
jest.mock('../../../core/services/themesService', () => ({
  themesName: {},
  themesDescription: {},
}));

// 9. Mock environment
jest.mock('../../../environments/environment', () => ({
  environment: {
    urls: {
      middlewareURL: 'http://localhost:3000',
      chessServerURL: 'ws://localhost:3001',
    },
  },
}));

// 10. Mock fetch (for puzzle data)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

// Mock window event listeners
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

beforeAll(() => {
  Object.defineProperty(window, 'addEventListener', {
    writable: true,
    value: mockAddEventListener,
  });
  Object.defineProperty(window, 'removeEventListener', {
    writable: true,
    value: mockRemoveEventListener,
  });
});

// --- TEST SUITE ---

describe('Puzzles Component (CI Stub)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stub: renders Puzzles without crashing', () => {
    const { container } = render(<Puzzles />);
    expect(container).toBeInTheDocument();
  });
});