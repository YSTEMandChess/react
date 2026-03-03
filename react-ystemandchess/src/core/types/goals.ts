import type { Chess } from 'chess.js';
import { PieceSymbol } from './chess';

export type Actor = 'player' | 'opponent';

export type AtomicGoal =
  | {
    type: 'PROMOTION';
    min?: number;
    piece?: 'q' | 'r' | 'b' | 'n';
    by?: Actor; // Defaults to 'player'
  }
  | {
    type: 'CAPTURE';
    min?: number;
    piece?: 'p' | 'n' | 'b' | 'r' | 'q';
    square?: string;
    by?: Actor;
  }
  | {
    type: 'CHECKMATE';
    by?: Actor;
  }
  | {
    type: 'PAWN_DOUBLE_PUSH';
    min?: number;
    by?: Actor;
  }
  | {
    type: 'ALL_PAWNS_MOVED';
    by?: Actor;
  }
  | {
    type: 'MATERIAL_ADVANTAGE';
    threshold: number;
  };


export type CompositeGoal =
  | {
    type: 'AND';
    goals: Goal[];
  }
  | {
    type: 'OR';
    goals: Goal[];
  }


export type SequenceGoal = {
  type: 'SEQUENCE';
  goals: AtomicGoal[];
};

export type Goal = AtomicGoal | CompositeGoal | SequenceGoal;

export type OpponentConstraint =
  | {
    type: 'AVOID_SQUARES';
    squares: string[];
  }
  | {
    type: 'AVOID_CAPTURING';
    pieces?: ('p' | 'n' | 'b' | 'r' | 'q' | 'k')[]; // If omitted, avoid all captures
  }
  | {
    type: 'AVOID_CHECKING';
  }
  | {
    type: 'ONLY_MOVE_PIECES';
    pieces: ('p' | 'n' | 'b' | 'r' | 'q' | 'k')[];
  }
  | {
    type: 'STAY_IN_AREA';
    minRank?: number; // e.g., 6 = stay on ranks 6-8
    maxRank?: number; // e.g., 3 = stay on ranks 1-3
  }
  | {
    type: 'DONT_MOVE_FROM';
    squares: string[]; // Don't move pieces away from these squares
  };

export interface MoveEvent {
  san: string;
  from: string;
  to: string;
  piece: PieceSymbol;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
  check: boolean;
  checkmate: boolean;
  doublePawnPush: boolean;
  enPassant: boolean;
  castling?: 'kingside' | 'queenside';
  fen: string;
  by?: Actor;
}

export interface EvaluationContext {
  events: MoveEvent[];
  currentGame: Chess;
  startFen: string;
  currentFen: string;
  playerColor: 'white' | 'black';
  moveCount: number;
}

export interface LessonData {
  lessonNum: number;
  name: string;
  startFen: string;
  info: string;
  solution?: string;
  goal?: Goal;
  maxMoves?: number;
  opponentConstraints?: OpponentConstraint[];
}
