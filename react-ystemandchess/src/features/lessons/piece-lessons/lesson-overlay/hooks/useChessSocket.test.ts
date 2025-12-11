import { render } from '@testing-library/react';
import React from 'react';
import { useChessSocket } from './useChessSocket'; 
import { environment } from '../../../../../environments/environment';

// --- MOCKING EXTERNAL DEPENDENCIES ---

const mockSocketIo = {
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
};

jest.mock('socket.io-client', () => {
    // Return a function that is the mock client constructor
    return jest.fn(() => mockSocketIo);
});

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
    render(React.createElement(HookExecutor));

    // Get the mock function reference after rendering
    const mockSocketIoClient = require('socket.io-client');
    
    expect(mockSocketIoClient).toHaveBeenCalledTimes(1);
    expect(mockSocketIo.on).toHaveBeenCalledWith('connect', expect.any(Function));
  });
});