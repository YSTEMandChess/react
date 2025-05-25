import { Chess } from 'chess.js';

function getMoveFromFens(prevFEN, currFEN) {
    const chess = new Chess(prevFEN)
    const moves = chess.moves({verbose: true})

    console.log(getPositionKey(prevFEN))
    console.log(getPositionKey(currFEN))

    for (let i = 0; i < moves.length; i++) {
        const possibleChess = new Chess(prevFEN)
        possibleChess.move(moves[i])
        console.log(`${i}: ${getPositionKey(possibleChess.fen())}`)
        if (getPositionKey(possibleChess.fen()) === getPositionKey(currFEN)) {
            console.log("move found!")
            return moves[i].san
        }
    }

        // move not found
    console.log("move not found :(")
    return null
}

function getPositionKey(fen) {
    // only compare the first 4 parts of the FEN (board, active color, castling, en passant)
    return fen.split(" ").slice(0, 3).join(" ")
}

const prevFEN = "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"
const currFEN = "rnbqkbnr/pp1ppppp/2p5/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 2"

console.log(getMoveFromFens(prevFEN, currFEN))