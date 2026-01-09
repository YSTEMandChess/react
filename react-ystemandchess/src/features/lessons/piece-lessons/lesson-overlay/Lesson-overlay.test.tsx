import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import LessonOverlay from "./Lesson-overlay";
import { MemoryRouter } from "react-router";
import * as router from "react-router";
import { useLessonManager } from "./hooks/useLessonManager";
import { useChessGameLogic } from "./hooks/useChessGameLogic";
import { useChessSocket } from "./hooks/useChessSocket";
import { useTimeTracking } from "./hooks/useTimeTracking";

// --- Mocks ---

// Mock react-cookie
jest.mock("react-cookie", () => ({
  useCookies: () => [
    { login: { studentId: "student123" } },
    jest.fn(),
    jest.fn(),
  ],
}));

// Mock react-router
const mockNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
}));

// Mock child components
jest.mock("../../../../components/ChessBoard/ChessBoard", () => {
  const { forwardRef, useImperativeHandle } = require("react");
  return forwardRef((props: any, ref: any) => {
    useImperativeHandle(ref, () => ({
      flip: jest.fn(),
      highlightMove: jest.fn(),
      setOrientation: jest.fn(),
      handlePromotion: jest.fn(),
      reset: jest.fn(),
      undo: jest.fn(),
    }));
    return <div data-testid="chess-board">ChessBoard Mock</div>;
  });
});

jest.mock("../move-tracker/MoveTracker", () => () => (
  <div data-testid="move-tracker">MoveTracker Mock</div>
));

jest.mock("../../lessons-main/PromotionPopup", () => () => (
  <div data-testid="promotion-popup">PromotionPopup Mock</div>
));

// Mock custom hooks
jest.mock("./hooks/useLessonManager");
jest.mock("./hooks/useChessGameLogic");
jest.mock("./hooks/useChessSocket");
jest.mock("./hooks/useTimeTracking");

describe("LessonOverlay", () => {
  let mockUseLessonManager: any;
  let mockUseChessGameLogic: any;
  let mockSocket: any;
  let socketCallbacks: any = {};

  beforeEach(() => {
    jest.clearAllMocks();

    (router.useLocation as jest.Mock).mockReturnValue({
      state: { piece: "Rook", lessonNum: 0 },
    });

    // Setup useLessonManager mock
    mockUseLessonManager = {
      lessonData: {
        startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        endFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 2",
        info: "get a winning position",
        name: "Test Lesson Name",
        moves: [],
      },
      lessonNum: 0,
      completedNum: 0,
      totalLessons: 5,
      refreshProgress: jest.fn().mockResolvedValue(undefined),
      goToLesson: jest.fn(),
      nextLesson: jest.fn().mockResolvedValue(undefined),
      prevLesson: jest.fn().mockResolvedValue(undefined),
      updateCompletion: jest.fn().mockResolvedValue(undefined),
      setLessonNum: jest.fn(),
    };
    (useLessonManager as jest.Mock).mockReturnValue(mockUseLessonManager);

    // Setup useChessGameLogic mock
    mockUseChessGameLogic = {
      moves: [],
      processMove: jest.fn(),
      resetLesson: jest.fn(),
      currentFenRef: { current: "" },
      prevFenRef: { current: "" },
    };
    (useChessGameLogic as jest.Mock).mockReturnValue(mockUseChessGameLogic);

    // Setup useChessSocket mock
    socketCallbacks = {};
    mockSocket = {
      connected: true,
      setGameStateWithColor: jest.fn(),
      sendMove: jest.fn(),
      startMouseTracking: jest.fn(),
      stopMouseTracking: jest.fn(),
      setGameState: jest.fn(),
      sendLastMove: jest.fn(),
      undo: jest.fn(),
    };
    (useChessSocket as jest.Mock).mockImplementation((props: any) => {
      socketCallbacks = props;
      return mockSocket;
    });
  });

  test("renders LessonOverlay with initial data", async () => {
    render(
      <MemoryRouter>
        <LessonOverlay />
      </MemoryRouter>
    );

    // Check loading popup appears initially (or mock resolves fast)
    // In useEffect, refreshProgress is called.

    await waitFor(() => {
      expect(screen.getByText(/Test Lesson Name/)).toBeInTheDocument();
    });

    const infoElements = screen.getAllByText("get a winning position");
    expect(infoElements.length).toBeGreaterThan(0);
    expect(screen.getByText("1 / 5: Test Lesson Name")).toBeInTheDocument();
    expect(screen.getByTestId("chess-board")).toBeInTheDocument();
    expect(screen.getByTestId("move-tracker")).toBeInTheDocument();
  });

  test("initializes lesson on server after delay", async () => {
    render(
      <MemoryRouter>
        <LessonOverlay />
      </MemoryRouter>
    );

    // Wait for useEffect timeout
    await waitFor(
      () => {
        expect(mockSocket.setGameStateWithColor).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    // Check arguments
    expect(mockSocket.setGameStateWithColor).toHaveBeenCalledWith(
      mockUseLessonManager.lessonData.startFen,
      "white", // derived from startFen
      mockUseLessonManager.lessonData.info
    );
  });

  test("handles navigation buttons", async () => {
    // Override mock to make Next button active (completedNum > lessonNum)
    (useLessonManager as jest.Mock).mockReturnValue({
      ...mockUseLessonManager,
      completedNum: 1, // lessonNum is 0, so 0 < 1, Next is active
    });

    const { unmount } = render(
      <MemoryRouter>
        <LessonOverlay />
      </MemoryRouter>
    );

    const nextButton = await screen.findByText("Next");
    const btn = nextButton.closest("button");

    // Ensure we are clicking the button
    if (btn) {
      fireEvent.click(btn);
    }
    expect(mockUseLessonManager.nextLesson).toHaveBeenCalled();

    unmount();

    // Test Back button
    // Override mock to make Back button active (lessonNum > 0)
    (useLessonManager as jest.Mock).mockReturnValue({
      ...mockUseLessonManager,
      lessonNum: 1,
      completedNum: 2,
    });

    render(
      <MemoryRouter>
        <LessonOverlay />
      </MemoryRouter>
    );

    const backButton = await screen.findByText("Back");
    const backBtn = backButton.closest("button");

    if (backBtn) {
      fireEvent.click(backBtn);
    }
    expect(mockUseLessonManager.prevLesson).toHaveBeenCalled();
  });

  test("handles lesson completion (success)", async () => {
    render(
      <MemoryRouter>
        <LessonOverlay />
      </MemoryRouter>
    );

    // Wait for initialization
    await waitFor(() => screen.getByText(/Test Lesson Name/));

    // Trigger onBoardStateChange with the end FEN
    act(() => {
      if (socketCallbacks.onBoardStateChange) {
        socketCallbacks.onBoardStateChange(
          mockUseLessonManager.lessonData.endFen,
          "white"
        );
      }
    });

    // Check if success popup appears
    expect(await screen.findByText(/Lesson completed/i)).toBeInTheDocument();

    // Click OK
    const okButton = screen.getByText("OK");
    fireEvent.click(okButton);

    expect(mockUseLessonManager.updateCompletion).toHaveBeenCalled();
  });

  test("handles reset button", async () => {
    render(
      <MemoryRouter>
        <LessonOverlay />
      </MemoryRouter>
    );

    const resetButton = await screen.findByTestId("reset-button");
    fireEvent.click(resetButton);

    expect(mockSocket.setGameState).toHaveBeenCalledWith(
      mockUseLessonManager.lessonData.startFen
    );
  });
});
