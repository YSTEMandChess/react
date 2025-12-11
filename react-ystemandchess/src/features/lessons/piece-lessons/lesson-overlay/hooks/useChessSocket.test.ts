import { render } from '@testing-library/react';
import React from 'react';
import { useChessSocket } from './useChessSocket';

// --- MOCKING EXTERNAL DEPENDENCIES ---

// 1. Create mock socket instance
const mockSocketInstance = {
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connected: false, 
  id: 'mock-socket-id', 
};

// 2. Mock socket.io-client
jest.mock('socket.io-client', () => {
    return jest.fn(() => mockSocketInstance);
});

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

  // Simplified test to ensure initialization without crashes
  it('stub: initializes the hook without crashing and verifies socket call', () => {
    const { unmount } = render(React.createElement(HookExecutor));

    const mockIoClient = require('socket.io-client');

    expect(mockIoClient).toHaveBeenCalledWith('ws://mock-server:3000', expect.anything());

    expect(mockSocketInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocketInstance.on).toHaveBeenCalledWith('disconnect', expect.any(Function));

    unmount();
  });
});