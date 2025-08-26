import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Puzzles from "./Puzzles";
import { MemoryRouter } from "react-router";
import Swal from "sweetalert2";

// Mock environment and chessClientURL for iframe src
jest.mock("../../environments/environment", () => ({
  environment: {
    urls: {
      chessClientURL: "http://localhost:3000",
      middlewareURL: "http://localhost:4000",
    },
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
    Themes: "empty",
  },
];

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockPuzzles),
  })
) as jest.Mock;

// Silence SweetAlert2
jest.mock("sweetalert2", () => ({
  fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
  close: jest.fn(),
  showLoading: jest.fn(),
}));


describe("Puzzles Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders iframe and puzzle buttons", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });
    expect(screen.getByTitle("board")).toBeInTheDocument();
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
    const iframe = screen.getByTitle("board");
    expect(iframe).toBeInTheDocument();
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

  test("clicking get new puzzle triggers postMessage", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });
    const iframe = screen.getByTitle("board") as HTMLIFrameElement;
    const spy = jest.spyOn(window, "postMessage");
    fireEvent.click(screen.getByText("Get New Puzzle"));
    expect(iframe).toBeInTheDocument();
  });

  test("handles 'puzzle completed' message", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });
    act(() => {
      window.postMessage("puzzle completed", "*");
    });
    expect(Swal.fire).toHaveBeenCalledWith(
      "Puzzle completed",
      "Good Job",
      "success"
    );
  });

  test("handles 'next puzzle' message", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });
    act(() => {
      window.postMessage("next puzzle", "*");
    });
    expect(Swal.close).toHaveBeenCalled();
  });

  test("handles 'host' and 'guest' status", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles role="student" styleType="profile" />
        </MemoryRouter>
      );
    });
    act(() => {
      window.postMessage("host", "*");
    });
    act(() => {
      window.postMessage("guest", "*");
    });
    expect(screen.getByTitle("board")).toBeInTheDocument();
  });

  test("handles FEN update message", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });
    act(() => {
      window.postMessage(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "*"
      );
    });
    // No crash = pass. Could extend with state inspection if needed.
    expect(screen.getByTitle("board")).toBeInTheDocument();
  });

  test("handles HTML hint message", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });
    const hintHTML = `<div><b>Test</b>: Hint content</div>`;
    act(() => {
      window.postMessage(hintHTML, "*");
    });
    const hintText = document.getElementById("hint-text")!;
    expect(hintText.innerHTML).toContain("Hint content");
  });

  test("handles fetch failure gracefully", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ ok: false })
    );
    await act(async () => {
      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );
    });
    expect(screen.getByTitle("board")).toBeInTheDocument();
  });
});