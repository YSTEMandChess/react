import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import AddChild from "./AddChild";

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  ) as jest.Mock;
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <AddChild />
    </MemoryRouter>
  );

test("renders the add a child form", () => {
  renderPage();

  expect(screen.getByRole("heading", { name: /Add a Child/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("First Name")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Last Name")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  expect(screen.getByLabelText(/Birthday/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Gender/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Grade Level")).toBeInTheDocument();
});

test("shows both add and cancel actions", () => {
  renderPage();
  expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
});
