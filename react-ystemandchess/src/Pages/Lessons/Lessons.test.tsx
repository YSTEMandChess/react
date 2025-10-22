import React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import Lessons from "./Lessons";
import { MemoryRouter } from "react-router";

test("renders chess board with 64 squares", () => {
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );

  const chessBoard = screen.getByTestId("chessboard-L");
  expect(chessBoard).toBeInTheDocument();

  // Instead of chessBoard.children, use getAllByTestId for squares
  const squares = within(chessBoard).getAllByTestId(/square-/i);
  expect(squares.length).toBe(64);
});

test("renders scenario title", () => {
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );
  const scenarioTitle = screen.getByTestId("piece_description");
  expect(scenarioTitle).toBeInTheDocument();
  expect(scenarioTitle.textContent).toBeTruthy(); // not null/empty
});

// Drag and drop move test
test("simulates piece move and checks reset button", () => {
  render(
    <MemoryRouter>
      <Lessons testOverrides={{ highlightedSquares: ["2-0"] }} />
    </MemoryRouter>
  );

  const source = screen.getByTestId("piece-wP");
  const target = screen.getByTestId("square-2-0");

  const mockSetDragImage = jest.fn();
  const dataTransfer = {
    setData: jest.fn(),
    getData: jest.fn(),
    setDragImage: mockSetDragImage,
  };

  fireEvent.dragStart(source, { dataTransfer });
  fireEvent.dragOver(target, { dataTransfer });
  fireEvent.drop(target, { dataTransfer });

  expect(mockSetDragImage).toHaveBeenCalled();
  expect(within(target).getByTestId("piece-wP")).toBeInTheDocument();

  const resetButton = screen.getByTestId("reset-lesson");
  expect(resetButton).toBeInTheDocument();
  fireEvent.click(resetButton);

  expect(within(screen.getByTestId("square-3-0")).getByTestId("piece-wP")).toBeInTheDocument();
});

// Invalid move test
test("does not move when dragging a piece to an invalid square", () => {
  render(
    <MemoryRouter>
      <Lessons testOverrides={{ highlightedSquares: ["2-0"] }} />
    </MemoryRouter>
  );

  const source = screen.getByTestId("piece-wP");
  const invalidTarget = screen.getByTestId("square-2-1");

  const mockSetDragImage = jest.fn();
  const dataTransfer = {
    setData: jest.fn(),
    getData: jest.fn(),
    setDragImage: mockSetDragImage,
  };

  fireEvent.dragStart(source, { dataTransfer });
  fireEvent.dragOver(invalidTarget, { dataTransfer });
  fireEvent.drop(invalidTarget, { dataTransfer });

  expect(mockSetDragImage).toHaveBeenCalled();
  expect(within(screen.getByTestId("square-3-0")).getByTestId("piece-wP")).toBeInTheDocument();
});

// Next/back button tests
test("next button updates board and scenario title", () => {
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );

  const nextButton = screen.getByTestId("prevNextLessonButton");
  expect(nextButton).toBeInTheDocument();
  fireEvent.click(nextButton);

  const scenarioTitle = screen.getByTestId("piece_description");
  expect(scenarioTitle.textContent).toBe("Bishop - It moves diagonally ");

  expect(within(screen.getByTestId("square-6-6")).getByTestId("piece-wB")).toBeInTheDocument();
});

test("back button reverts the next button action", () => {
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );

  const nextButton = screen.getByTestId("prevNextLessonButton");
  const backButton = screen.getByTestId("backLessonButton");
  expect(backButton).toBeInTheDocument();

  fireEvent.click(nextButton);
  fireEvent.click(backButton);

  const scenarioTitle = screen.getByTestId("piece_description");
  expect(scenarioTitle.textContent).toBe("Pawn - It moves forward only");

  expect(within(screen.getByTestId("square-3-0")).getByTestId("piece-wP")).toBeInTheDocument();
});

// Lesson buttons click
test("renders and reacts to lesson button clicks", () => {
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );

  const lessonButtons = screen.getAllByTestId("lesson-button");
  expect(lessonButtons.length).toBeGreaterThan(0);

  for (const lessonButton of lessonButtons) {
    fireEvent.click(lessonButton);

    const scenarioTitle = screen.getByTestId("subheading");
    expect(scenarioTitle.textContent).toBe(lessonButton.textContent);
  }
});
