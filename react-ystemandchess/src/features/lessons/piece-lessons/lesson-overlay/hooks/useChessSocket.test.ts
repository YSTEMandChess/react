import { render } from '@testing-library/react';
import React from 'react';
import { useChessSocket } from './useChessSocket'; 

// --- MOCKING EXTERNAL DEPENDENCIES ---

// 1. Create a robust mock socket instance
const mockSocketInstance = {
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  id: 'mock-socket-id', 
};

// 2. Mock socket.io-client
jest.mock('socket.io-client', () => ({
    __esModule: true,
    io: jest.fn(() => mockSocketInstance), 
}));

// 3. Mock environment
jest.mock('../../../../../environments/environment', () => ({
  environment: {
    urls: {
      chessServerURL: 'ws://mock-server:3000',
    },
  },
}));

// --- TEST SETUP ---

const mockOptions = {
  student: 's1',
  mentor: 'm1',
  role: 'student' as const,
  mode: 'regular' as const,
  serverUrl: 'ws://mock-server:3000',
  onBoardStateChange: jest.fn(), onMessage: jest.fn(), onLastMove: jest.fn(), 
  onRoleAssigned: jest.fn(), onError: jest.fn(),
};

function HookExecutor() {
  useChessSocket(mockOptions);
  return null;
}

describe('useChessSocket Hook (CI Stub)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stub: initializes the hook without crashing and verifies socket call', () => {
    render(React.createElement(HookExecutor));

    const { io } = require('socket.io-client');

    expect(io).toHaveBeenCalledWith('ws://mock-server:3000', expect.anything());
    expect(mockSocketInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
  });
});