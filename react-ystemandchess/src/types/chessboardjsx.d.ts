declare module "chessboardjsx" {
  import { Component } from "react";

  interface ChessboardProps {
    position?: string;
    onDrop?: (move: { sourceSquare: string; targetSquare: string; }) => void;
    arePiecesDraggable?: boolean;
    width?: number;
    squareStyles?: Record<string, React.CSSProperties>;
    style?: React.CSSProperties;
    className?: string;
    orientation?: 'white' | 'black';
  }

  export default class Chessboard extends Component<ChessboardProps> {}
}
