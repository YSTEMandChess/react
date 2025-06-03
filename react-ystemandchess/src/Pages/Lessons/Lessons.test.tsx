import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Lessons from "./Lessons";
import { MemoryRouter } from "react-router"; 
import { mock } from "node:test";

test("renders chess board", () => {
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );
  const chessBoard = screen.getByTestId("chessboard-L"); // get the chessboard by its test ID
  expect(chessBoard).toBeInTheDocument(); // Check if the chessboard is rendered
  const chessSquares = chessBoard.children; // Get all the squares in the chessboard
  expect(chessSquares.length).toBe(64); // checking if the chessboard renders all 64 squares
});

test("renders scenarion title", () => {
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );
  const scenarioTitle = screen.getByTestId("piece_description");
  // Check if the scenario title is correctly displayed
  expect(scenarioTitle).toBeInTheDocument();
  expect(scenarioTitle.textContent).not.toBeNull(); // Ensure the text content is not null
  expect(scenarioTitle.textContent).not.toBe(""); // Ensure the text content is not empty
});

test("simulates peice move and checks reset button", () => { 
  // Render the Lessons component with a highlighted square for testing
  render(
    <MemoryRouter>
      <Lessons testOverrides={{ highlightedSquares: ["2-0"] }} />
    </MemoryRouter>
  );

  // Get the draggable piece and the target square
  const source = screen.getByTestId("piece-wP");
  const target = screen.getByTestId("square-2-0");

  // Mock the setDragImage function for drag-and-drop
  const mockSetDragImage = jest.fn();
  const dataTransfer = {
    setData: jest.fn(),
    getData: jest.fn(),
    setDragImage: mockSetDragImage,
  };

  // Simulate dragging the piece to the target square
  fireEvent.dragStart(source, { dataTransfer });
  fireEvent.dragOver(target, { dataTransfer });
  fireEvent.drop(target, { dataTransfer });

  // Verify that setDragImage was called during drag
  expect(mockSetDragImage).toHaveBeenCalled();

  // Check if the piece image is present in the target square after drop
  expect(target.querySelector(".piece-image")).toBeTruthy();

  // Find and click the reset button
  const resetButton = screen.getByTestId("reset-lesson");
  expect(resetButton).toBeInTheDocument();
  fireEvent.click(resetButton);

  // After reset, check if the piece is back to its original square
  expect(screen.getByTestId("square-3-0").querySelector(".piece-image")).toBeTruthy();
});

test("does not move when dragging a piece to an invalid square", () => {
  // Render the Lessons component with a highlighted square for testing
  render(
    <MemoryRouter>
      <Lessons testOverrides={{ highlightedSquares: ["2-0"] }} />
    </MemoryRouter>
  );

  // Get the draggable piece and an invalid target square
  const source = screen.getByTestId("piece-wP");
  const invalidTarget = screen.getByTestId("square-2-1");

  // Mock the setDragImage function for drag-and-drop
  const mockSetDragImage = jest.fn();
  const dataTransfer = {
    setData: jest.fn(),
    getData: jest.fn(),
    setDragImage: mockSetDragImage,
  };

  // Simulate dragging the piece to the invalid target square
  fireEvent.dragStart(source, { dataTransfer });
  fireEvent.dragOver(invalidTarget, { dataTransfer });
  fireEvent.drop(invalidTarget, { dataTransfer });

  // Verify that setDragImage was called during drag
  expect(mockSetDragImage).toHaveBeenCalled();

  // Check if the piece image is still in its original square after attempting to drop on an invalid square
  expect(screen.getByTestId("square-3-0").querySelector(".piece-image")).toBeTruthy();
});

test("next button updates board and scenario title", () => {
  // Render the Lessons component
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );

  // Get the next button
  const nextButton = screen.getByTestId("prevNextLessonButton");
  expect(nextButton).toBeInTheDocument();

  // Click the next button
  fireEvent.click(nextButton);

  // Check if the scenario title has been updated
  const scenarioTitle = screen.getByTestId("piece_description");
  expect(scenarioTitle.textContent).toBe("Bishop - It moves diagonally "); // Ensure the text content is not empty

  // Check if the chessboard has been updated by verifying the presence of the bishop in the 6 6 position
  expect(screen.getByTestId("square-6-6").querySelector(".piece-image")).toBeTruthy();
});

test("back button reverts the next button action", () => {
  // Render the Lessons component
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );

  // Get the next button and click it to change the scenario
  const nextButton = screen.getByTestId("prevNextLessonButton");

  // Get the back button
  const backButton = screen.getByTestId("backLessonButton");
  expect(backButton).toBeInTheDocument();

  // Click the next button
  fireEvent.click(nextButton);

  // Click the back button
  fireEvent.click(backButton);

  // Check if the scenario title has reverted to the original state
  const scenarioTitle = screen.getByTestId("piece_description");
  expect(scenarioTitle.textContent).toBe("Pawn - It moves forward only");

  // Check if the chessboard has reverted by verifying the presence of the pawn in the original position
  expect(screen.getByTestId("square-3-0").querySelector(".piece-image")).toBeTruthy();
});


