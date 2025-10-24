import React, { useState, useRef, useImperativeHandle, useEffect, forwardRef } from "react";
import Chessboard from "chessboardjsx";
import { Chess, Square } from "chess.js";
import "./ChessBoard.css";

interface Move {
  from: string;
  to: string;
  promotion?: string;
}

interface ChessBoardProps {
  lessonMoves?: Move[];
  onMove?: (fen: string) => void;
  onPromote?: (position: string, piece: string) => void;
  onReset?: (fen: string) => void;
  initialFEN?: string;
  fen?: string;
}

export interface ChessBoardRef {
  handlePromotion: (from: string, to: string, piece: string) => void;
  reset: () => void;
  getFen: () => string;
  setOrientation: (color: "white" | "black") => void;
  flip: () => void;
}

const ChessBoard = forwardRef<ChessBoardRef, ChessBoardProps>(
  ({ lessonMoves = [], onMove, onPromote, onReset, initialFEN = "start" }, ref) => {
    const normalizedFEN = !initialFEN || initialFEN === "start" ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : initialFEN;
    const gameRef = useRef<Chess>(new Chess(normalizedFEN));
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [fen, setFen] = useState(gameRef.current.fen());
    const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
    const [lessonIndex, setLessonIndex] = useState<number>(0);
    const [isShaking, setIsShaking] = useState<boolean>(false);
    const [orientation, setOrientationState] = useState<"white" | "black">("white");


    useEffect(() => {
      if (initialFEN && initialFEN !== gameRef.current.fen()) {
        gameRef.current.load(initialFEN);
        setFen(initialFEN);
        setHighlightSquares([]);
      }
    }, [initialFEN]);


    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      handlePromotion: (from: string, to: string, piece: string) => {
        const move = gameRef.current.move({ from: from as Square, to: to as Square, promotion: piece });
        if (move) {
          setFen(gameRef.current.fen());
          setHighlightSquares([from, to]);
          if (onPromote) onPromote(to, piece);
          if (onMove) onMove(gameRef.current.fen());
        }
      },
      reset: () => {
        gameRef.current.reset();
        setFen(gameRef.current.fen());
        setHighlightSquares([]);
        setLessonIndex(0);
        if (onReset) onReset(gameRef.current.fen());
      },
      getFen: () => gameRef.current.fen(),
      setOrientation: (color: "white" | "black") => {
        setOrientationState(color);
      },
      flip: () => {
        setOrientationState((o) => (o === "white" ? "black" : "white"));
      },
      undo: () => {
        const move = gameRef.current.undo();
        if (move) {
          setFen(gameRef.current.fen());
          setHighlightSquares([]);
          setLessonIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
      }
    }));

    const onDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string }) => {
      try {
        const piece = gameRef.current.get(sourceSquare as Square)?.type;
        const isPromotion = piece === "p" && (targetSquare[1] === "8" || targetSquare[1] === "1");

        const move = gameRef.current.move({
          from: sourceSquare as Square,
          to: targetSquare as Square,
          promotion: isPromotion ? "q" : undefined,
        });

        if (!move) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 400);
          return;
        }

        setFen(gameRef.current.fen());
        setHighlightSquares([sourceSquare, targetSquare]);

        // Lesson move logic
        if (lessonMoves.length > 0 && lessonIndex < lessonMoves.length) {
          const expected = lessonMoves[lessonIndex];
          if (move.from === expected.from && move.to === expected.to) {
            setLessonIndex((idx) => idx + 1);
          } else {
            gameRef.current.undo();
            setFen(gameRef.current.fen());
          }
        }

        if (onMove) onMove(gameRef.current.fen());
        checkGameStatus();
      } catch (err: any) {
        console.warn("Invalid move attempted:", err.message);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
      }
    };

    const checkGameStatus = () => {
      const g = gameRef.current;
      if (!g) return;

      const isCheckmate = g.isCheckmate;
      const isDraw = g.isDraw;
      const isCheck = g.isCheck;

      if (isCheckmate && isCheckmate.call(g)) {
        alert("Checkmate! Game over.");
      } else if (isDraw && isDraw.call(g)) {
        alert("Draw! Game over.");
      } else if (isCheck && isCheck.call(g)) {
        try {
          const board = g.board();
          const flatBoard = board.flat();
          const kingSquare = flatBoard.find(
            (sq) => sq && sq.type === "k" && sq.color === g.turn()
          );
          if (kingSquare) setHighlightSquares([kingSquare.square]);
        } catch (err) {
          console.warn("Unable to highlight king", err);
        }
      }
    };

    return (
      <div className={`chessboard-container ${isShaking ? "shake" : ""}`}>
        <Chessboard
          position={fen}
          onDrop={onDrop}
          orientation={orientation}
          squareStyles={highlightSquares.reduce((acc, sq) => {
            acc[sq] = { backgroundColor: "yellow" };
            return acc;
          }, {} as Record<string, React.CSSProperties>)}
          style={{ width: "100%", height: "100%" }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }
);

export default ChessBoard;
