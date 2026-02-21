import { useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { MoveEvent } from '../../../../../core/types/goals';

export function useLessonLogger(startFen: string) {
  // Initialize with the starting FEN
  const chessRef = useRef<Chess>(new Chess(startFen));
  const eventsRef = useRef<MoveEvent[]>([]);

  const logMove = useCallback((moveInput: string | { from: string; to: string; promotion?: string }) => {
    const game = chessRef.current;

    try {
      // 1. Execute the move
      const result = game.move(moveInput);
      if (!result) return null;

      const afterFen = game.fen();

      // 2. Logic for double pawn push
      const doublePawnPush =
        result.piece === 'p' &&
        Math.abs(parseInt(result.from[1]) - parseInt(result.to[1])) === 2;

      // 3. Build the event object
      const event: MoveEvent = {
        san: result.san,
        from: result.from,
        to: result.to,
        piece: result.piece,
        captured: result.captured,
        promotion: result.promotion,
        // Use the game state methods for accuracy
        check: game.inCheck(),
        checkmate: game.isCheckmate(),
        doublePawnPush,
        enPassant: result.flags.includes('e'),
        castling:
          result.flags.includes('k')
            ? 'kingside'
            : result.flags.includes('q')
              ? 'queenside'
              : undefined,
        fen: afterFen,
      };

      eventsRef.current.push(event);
      return { fen: afterFen, event };

    } catch (err) {
      console.error('Invalid move attempted:', moveInput, err);
      return null;
    }
  }, []);

  const makeMove = useCallback(
    (san: string) => {
      return logMove(san);
    },
    [logMove]
  );

  const resetLesson = useCallback(() => {
    chessRef.current = new Chess(startFen);
    eventsRef.current = [];
  }, [startFen]);

  const getEvents = useCallback(() => [...eventsRef.current], []);

  return { makeMove, resetLesson, getEvents };
}
