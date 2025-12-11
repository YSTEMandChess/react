import { render } from '@testing-library/react';
import React from 'react';
import { useChessSocket } from './useChessSocket';

// --- MOCKING EXTERNAL DEPENDENCIES ---

const mockSocketInstance = {
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  id: 'mock-socket-id',
};

// Mock socket.io-client with proper default export structure
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocketInstance),
}));

jest.mock('../../../../../environments/environment', () => ({
  environment: {
    urls: {
      chessServerURL: 'ws://mock-server:3000',
    },
  },
}));

// Mock chess.js
jest.mock('chess.js', () => ({
  Chess: jest.fn().mockImplementation(() => ({
    load: jest.fn(),
    move: jest.fn(),
    fen: jest.fn(() => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
  })),
}));

// --- TEST SETUP ---

const mockOptions = {
  student: 's1',
  mentor: 'm1',
  role: 'student' as const,
  mode: 'regular' as const,
  serverUrl: 'ws://mock-server:3000',
  onBoardStateChange: jest.fn(),
  onMessage: jest.fn(),
  onLastMove: jest.fn(),
  onRoleAssigned: jest.fn(),
  onError: jest.fn(),
};

function HookExecutor() {
  useChessSocket(mockOptions);
  return null;
}

describe('useChessSocket Hook (CI Stub)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener('mousemove', expect.any(Function));
  });

  it('stub: initializes the hook without crashing and verifies socket call', () => {
    const { unmount } = render(React.createElement(HookExecutor));

    // Get the mock function reference
    const { io } = require('socket.io-client');

    // Verify socket.io was called with correct parameters
    expect(io).toHaveBeenCalledWith('ws://mock-server:3000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Verify socket listeners were set up
    expect(mockSocketInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocketInstance.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocketInstance.on).toHaveBeenCalledWith('boardstate', expect.any(Function));

    unmount();
  });
});