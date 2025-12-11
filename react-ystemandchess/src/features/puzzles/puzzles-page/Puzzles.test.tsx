import React from 'react';
import { render } from '@testing-library/react';

// 1. Mock react-cookie
jest.mock('react-cookie/dist/react-cookie.cjs.js', () => ({
  useCookies: jest.fn(() => [
    { login: null },
    jest.fn(),
    jest.fn(),
  ]),
  CookiesProvider: ({ children }: any) => children,
}));

// 2. Mock useChessSocket
jest.mock('../../../features/lessons/piece-lessons/lesson-overlay/hooks/useChessSocket', () => ({
  useChessSocket: jest.fn(() => ({
    connected: false,
    fen: '',
    playerColor: null,
    assignedRole: null,
    sendMessage: jest.fn(),
    startNewPuzzle: jest.fn(),
    setPuzzleMoves: jest.fn(),
    setGameStateWithColor: jest.fn(),
    sendMove: jest.fn(),
    sendLastMove: jest.fn(),
    undo: jest.fn(),
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

// 3. Mock sweetalert2
jest.mock('sweetalert2', () => {
  const mockSwal: any = jest.fn(() => Promise.resolve({ isConfirmed: true }));
  mockSwal.fire = jest.fn(() => Promise.resolve({ isConfirmed: true }));
  mockSwal.close = jest.fn();
  mockSwal.showLoading = jest.fn();
  return mockSwal;
});

// 4. Mock globals
jest.mock('../../../globals', () => ({
  SetPermissionLevel: jest.fn(() => Promise.resolve({ error: true })),
}));

// 5. Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// 6. Mock ChessBoard component
jest.mock('../../../components/ChessBoard/ChessBoard', () => {
  const React = require('react');
  const MockChessBoard = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      clearHighlights: jest.fn(),
      highlightMove: jest.fn(),
    }));
    return React.createElement('div', { 'data-testid': 'chess-board' }, 'Mocked ChessBoard');
  });
  MockChessBoard.displayName = 'MockChessBoard';
  
  return MockChessBoard;
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

// 10. Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

// Mock window event listeners
Object.defineProperty(window, 'addEventListener', {
  writable: true,
  configurable: true,
  value: jest.fn(),
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  configurable: true,
  value: jest.fn(),
});

// eslint-disable-next-line import/first
import Puzzles from './Puzzles';

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