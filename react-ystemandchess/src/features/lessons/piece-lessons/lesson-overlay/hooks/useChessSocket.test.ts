import { render } from '@testing-library/react';
import React from 'react';

// --- MOCKING EXTERNAL DEPENDENCIES ---

// 1. Create mock socket instance FIRST
const mockSocketInstance = {
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  id: 'mock-socket-id',
};

// 2. Mock socket.io-client
jest.mock('socket.io-client/dist/socket.io.js', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    id: 'mock-socket-id'
  };

  return {
    io: jest.fn(() => mockSocket)
  };
});


// 3. Mock chess.js (used inside the hook)
jest.mock('chess.js', () => ({
  Chess: jest.fn().mockImplementation(() => ({
    load: jest.fn(),
    move: jest.fn(),
    fen: jest.fn(() => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
  })),
}));

// 4. Mock environment
jest.mock('../../../../../environments/environment', () => ({
  environment: {
    urls: {
      chessServerURL: 'ws://mock-server:3000',
      middlewareURL: 'http://mock-server:3000',
    },
  },
}));

// eslint-disable-next-line import/first
import { useChessSocket } from './useChessSocket';
// eslint-disable-next-line import/first
import { io } from 'socket.io-client';

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
    mockSocketInstance.on.mockClear();
    mockSocketInstance.emit.mockClear();
    mockSocketInstance.disconnect.mockClear();
  });

  afterEach(() => {
    // Clean up event listeners
    jest.restoreAllMocks();
  });

  it('stub: initializes the hook without crashing and verifies socket call', () => {
    const { unmount } = render(React.createElement(HookExecutor));

    // Verify socket.io was called
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