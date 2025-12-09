import React from "react";
import { render } from "@testing-library/react";
import Puzzles from "./Puzzles";
import { MemoryRouter } from "react-router";

// Mock environment
jest.mock("../../../environments/environment", () => ({
  environment: {
    urls: {
      middlewareURL: "http://localhost:8000",
      chessServerURL: "http://localhost:3001",
      stockFishURL: "http://localhost:8080",
    },
  },
}));

// Mock ChessBoard
jest.mock("../../../components/ChessBoard/ChessBoard", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef(() => <div data-testid="chessboard">ChessBoard Mock</div>),
  };
});

// Mock socket hook
jest.mock(
  "../../../features/lessons/piece-lessons/lesson-overlay/hooks/useChessSocket",
  () => ({
    useChessSocket: () => ({
      connected: true,
      sendMove: jest.fn(),
      sendLastMove: jest.fn(),
      sendMessage: jest.fn(),
      startNewPuzzle: jest.fn(),
      setGameStateWithColor: jest.fn(),
      setPuzzleMoves: jest.fn(),
    }),
  })
);

// Mock globals
jest.mock("../../../globals", () => ({
  SetPermissionLevel: jest.fn(() =>
    Promise.resolve({ error: false, username: "test-user" })
  ),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    status: 200,
  })
) as jest.Mock;

describe("Puzzles component minimal test", () => {
  test("mounts without crashing", async () => {
    render(
      <MemoryRouter>
        <Puzzles />
      </MemoryRouter>
    );
  });
});
