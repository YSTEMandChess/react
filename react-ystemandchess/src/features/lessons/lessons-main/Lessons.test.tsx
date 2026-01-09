import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Lessons from "./Lessons";
import { MemoryRouter } from "react-router";
import * as Scenarios from "./Scenarios";
import * as ReactRouter from "react-router";

// Mock the Scenarios module
jest.mock("./Scenarios", () => ({
  getScenario: jest.fn(),
  getScenarioByName: jest.fn(),
}));

// Mock react-router's useLocation
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: jest.fn(),
}));

// Mock SVGs
jest.mock("./icon_redo.svg", () => ({
  ReactComponent: () => <svg data-testid="icon-redo" />,
}));
jest.mock("./icon_back.svg", () => ({
  ReactComponent: () => <svg data-testid="icon-back" />,
}));
jest.mock("./icon_back_inactive.svg", () => ({
  ReactComponent: () => <svg data-testid="icon-back-inactive" />,
}));
jest.mock("./icon_next.svg", () => ({
  ReactComponent: () => <svg data-testid="icon-next" />,
}));
jest.mock("./icon_next_inactive.svg", () => ({
  ReactComponent: () => <svg data-testid="icon-next-inactive" />,
}));

// Mock PromotionPopup
jest.mock("./PromotionPopup", () => () => (
  <div data-testid="promotion-popup" />
));

describe("Lessons Component", () => {
  const mockBoard = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
  // Place a white pawn at a2 (6, 0) for interaction tests
  const interactiveBoard = JSON.parse(JSON.stringify(mockBoard));
  interactiveBoard[6][0] = "wP";

  const mockScenario1 = {
    name: "Scenario 1",
    subSections: [
      {
        name: "Lesson 1.1",
        info: "Info 1.1",
        board: interactiveBoard,
        left_ended: true,
        right_ended: false,
      },
      {
        name: "Lesson 1.2",
        info: "Info 1.2",
        board: mockBoard,
        left_ended: true,
        right_ended: false,
      },
    ],
  };

  const mockScenario2 = {
    name: "Scenario 2",
    subSections: [
      {
        name: "Lesson 2.1",
        info: "Info 2.1",
        board: mockBoard,
        left_ended: false,
        right_ended: true,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ReactRouter.useLocation as jest.Mock).mockReturnValue({ state: null });

    // Default mock implementation for getScenario
    (Scenarios.getScenario as jest.Mock).mockImplementation((index) => {
      if (index === 0) return mockScenario1;
      if (index === 1) return mockScenario2;
      return mockScenario1;
    });
  });

  test("renders Lessons component with default scenario", () => {
    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    expect(screen.getByTestId("piece_description")).toHaveTextContent(
      "Scenario 1"
    );
    expect(screen.getByTestId("subheading")).toHaveTextContent("Lesson 1.1");
    expect(screen.getByTestId("lesson-description")).toHaveTextContent(
      "Info 1.1"
    );
    expect(screen.getByTestId("chessboard-L")).toBeInTheDocument();
  });

  test("renders correct lesson buttons", () => {
    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    const buttons = screen.getAllByTestId("lesson-button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("Lesson 1.1");
    expect(buttons[1]).toHaveTextContent("Lesson 1.2");
  });

  test("navigates to next lesson within scenario", async () => {
    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    // Click on the second lesson button
    const buttons = screen.getAllByTestId("lesson-button");
    fireEvent.click(buttons[1]);

    expect(screen.getByTestId("subheading")).toHaveTextContent("Lesson 1.2");
    expect(screen.getByTestId("lesson-description")).toHaveTextContent(
      "Info 1.2"
    );
  });

  test("navigates to next scenario using Next button", () => {
    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    const nextButton = screen.getByTestId("prevNextLessonButton");
    fireEvent.click(nextButton);

    // Should switch to Scenario 2
    expect(screen.getByTestId("piece_description")).toHaveTextContent(
      "Scenario 2"
    );
    expect(screen.getByTestId("subheading")).toHaveTextContent("Lesson 2.1");
  });

  test("navigates to previous scenario using Back button", () => {
    // Start at Scenario 2
    (Scenarios.getScenario as jest.Mock).mockImplementation((index) => {
      // Mocking behavior where we start at index 1 conceptually
      // But the component starts at index 0 ref.
      // We need to simulate the state where we are at Scenario 2.
      // However, the component initializes `counterRef` to 0.
      // So we can simulate navigating forward then backward.
      if (index === 0) return mockScenario1;
      if (index === 1) return mockScenario2;
      return mockScenario1;
    });

    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    // Move to Scenario 2
    const nextButton = screen.getByTestId("prevNextLessonButton");
    fireEvent.click(nextButton);
    expect(screen.getByTestId("piece_description")).toHaveTextContent(
      "Scenario 2"
    );

    // Move back to Scenario 1
    const backButton = screen.getByTestId("backLessonButton");
    fireEvent.click(backButton);
    expect(screen.getByTestId("piece_description")).toHaveTextContent(
      "Scenario 1"
    );
  });

  test("initializes with passed location state", () => {
    (ReactRouter.useLocation as jest.Mock).mockReturnValue({
      state: { piece: "Scenario 2", lessonNum: 0 },
    });
    (Scenarios.getScenarioByName as jest.Mock).mockReturnValue(mockScenario2);

    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    expect(Scenarios.getScenarioByName).toHaveBeenCalledWith("Scenario 2");
    expect(screen.getByTestId("piece_description")).toHaveTextContent(
      "Scenario 2"
    );
  });

  test("handles reset board", () => {
    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    const resetButton = screen.getByTestId("reset-lesson");
    fireEvent.click(resetButton);

    // Since we can't easily check internal state, we ensure no crash and elements persist
    expect(screen.getByTestId("chessboard-L")).toBeInTheDocument();
  });

  test("highlights squares on piece hover", () => {
    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    // Hover over the pawn at 6-0
    const squareKey = "6-0";
    const square = screen.getByTestId(`square-${squareKey}`);

    fireEvent.mouseEnter(square);

    // Check if highlight style is applied (brightness(80%))
    // Note: The component applies style inline.
    // We expect the square itself or possible moves to be highlighted.
    // For a pawn at 6-0 (white), it moves to 5-0 and 4-0.
    const moveSquare1 = screen.getByTestId("square-5-0");
    const moveSquare2 = screen.getByTestId("square-4-0");

    expect(moveSquare1).toHaveStyle("filter: brightness(80%)");
    expect(moveSquare2).toHaveStyle("filter: brightness(80%)");
  });

  test("handles invalid location state gracefully", () => {
    (ReactRouter.useLocation as jest.Mock).mockReturnValue({
      state: { piece: "NonExistent", lessonNum: 0 },
    });
    (Scenarios.getScenarioByName as jest.Mock).mockReturnValue(undefined);

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <MemoryRouter>
        <Lessons />
      </MemoryRouter>
    );

    expect(Scenarios.getScenario).toHaveBeenCalledWith(0); // Fallback to default
    expect(screen.getByTestId("piece_description")).toHaveTextContent(
      "Scenario 1"
    );

    consoleErrorSpy.mockRestore();
  });
});
