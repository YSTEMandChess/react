declare module "chessboardjsx" {
  import { Component } from "react";
  export type ChessMode = "lesson" | "puzzle" | "multiplayer" | "engine";

  interface ChessboardProps {
    mode?: ChessMode;
    position?: string;
    onDrop?: (move: { sourceSquare: string; targetSquare: string; }) => void;
    arePiecesDraggable?: boolean;
    width?: number;
    squareStyles?: Record<string, React.CSSProperties>;
    style?: React.CSSProperties;
    className?: string;
    orientation?: 'white' | 'black';

    allowDrag?: (args: { 
      piece: string; 
      sourceSquare: string; 
      targetSquare?: string; 
    }) => boolean; 
    
    onMouseOverSquare?: (square: string) => void;
    onMouseOutSquare?: () => void;
    
    onPromotionClick?: (promotion: { from: string, to: string }) => void;
  }

  export default class Chessboard extends Component<ChessboardProps> {}
}
