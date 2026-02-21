import { Chess } from 'chess.js';
import { OpponentConstraint } from '../types/goals';

export function getConstrainedMoves(
  fen: string,
  constraints: OpponentConstraint[]
): any[] {
  const game = new Chess(fen);
  let moves = game.moves({ verbose: true });

  // Apply each constraint as a filter
  for (const constraint of constraints) {
    moves = applyConstraint(moves, constraint, game);
  }

  return moves;
}

function applyConstraint(
  moves: any[],
  constraint: OpponentConstraint,
  game: Chess
): any[] {
  switch (constraint.type) {
    case 'AVOID_SQUARES':
      return moves.filter(m => !constraint.squares.includes(m.to));

    case 'AVOID_CAPTURING':
      if (constraint.pieces) {
        // Only avoid capturing specific pieces
        return moves.filter(m =>
          !m.captured || !constraint.pieces!.includes(m.captured)
        );
      }
      // Avoid all captures
      return moves.filter(m => !m.captured);

    case 'AVOID_CHECKING':
      return moves.filter(m =>
        !m.san.includes('+') && !m.san.includes('#')
      );

    case 'ONLY_MOVE_PIECES':
      return moves.filter(m => constraint.pieces.includes(m.piece));

    case 'STAY_IN_AREA':
      return moves.filter(m => {
        const toRank = parseInt(m.to[1]);
        if (constraint.minRank && toRank < constraint.minRank) return false;
        if (constraint.maxRank && toRank > constraint.maxRank) return false;
        return true;
      });

    case 'DONT_MOVE_FROM':
      return moves.filter(m => !constraint.squares.includes(m.from));

    default:
      return moves;
  }
}

export function getConstrainedMove(
  fen: string,
  constraints: OpponentConstraint[]
): { from: string; to: string; promotion?: string } | null {
  const constrainedMoves = getConstrainedMoves(fen, constraints);

  if (constrainedMoves.length === 0) {
    console.warn('[Constraints] No moves satisfy constraints, using any legal move');
    const game = new Chess(fen);
    const allMoves = game.moves({ verbose: true });
    if (allMoves.length === 0) return null;
    const fallback = allMoves[Math.floor(Math.random() * allMoves.length)];
    return { from: fallback.from, to: fallback.to, promotion: fallback.promotion };
  }

  // Random selection from constrained moves
  const chosen = constrainedMoves[Math.floor(Math.random() * constrainedMoves.length)];

  console.log('[Constraints] Chose move:', chosen.san, 'from', constrainedMoves.length, 'options');

  return {
    from: chosen.from,
    to: chosen.to,
    promotion: chosen.promotion
  };
}
