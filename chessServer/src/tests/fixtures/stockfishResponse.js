/**
 * Mock Stockfish server response fixtures
 */

module.exports = {
  validResponse: {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    topBestMoves: [
      { rank: 1, move: "e2e4", scoreType: "cp", score: 20 },
      { rank: 2, move: "d2d4", scoreType: "cp", score: 15 },
      { rank: 3, move: "g1f3", scoreType: "cp", score: 10 },
    ],
    player_moves: "e2e4",
    evaluation: {
      before: { type: "cp", value: 0 },
      after: { type: "cp", value: 20 },
      delta: 20
    },
    classify: "Good",
    cpuMove: "e7e5",
    cpuPV: "e7e5 e2e4 g8f6",
    nextBestMoves: [
      { rank: 1, move: "e7e5", scoreType: "cp", score: -15 },
      { rank: 2, move: "c7c5", scoreType: "cp", score: -10 },
    ]
  },

  responseForQuestion: {
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    topBestMoves: [
      { rank: 1, move: "e7e5", scoreType: "cp", score: 15 },
    ],
    cpuMove: "e7e5",
    classify: "Best"
  }
};

