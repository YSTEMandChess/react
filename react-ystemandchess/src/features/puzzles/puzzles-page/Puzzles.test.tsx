import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import Puzzles from "./Puzzles";
import { MemoryRouter } from "react-router";

// Mock environment
jest.mock("../../../environments/environment", () => ({
  environment: {
    urls: {
      middlewareURL: "http://localhost:8000",
      chessServerURL: "http://localhost:3001",
    },
  },
}));

// Mock ChessBoard component
jest.mock("../../../components/ChessBoard/ChessBoard", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        highlightMove: jest.fn(),
        reset: jest.fn(),
        loadPosition: jest.fn(),
        getFen: jest.fn(() => "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
      }));
      return (
        <div
          data-testid="chessboard"
          onClick={() => props.onMove?.({ from: "e2", to: "e4" })}
        >
          ChessBoard Mock
        </div>
      );
    }),
    ChessBoardRef: {},
  };
});

// Mock useChessSocket hook
jest.mock("../../../features/lessons/piece-lessons/lesson-overlay/hooks/useChessSocket", () => ({
  useChessSocket: jest.fn(() => ({
    connected: true,
    sendMove: jest.fn(),
    sendLastMove: jest.fn(),
    sendMessage: jest.fn(),
    startNewPuzzle: jest.fn(),
    setGameStateWithColor: jest.fn(),
    setPuzzleMoves: jest.fn(),
  })),
}));

// Mock globals module
jest.mock("../../../globals", () => ({
  SetPermissionLevel: jest.fn(() => Promise.resolve({ error: false, username: "test-user" })),
}));

// Silence SweetAlert2
jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: {
    fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
    close: jest.fn(),
    showLoading: jest.fn(),
  },
}));

// Mock fetch for puzzles
const mockPuzzles = [
  {
    PuzzleId: "test-puzzle-1",
    FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    Moves: "e2e4 e7e5",
    Rating: 1200,
    Themes: "opening",
  },
  {
    PuzzleId: "test-puzzle-2",
    FEN: "8/8/8/8/8/8/8/8 w - - 0 1",
    Moves: "a2a4 a7a5",
    Rating: 800,
    Themes: "endgame",
  },
];

describe("Puzzles Component", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock) = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPuzzles),
        status: 200,
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders ChessBoard and puzzle buttons", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId("chessboard")).toBeInTheDocument();
    expect(screen.getByText("Get New Puzzle")).toBeInTheDocument();
    expect(screen.getByText("Show Hint")).toBeInTheDocument();
  });

  test("fetches and initializes puzzles", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/puzzles/random?limit=20")
      );
    });

    expect(screen.getByTestId("chessboard")).toBeInTheDocument();
    expect(document.getElementById("hint-text")).toBeInTheDocument();
  });

  test("hint button toggles hint text display", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });

    const hintText = document.getElementById("hint-text")!;
    const showHintBtn = screen.getByText("Show Hint");

    expect(hintText).toHaveStyle("display: none");

    fireEvent.click(showHintBtn);
    expect(hintText).toHaveStyle("display: block");

    fireEvent.click(showHintBtn);
    expect(hintText).toHaveStyle("display: none");
  });

  test("clicking get new puzzle sends message", async () => {
    const mockSendMessage = jest.fn();
    const { useChessSocket } = require("../../../features/lessons/piece-lessons/lesson-overlay/hooks/useChessSocket");

    useChessSocket.mockReturnValue({
      connected: true,
      sendMessage: mockSendMessage,
      sendMove: jest.fn(),
      sendLastMove: jest.fn(),
      startNewPuzzle: jest.fn(),
      setGameStateWithColor: jest.fn(),
      setPuzzleMoves: jest.fn(),
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });

    fireEvent.click(screen.getByText("Get New Puzzle"));

    expect(mockSendMessage).toHaveBeenCalledWith("next puzzle");
  });

  test("shows disconnected indicator when not connected", async () => {
    const { useChessSocket } = require("../../../features/lessons/piece-lessons/lesson-overlay/hooks/useChessSocket");

    useChessSocket.mockReturnValue({
      connected: false,
      sendMessage: jest.fn(),
      sendMove: jest.fn(),
      sendLastMove: jest.fn(),
      startNewPuzzle: jest.fn(),
      setGameStateWithColor: jest.fn(),
      setPuzzleMoves: jest.fn(),
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  test("handles fetch failure gracefully", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, status: 500 })
    );

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId("chessboard")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test("player move triggers socket sendMove and sendLastMove", async () => {
    const mockSendMove = jest.fn();
    const mockSendLastMove = jest.fn();
    const { useChessSocket } = require("../../../features/lessons/piece-lessons/lesson-overlay/hooks/useChessSocket");

    useChessSocket.mockReturnValue({
      connected: true,
      sendMessage: jest.fn(),
      sendMove: mockSendMove,
      sendLastMove: mockSendLastMove,
      startNewPuzzle: jest.fn(),
      setGameStateWithColor: jest.fn(),
      setPuzzleMoves: jest.fn(),
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });

    const chessboard = screen.getByTestId("chessboard");

    // Clicking triggers the mocked onMove
    fireEvent.click(chessboard);

    // The move should send via socket
    expect(mockSendMove).toHaveBeenCalled();
    expect(mockSendLastMove).toHaveBeenCalled();
  });
});