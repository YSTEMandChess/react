import React, { useState, useRef, useImperativeHandle, useEffect, forwardRef } from "react";
import Chessboard , { ChessMode } from "chessboardjsx";
import { Chess, Square } from "chess.js";
import { Move } from "../../core/types/chess";
import "./ChessBoard.css";

interface ChessBoardProps {
  mode?: ChessMode;
  fen?: string;
  lessonMoves?: Move[];
  orientation?: "white" | "black";
  disabled?: boolean;

  // Event handlers
  onMove?: (move: Move) => void;
  onInvalidMove?: () => void;
  onPromotion?: (from: string, to: string, piece: string) => void;

  // Highlighting
  highlightSquares?: string[];
  onHighlightChange?: (squares: string[]) => void;
}

export interface ChessBoardRef {
  handlePromotion: (from: string, to: string, piece: string) => void;
  reset: () => void;
  getFen: () => string;
  setOrientation: (color: "white" | "black") => void;
  flip: () => void;
  undo: () => void;
  loadPosition: (fen: string) => void;
  highlightMove: (from: string, to: string) => void;
  clearHighlights: () => void;
}

const ChessBoard = forwardRef<ChessBoardRef, ChessBoardProps>(
  (
    {
      mode = "multiplayer",
      fen,
      lessonMoves = [],
      orientation: propOrientation = "white",
      disabled = false,
      onMove,
      onInvalidMove,
      onPromotion,
      highlightSquares: externalHighlights = [],
      onHighlightChange,
    },
    ref
  ) => {
    // Internal chess engine for move validation
    const gameRef = useRef<Chess>(new Chess());

    // UI state
    const [internalHighlights, setInternalHighlights] = useState<string[]>([]);
    const [lessonIndex, setLessonIndex] = useState<number>(0);
    const [isShaking, setIsShaking] = useState<boolean>(false);
    const [orientation, setOrientationState] = useState<"white" | "black">(propOrientation);
    const [boardPosition, setBoardPosition] = useState<string>(fen || "start");
    const [boardWidth, setBoardWidth] = useState(560);
    const [greySquares, setGreySquares] = useState<string[]>([]);

    const boardRef = useRef<HTMLDivElement | null>(null);

    // Responsive sizing
    useEffect(() => {
      const handleResize = () => {
        if (boardRef.current) {
          const containerWidth = boardRef.current.offsetWidth;
          setBoardWidth(Math.min(containerWidth, 600));
        }
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Sync orientation from props
    useEffect(() => {
      setOrientationState(propOrientation);
    }, [propOrientation]);

    // Sync FEN from parent (server is source of truth) with comparison check
    useEffect(() => {
      if (fen && fen !== gameRef.current.fen()) {
        try {
          gameRef.current.load(fen);
          setBoardPosition(fen);
        } catch (err) {
          console.error("Invalid FEN from server:", fen, err);
        }
      }
    }, [fen]);

    // Combine highlights from props and internal state
    const allHighlights = [...externalHighlights, ...internalHighlights];

    useImperativeHandle(ref, () => ({
      handlePromotion: (from: string, to: string, piece: string) => {
        if (onPromotion) onPromotion(from, to, piece);
      },

      reset: () => {
        gameRef.current.reset();
        setBoardPosition(gameRef.current.fen());
        setInternalHighlights([]);
        setLessonIndex(0);
      },

      getFen: () => gameRef.current.fen(),

      setOrientation: (color: "white" | "black") => setOrientationState(color),

      flip: () => setOrientationState((o) => (o === "white" ? "black" : "white")),

      undo: () => {
        gameRef.current.undo();
        setBoardPosition(gameRef.current.fen());
        setInternalHighlights([]);
        setLessonIndex((prev) => Math.max(0, prev - 1));
      },

      loadPosition: (newFen: string) => {
        try {
          gameRef.current.load(newFen);
          setBoardPosition(newFen);
        } catch (err) {
          console.error("Failed to load FEN:", newFen, err);
        }
      },

      highlightMove: (from: string, to: string) => {
        const highlights = [from, to];
        setInternalHighlights(highlights);
        if (onHighlightChange) onHighlightChange(highlights);
      },

      clearHighlights: () => {
        setInternalHighlights([]);
        if (onHighlightChange) onHighlightChange([]);
      },
    }));

    const handleDrop = ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string;
    }) => {
      try {
        // Ignore if board is disabled
        if (disabled) {
          return "snapback";
        }

        const piece = gameRef.current.get(sourceSquare as Square);
        if (!piece) {
          return "snapback";
        }

        // Check for pawn promotion
        const isPromotion =
          piece.type === "p" &&
          (targetSquare[1] === "8" || targetSquare[1] === "1");

        // Construct move object
        const move: Move = {
          from: sourceSquare,
          to: targetSquare,
          promotion: isPromotion ? "q" : undefined,
        };

        // Lesson mode: validate expected moves BEFORE making the move
        if (lessonMoves.length > 0 && lessonIndex < lessonMoves.length) {
          const expected = lessonMoves[lessonIndex];

          if (move.from !== expected.from || move.to !== expected.to) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 400);
            if (onInvalidMove) onInvalidMove();
            return "snapback";
          }
        }

        // Validate move locally (for instant feedback)
        const moveResult = gameRef.current.move({
          from: sourceSquare as Square,
          to: targetSquare as Square,
          promotion: move.promotion,
        });

        if (!moveResult) {
          // Invalid move - shake animation and snapback
          console.log("Invalid move:", move);
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 400);
          if (onInvalidMove) onInvalidMove();
          return "snapback";
        }

        // Valid move - keep it and update board immediately
        setBoardPosition(gameRef.current.fen());

        // Highlight the move locally for instant feedback
        setInternalHighlights([sourceSquare, targetSquare]);

        // Increment lesson index if in lesson mode
        if (lessonMoves.length > 0 && lessonIndex < lessonMoves.length) {
          setLessonIndex((idx) => idx + 1);
        }

        // Send move to server/parent
        if (onMove) onMove(move);

        // Don't return anything - allow the move to complete
      } catch (error) {
        console.error("Error in handleDrop:", error);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
        if (onInvalidMove) onInvalidMove();
        return "snapback";
      }
    };

    const allowDrag = ({ piece }: { piece: string }) => {
      if (disabled) return false;

      const pieceColor = piece.startsWith('w') ? 'white' : 'black';

      if (mode === "lesson" || mode === "puzzle") {
        return true;
      }

      return pieceColor === orientation;
    };

    const onMouseOverSquare = (square: string) => {
      if (disabled) {
        setGreySquares([]);
        return;
      }

      const moves = gameRef.current.moves({
        square: square as Square,
        verbose: true,
      });

      if (moves.length === 0) {
        setGreySquares([]);
        return;
      }

      const newGreySquares = moves.map((move) => move.to);
      setGreySquares(newGreySquares);
    };

    const onMouseOutSquare = () => {
      setGreySquares([]);
    };

    const squareStyles = (): Record<string, React.CSSProperties> => {
      const styles: Record<string, React.CSSProperties> = {};

      // Highlight selected/moved squares
      allHighlights.forEach((sq) => {
        styles[sq] = {
          backgroundColor: "rgba(255, 251, 0, 0.75)",
        };
      });

      // Add Grey Dots for move hints
      greySquares.forEach((sq) => {
        // Use a radial gradient for a perfect grey dot in the center
        styles[sq] = {
          ...styles[sq], // Keep existing highlight if present
          background: styles[sq]
            ? `${styles[sq].backgroundColor}, radial-gradient(circle, #a1a1a1 12%, transparent 12%)`
            : "radial-gradient(circle, #a1a1a1 12%, transparent 12%)",
        };

        // For dark squares, use a slightly lighter grey
        if (["a", "c", "e", "g"].includes(sq[0]) === (Number(sq[1]) % 2 === 0)) {
          styles[sq].background = styles[sq]
            ? `${styles[sq].backgroundColor}, radial-gradient(circle, #b8b8b8 12%, transparent 12%)`
            : "radial-gradient(circle, #b8b8b8 12%, transparent 12%)";
        }
      });

      return styles;
    };

    return (
      <div
        ref={boardRef}
        className={`chessboard-wrapper ${isShaking ? "shake" : ""}`}
        style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}
      >
        <Chessboard
          width={boardWidth}
          position={boardPosition}
          onDrop={handleDrop}
          orientation={orientation}
          squareStyles={squareStyles()}
          allowDrag={allowDrag}
          onMouseOverSquare={onMouseOverSquare}
          onMouseOutSquare={onMouseOutSquare}
        />
      </div>
    );
  }
);

export default ChessBoard;
