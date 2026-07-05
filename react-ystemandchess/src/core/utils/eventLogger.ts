import { MoveEvent } from '../types/goals';
import { PieceSymbol } from '../types/chess';

type ChessJsMove = {
  san: string;
  from: string;
  to: string;
  piece: PieceSymbol;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
  flags: string;
};

export function createMoveEvent(
  move: ChessJsMove,
  afterFen: string,
  isPlayerMove: boolean
): MoveEvent {
  const fromRank = Number(move.from[1]);
  const toRank = Number(move.to[1]);

  const doublePawnPush =
    move.piece === 'p' &&
    Math.abs(fromRank - toRank) === 2;

  return {
    san: move.san,
    from: move.from,
    to: move.to,
    piece: move.piece,
    captured: move.captured,
    promotion: move.promotion,
    check: move.san.includes('+'),
    checkmate: move.san.includes('#'),
    doublePawnPush,
    enPassant: move.flags.includes('e'),
    castling: move.flags.includes('k')
      ? 'kingside'
      : move.flags.includes('q')
        ? 'queenside'
        : undefined,
    fen: afterFen,
  };
}

export class EventLog {
  private events: MoveEvent[] = [];

  addMove(event: MoveEvent) {
    this.events.push(event);
  }

  getEvents(): MoveEvent[] {
    return [...this.events];
  }

  clear() {
    this.events = [];
  }

  popMove(): MoveEvent | undefined {
    return this.events.pop();
  }

  getPromotions(): MoveEvent[] {
    return this.events.filter(e => e.promotion);
  }

  getCaptures(): MoveEvent[] {
    return this.events.filter(e => e.captured);
  }

  getDoublePawnPushes(): MoveEvent[] {
    return this.events.filter(e => e.doublePawnPush);
  }

  hasCheckmate(): boolean {
    return this.events.some(e => e.checkmate);
  }

  hasSequence(
    checkA: (e: MoveEvent) => boolean,
    checkB: (e: MoveEvent) => boolean
  ): boolean {
    let foundA = false;
    for (const event of this.events) {
      if (!foundA && checkA(event)) {
        foundA = true;
      } else if (foundA && checkB(event)) {
        return true;
      }
    }
    return false;
  }
}
