import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import Home from "./Home";

// mock navigation function
const mockedNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockedNavigate,
}));

// check if the heading is rendered
it("renders the heading", () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
  expect(screen.getByText(/Helping your child develop/i)).toBeInTheDocument();
});

// check if join & subscribe subsections are rendered
it("renders join & subscribe", () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
  expect(
    screen.getByText(/Everyone is included. Everyone is welcome./i)
  ).toBeInTheDocument();
  expect(screen.getByText(/Start now and sign up later!/i)).toBeInTheDocument();
});

// checks correct navigation
it("navigates to the lessons page when Get Started is clicked", () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
  // click on lesson start buttin
  fireEvent.click(screen.getByText("Get Started!"));
  // check if the page goes to /lessons
  expect(mockedNavigate).toHaveBeenCalledWith("./lessons");
});

// check if books are being rendered
it("renders both book titles", () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
  expect(screen.getByText(/Books by Devin Nakano/i)).toBeInTheDocument();
  expect(
    screen.getByText(/How to Start a Tech-Based Nonprofit/i)
  ).toBeInTheDocument();
  expect(screen.getByText(/The Zero Dollar Workforce/i)).toBeInTheDocument();
});
