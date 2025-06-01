import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Lessons from "./Lessons";
import { MemoryRouter } from "react-router"; 


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


