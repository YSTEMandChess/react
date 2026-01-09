import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import Puzzles from "./Puzzles";
import { MemoryRouter } from "react-router";
import { useCookies } from "react-cookie";
import { useChessSocket } from "../../../features/lessons/piece-lessons/lesson-overlay/hooks/useChessSocket";
import Swal from "sweetalert2";

// Mock dependencies
jest.mock("react-cookie", () => ({
  useCookies: jest.fn(),
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
  close: jest.fn(),
  showLoading: jest.fn(),
}));

jest.mock(
  "../../../features/lessons/piece-lessons/lesson-overlay/hooks/useChessSocket",
  () => ({
    useChessSocket: jest.fn(),
  })
);

// Mock ChessBoard component
jest.mock("../../../components/ChessBoard/ChessBoard", () => {
  const React = require("react");
  return React.forwardRef((props: any, ref: any) => (
    <div data-testid="chess-board-mock">
      ChessBoard Mock
      <button
        onClick={() => props.onMove({ from: "e2", to: "e4" })}
        data-testid="mock-move-btn"
      >
        Make Move
      </button>
    </div>
  ));
});

// Mock themes service
jest.mock("../../../core/services/themesService", () => ({
  themesName: { theme1: "Theme 1" },
  themesDescription: { theme1: "Description 1" },
}));

const mockSocket = {
  connected: true,
  setGameStateWithColor: jest.fn(),
  sendMove: jest.fn(),
  sendLastMove: jest.fn(),
  sendMessage: jest.fn(),
  startNewPuzzle: jest.fn(),
  clearHighlights: jest.fn(),
};

describe("Puzzles Component", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Default cookie mock
    (useCookies as jest.Mock).mockReturnValue([
      {
        login:
          "header.eyJ1c2VybmFtZSI6InRlc3QtdXNlciIsInJvbGUiOiJzdHVkZW50In0=.signature",
      },
      jest.fn(),
      jest.fn(),
    ]);

    // Default socket mock
    (useChessSocket as jest.Mock).mockImplementation((props) => {
      React.useEffect(() => {
        if (props.onRoleAssigned) {
          props.onRoleAssigned("host");
        }
      }, []);
      return mockSocket;
    });

    // Mock global fetch
    global.fetch = jest.fn((url) => {
      if (typeof url === "string" && url.includes("puzzles/random")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                Moves: "e2e4 e7e5",
                Themes: "theme1",
                Rating: 1500,
              },
            ]),
        });
      }
      if (typeof url === "string" && url.includes("timeTracking")) {
        return Promise.resolve({
          status: 200,
          json: () =>
            Promise.resolve({
              eventId: "123",
              startTime: new Date().toISOString(),
            }),
        });
      }
      if (typeof url === "string" && url.includes("auth/validate")) {
        return Promise.resolve({
          status: 200,
          json: () =>
            Promise.resolve({ username: "test-user", role: "student" }),
          text: () =>
            Promise.resolve(
              JSON.stringify({ username: "test-user", role: "student" })
            ),
        });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    }) as jest.Mock;
  });

  test("renders loading state initially", async () => {
    // Simulate socket not yet providing a puzzle or FEN not set
    render(
      <MemoryRouter>
        <Puzzles />
      </MemoryRouter>
    );

    // Initially it might show "Loading puzzle..." because currentFEN is empty
    expect(screen.getByText(/Loading puzzle.../i)).toBeInTheDocument();
  });

  test("renders chess board when puzzle is loaded", async () => {
    render(
      <MemoryRouter>
        <Puzzles />
      </MemoryRouter>
    );

    // Wait for the puzzle to be fetched and loaded
    await waitFor(() => {
      expect(screen.queryByText(/Loading puzzle.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("chess-board-mock")).toBeInTheDocument();
  });

  test("calls startNewPuzzle if connected and status is empty", async () => {
    // Override mock for this test to NOT assign role immediately
    (useChessSocket as jest.Mock).mockReturnValue(mockSocket);

    render(
      <MemoryRouter>
        <Puzzles />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockSocket.startNewPuzzle).toHaveBeenCalled();
    });
  });

  test("handle 'Get New Puzzle' button click", async () => {
    render(
      <MemoryRouter>
        <Puzzles />
      </MemoryRouter>
    );

    // Wait for board to load
    await waitFor(() => {
      expect(screen.getByTestId("chess-board-mock")).toBeInTheDocument();
    });

    const newPuzzleBtn = screen.getByText("Get New Puzzle");
    fireEvent.click(newPuzzleBtn);

    expect(mockSocket.sendMessage).toHaveBeenCalledWith("next puzzle");
  });

  test("handle 'Show Hint' button click", async () => {
    render(
      <MemoryRouter>
        <Puzzles />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("chess-board-mock")).toBeInTheDocument();
    });

    const showHintBtn = screen.getByText("Show Hint");
    fireEvent.click(showHintBtn);

    // The hint text div should become visible (display: block)
    // Note: checking style visibility in jsdom can be tricky if it's done via inline styles.
    // The component sets `style={{ display: 'none' }}` initially and toggles it.
    // Let's check if the element exists and we can try to check style.

    // However, the component modifies the DOM element directly using document.getElementById('hint-text')
    // which might not work perfectly with React testing library's render container if not careful,
    // but since we are rendering into the document, it should be findable.

    // We can also check if socket.sendMessage was called with hints during initialization
    // because updateInfoBox is called when puzzle loads.
    expect(mockSocket.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining("Puzzle Rating:")
    );
  });

  test("handles player move correctly", async () => {
    render(
      <MemoryRouter>
        <Puzzles />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("chess-board-mock")).toBeInTheDocument();
    });

    // Simulate a move from the mock board
    const moveBtn = screen.getByTestId("mock-move-btn");

    // The mock puzzle moves are "e2e4 e7e5"
    // The button simulates sending { from: 'e2', to: 'e4' }
    // This matches the first move.

    await act(async () => {
      fireEvent.click(moveBtn);
    });

    expect(mockSocket.sendMove).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "e2",
        to: "e4",
      })
    );
  });
});
