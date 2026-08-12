import { Chess } from 'chess.js';
import { Goal, AtomicGoal, EvaluationContext } from '../types/goals';

/**
 * Main goal evaluation function
 * Returns true if the goal is achieved
 */
export function evaluateGoal(goal: Goal, context: EvaluationContext): boolean {
  console.log('[Goal Evaluator] Checking goal:', goal.type);

  switch (goal.type) {
    case 'PROMOTION':
      return evaluatePromotion(goal, context);

    case 'CAPTURE':
      return evaluateCapture(goal, context);

    case 'CHECKMATE':
      return evaluateCheckmate(context);

    case 'PAWN_DOUBLE_PUSH':
      return evaluatePawnDoublePush(goal, context);

    case 'ALL_PAWNS_MOVED':
      return evaluateAllPawnsMoved(context);

    case 'MATERIAL_ADVANTAGE':
      return evaluateMaterialAdvantage(goal, context);

    case 'SURVIVE':
      return evaluateSurvive(goal, context);

    case 'AND':
      return evaluateAND(goal, context);

    case 'OR':
      return evaluateOR(goal, context);

    case 'SEQUENCE':
      return evaluateSEQUENCE(goal, context);

    default:
      console.error('[Goal Evaluator] Unknown goal type:', (goal as any).type);
      return false;
  }
}

// ============================================
// ATOMIC GOAL EVALUATORS
// ============================================

function evaluatePromotion(
  goal: { type: 'PROMOTION'; min?: number; piece?: string; },
  context: EvaluationContext
): boolean {
  const minRequired = goal.min ?? 1;

  // Filter by actor (player vs opponent)
  const relevantEvents = context.events.filter((_, i) => i % 2 === 0);

  let promotionCount = relevantEvents.filter(e => e.promotion).length;

  // Filter by piece type if specified
  if (goal.piece) {
    promotionCount = relevantEvents.filter(
      e => e.promotion === goal.piece
    ).length;
  }

  console.log(`[PROMOTION] Required: ${minRequired}, Found: ${promotionCount}`);
  return promotionCount >= minRequired;
}

function evaluateCapture(
  goal: { type: 'CAPTURE'; min?: number; piece?: string; square?: string },
  context: EvaluationContext
): boolean {
  const minRequired = goal.min ?? 1;

  const relevantEvents = context.events.filter((_, i) => i % 2 === 0);

  let captures = relevantEvents.filter(e => e.captured);

  // Filter by captured piece type
  if (goal.piece) {
    captures = captures.filter(e => e.captured === goal.piece);
  }

  // Filter by capture square
  if (goal.square) {
    captures = captures.filter(e => e.to === goal.square);
  }

  console.log(`[CAPTURE] Required: ${minRequired}, Found: ${captures.length}`);
  return captures.length >= minRequired;
}

function evaluateCheckmate(context: EvaluationContext): boolean {
  const isCheckmate = context.currentGame.isCheckmate();

  if (isCheckmate) {
    // Verify the correct side is checkmated
    const turn = context.currentGame.turn(); // Who's turn (they're mated)
    const playerWon =
      (context.playerColor === 'white' && turn === 'b') ||
      (context.playerColor === 'black' && turn === 'w');

    console.log(`[CHECKMATE] Player won: ${playerWon}`);
    return playerWon;
  }

  return false;
}

function evaluatePawnDoublePush(
  goal: { type: 'PAWN_DOUBLE_PUSH'; min?: number },
  context: EvaluationContext
): boolean {
  const minRequired = goal.min ?? 1;
  const doublePushCount = context.events.filter((e, i) => i % 2 === 0 && e.doublePawnPush).length;

  console.log(`[PAWN_DOUBLE_PUSH] Required: ${minRequired}, Found: ${doublePushCount}`);
  return doublePushCount >= minRequired;
}

function evaluateAllPawnsMoved(context: EvaluationContext): boolean {
  // Get starting pawn positions
  const startGame = new Chess(context.startFen);
  const startPawns = getPawnPositions(startGame, context.playerColor);

  // Get current pawn positions
  const currentPawns = getPawnPositions(context.currentGame, context.playerColor);

  // Check if all starting pawns have moved or been captured/promoted
  const allMoved = startPawns.every(startSquare => {
    return !currentPawns.includes(startSquare);
  });

  console.log(`[ALL_PAWNS_MOVED] Start pawns: ${startPawns}, Current: ${currentPawns}, All moved: ${allMoved}`);
  return allMoved;
}

function evaluateMaterialAdvantage(
  goal: { type: 'MATERIAL_ADVANTAGE'; threshold: number },
  context: EvaluationContext
): boolean {
  const materialDiff = calculateMaterialDifference(context.currentFen);

  // Positive = white ahead, negative = black ahead
  const advantage = context.playerColor === 'white' ? materialDiff : -materialDiff;

  console.log(`[MATERIAL_ADVANTAGE] Required: ${goal.threshold}, Current: ${advantage}`);
  return advantage >= goal.threshold;
}

function evaluateSurvive(
  goal: { type: 'SURVIVE'; moves: number },
  context: EvaluationContext
): boolean {
  if (context.events.length < goal.moves) return false;

  const opponentPromoted = context.events.some((e, i) => i % 2 !== 0 && e.promotion);

  console.log(`[SURVIVE] Required: ${goal.moves} half-moves, Current: ${context.events.length}, Opponent promoted: ${opponentPromoted}`);
  return !opponentPromoted;
}

// ============================================
// COMPOSITE GOAL EVALUATORS
// ============================================

function evaluateAND(
  goal: { type: 'AND'; goals: Goal[] },
  context: EvaluationContext
): boolean {
  const results = goal.goals.map(g => evaluateGoal(g, context));
  const allTrue = results.every(r => r);

  console.log(`[AND] Results:`, results, `=> ${allTrue}`);
  return allTrue;
}

function evaluateOR(
  goal: { type: 'OR'; goals: Goal[] },
  context: EvaluationContext
): boolean {
  const results = goal.goals.map(g => evaluateGoal(g, context));
  const anyTrue = results.some(r => r);

  console.log(`[OR] Results:`, results, `=> ${anyTrue}`);
  return anyTrue;
}

function evaluateSEQUENCE(
  goal: { type: 'SEQUENCE'; goals: AtomicGoal[] },
  context: EvaluationContext
): boolean {
  let cursor = 0;

  for (const atomicGoal of goal.goals) {
    let satisfiedAt = -1;

    for (let i = cursor; i < context.events.length; i++) {
      const partialContext: EvaluationContext = {
        ...context,
        events: context.events.slice(0, i + 1)
      };

      if (evaluateGoal(atomicGoal, partialContext)) {
        satisfiedAt = i;
        break;
      }
    }

    if (satisfiedAt === -1) {
      return false;
    }

    cursor = satisfiedAt + 1;
  }

  return true;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getPawnPositions(game: Chess, color: 'white' | 'black'): string[] {
  const board = game.board();
  const positions: string[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = board[row][col];
      if (square && square.type === 'p' && square.color === color[0]) {
        const file = String.fromCharCode(97 + col); // a-h
        const rank = 8 - row; // 1-8
        positions.push(`${file}${rank}`);
      }
    }
  }

  return positions;
}

function calculateMaterialDifference(fen: string): number {
  const pieceValues: { [key: string]: number } = {
    'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9,
    'p': -1, 'n': -3, 'b': -3, 'r': -5, 'q': -9
  };

  return fen
    .split(' ')[0]
    .split('')
    .reduce((sum, c) => sum + (pieceValues[c] ?? 0), 0);
}
