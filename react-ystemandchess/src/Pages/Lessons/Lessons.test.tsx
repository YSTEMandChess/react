import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Lessons from "./Lessons";
import { MemoryRouter } from "react-router"; 
import { mock } from "node:test";


test("renders lessons button", () => {
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );
  const heading = screen.getByText("Lessons");
  expect(heading).toBeInTheDocument();
});

test("renders play button", () => { 
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );
  const playButton = screen.getByText("Play");
  expect(playButton).toBeInTheDocument();
});

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
  render(
    <MemoryRouter>
      <Lessons testOverrides={{highlightedSquares: ["2-0"]}} />
    </MemoryRouter>
  );

  const chessBoard = screen.getByTestId("chessboard-L");

  const source = screen.getByTestId("piece-wP"); // Assuming the piece is on square 0,0
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

  expect(mockSetDragImage).toHaveBeenCalled(); // Check if setDragImage was called

  expect(target.querySelector(".piece-image")).toBeTruthy(); // Check if the target has the piece image class

  const resetButton = screen.getByTestId("reset-lesson");
  expect(resetButton).toBeInTheDocument();
  fireEvent.click(resetButton);

  expect(screen.getByTestId("square-3-0").querySelector(".piece-image")).toBeTruthy(); // Check if the piece is back to the source square
});


