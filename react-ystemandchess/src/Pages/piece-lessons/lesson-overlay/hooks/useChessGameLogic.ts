import { useState, useRef } from "react";
import { Chess } from "chess.js";

export function useChessGameLogic() {
	const [moves, setMoves] = useState<string[]>([]);
	const prevFenRef = useRef<string | null>(null);
	const currentFenRef = useRef<string | null>(null);

	function processMove() {
		if (prevFenRef.current) {
			const move = getMoveFromFens(prevFenRef.current, currentFenRef.current);
			if (move) setMoves((prev) => [...prev, move]);
		}
	}

	function resetLesson(startFen: string) {
		setMoves([]);
		currentFenRef.current = startFen;
	}

	function getMoveFromFens(prevFEN: string, currFEN: string) {
		const chess = new Chess(prevFEN);
		for (const move of chess.moves({ verbose: true })) {
			const test = new Chess(prevFEN);
			test.move(move);
			if (getPositionKey(test.fen()) === getPositionKey(currFEN)) {
				return move.san;
			}
		}
		return null;
	}

	function getPositionKey(fen: string) {
		return fen.split(" ").slice(0, 3).join(" ");
	}

	return { moves, processMove, resetLesson, currentFenRef, prevFenRef };
}