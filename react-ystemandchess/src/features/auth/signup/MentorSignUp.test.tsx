import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import MentorSignUp from "./MentorSignUp";

const renderPage = () =>
  render(
    <MemoryRouter>
      <MentorSignUp />
    </MemoryRouter>
  );

test("renders the mentor sign up form", () => {
  renderPage();

  expect(screen.getByRole("heading", { name: /Mentor Sign Up/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Create a password")).toBeInTheDocument();
  expect(screen.getByLabelText(/Current Occupation \/ Education/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
});

test("does not show the account type selector", () => {
  renderPage();
  expect(screen.queryByText("Account Type")).not.toBeInTheDocument();
});

test("keeps the find a student field but disables it", () => {
  renderPage();
  const menteeField = screen.getByPlaceholderText("Available after signup");
  expect(menteeField).toBeInTheDocument();
  expect(menteeField).toBeDisabled();
});
