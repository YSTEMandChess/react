import { render } from '@testing-library/react';
import React from 'react';
import { useChessSocket } from './useChessSocket'; 
import { environment } from '../../../../../environments/environment';

// --- MOCKING EXTERNAL DEPENDENCIES ---

// 1. Mock the socket.io-client library
const mockSocketIo = {
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
};
const mockSocketIoClient = jest.fn(() => mockSocketIo);
jest.mock('socket.io-client', () => mockSocketIoClient);

// 2. Mock the environment URL
jest.mock('../../../environments/environment', () => ({
  environment: {
    urls: {
      chessServerURL: 'ws://mock-server:3000',
    },
  },
}));

// --- TEST SETUP ---

// Define strict types for the options to satisfy TypeScript
const mockOptions = {
    student: 's1',
    mentor: 'm1',
    role: 'student' as const, 
    mode: 'regular' as const,
    serverUrl: environment.urls.chessServerURL,
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

describe('useChessSocket Hook (CI Stub - Pure JS/TS)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stub: initializes the hook without crashing and verifies socket call', () => {
    // 1. Execute the component function using RTL's render.
    // This executes the HookExecutor function, which in turn calls useChessSocket.
    render(React.createElement(HookExecutor));

    // 2. Verification check: Did the hook attempt to connect?
    expect(mockSocketIoClient).toHaveBeenCalledTimes(1);
    
    // 3. Optional: Verify setup parameters
    expect(mockSocketIoClient).toHaveBeenCalledWith('ws://mock-server:3000', {
      transports: ['websocket'],
      query: {
        studentId: 's1',
        mentorId: 'm1',
        role: 'student',
        mode: 'regular',
      },
    });
    
    expect(true).toBe(true); 
  });
});