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
  })),
}));

// 2. Mock sweetalert2
jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
  close: jest.fn(),
  showLoading: jest.fn(),
}));

// 3. Mock globals
jest.mock('../../../globals', () => ({
    SetPermissionLevel: jest.fn(() => Promise.resolve({ error: true })),
}));

// 4. Mock fetch (for puzzle data)
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  }) as any
);

// --- TEST SUITE ---

describe('Puzzles Component (CI Stub)', () => {
  it('stub: renders Puzzles without crashing', () => {
    render(<Puzzles />); 
    expect(true).toBe(true); 
  });
});