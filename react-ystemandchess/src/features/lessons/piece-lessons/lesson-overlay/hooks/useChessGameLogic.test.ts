import { renderHook, act } from '@testing-library/react';
import { useChessGameLogic } from './useChessGameLogic';

// mock chess.js
jest.mock('chess.js', () => {
  const mockChess = jest.fn();
  mockChess.prototype.moves = jest.fn();
  mockChess.prototype.move = jest.fn();
  mockChess.prototype.fen = jest.fn();
  
  return { Chess: mockChess };
});

import { Chess } from 'chess.js';

describe('useChessGameLogic', () => {
  const MockedChess = Chess as jest.MockedClass<typeof Chess>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty moves array', () => {
      const { result } = renderHook(() => useChessGameLogic());
      
      expect(result.current.moves).toEqual([]);
    });

    it('should initialize with null refs', () => {
      const { result } = renderHook(() => useChessGameLogic());
      
      expect(result.current.currentFenRef.current).toBeNull();
      expect(result.current.prevFenRef.current).toBeNull();
    });
  });

  describe('resetLesson', () => {
    it('should clear moves and set currentFenRef', () => {
      const { result } = renderHook(() => useChessGameLogic());
      const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // add some moves
      act(() => {
        result.current.moves.push('e4', 'e5');
      });
      
      act(() => {
        result.current.resetLesson(startFen);
      });
      
      expect(result.current.moves).toEqual([]);
      expect(result.current.currentFenRef.current).toBe(startFen);
    });
  });

  describe('processMove', () => {
    it('should not process move when prevFenRef is null', () => {
      const { result } = renderHook(() => useChessGameLogic());
      
      act(() => {
        result.current.processMove();
      });
      
      expect(result.current.moves).toEqual([]);
      expect(MockedChess).not.toHaveBeenCalled();
    });

    it('should process move and add to moves array when valid move found', () => {
      const { result } = renderHook(() => useChessGameLogic());
      const prevFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const currentFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      
      // setup refs
      result.current.prevFenRef.current = prevFen;
      result.current.currentFenRef.current = currentFen;
      
      // mock chess.js behavior
      const mockChessInstance = {
        moves: jest.fn().mockReturnValue([
          { san: 'e4', from: 'e2', to: 'e4' }
        ]),
        move: jest.fn(),
        fen: jest.fn().mockReturnValue(currentFen)
      };
      
      MockedChess.mockImplementation(() => mockChessInstance as any);
      
      act(() => {
        result.current.processMove();
      });
      
      expect(result.current.moves).toContain('e4');
    });

    it('should not add move when no valid move found', () => {
      const { result } = renderHook(() => useChessGameLogic());
      const prevFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const currentFen = 'invalid-fen';
      
      result.current.prevFenRef.current = prevFen;
      result.current.currentFenRef.current = currentFen;
      
      // mock chess.js to return no matching moves
      const mockChessInstance = {
        moves: jest.fn().mockReturnValue([
          { san: 'e4', from: 'e2', to: 'e4' }
        ]),
        move: jest.fn(),
        fen: jest.fn().mockReturnValue('different-fen')
      };
      
      MockedChess.mockImplementation(() => mockChessInstance as any);
      
      act(() => {
        result.current.processMove();
      });
      
      expect(result.current.moves).toEqual([]);
    });
  });
});