import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { useNavigate } from 'react-router';
import SignUp from './SignUp'

test("renders sign up page", () => {
  render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>
  );
  
  // Check if the sign up title is present
  const title = screen.getByTestId("title");
  expect(title).toBeInTheDocument();

  // Check if all the fields are present
  const formFields = screen.getByTestId("form-fields");
  expect(formFields).toBeInTheDocument();
  const accountType = screen.getByTestId("account-type");
  expect(accountType).toBeInTheDocument();
  const terms = screen.getByTestId("terms");
  expect(terms).toBeInTheDocument();

  // Check if submission button is present
  const submitBtn = screen.getByTestId("submit-btn");
  expect(submitBtn).toBeInTheDocument();
});

test("field text validation", async () => {
  render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>
  );
  
  // check for first names that are too short
  const firstName = screen.getByPlaceholderText('First name');
  await userEvent.type(firstName, 'f');
  const firstNameError = await screen.findByText("Invalid First Name")
  expect(firstNameError).toBeInTheDocument();

  // check for last names that include numbers
  const lastName = screen.getByPlaceholderText('Last name');
  await userEvent.type(lastName, '123');
  const lastNameError = await screen.findByText("Invalid Last Name")
  expect(lastNameError).toBeInTheDocument();

  // check for invalid emails
  const email = screen.getByPlaceholderText('Email');
  await userEvent.type(email, 'invalid@email');
  const emailError = await screen.findByText("Invalid Email")
  expect(emailError).toBeInTheDocument();

  // check for usernames that are too long
  const username = screen.getByPlaceholderText('Username');
  await userEvent.type(username, '123456789012345');
  const usernameError = await screen.findByText("Invalid Username")
  expect(usernameError).toBeInTheDocument();

  // check for passwords that are too short
  const password = screen.getByPlaceholderText('Password');
  await userEvent.type(password, 'short');
  const passwordError = await screen.findByText("Password must be at least 8 characters")
  expect(passwordError).toBeInTheDocument();

    // check for passwords that are too short
  const retype = screen.getByPlaceholderText('Re-type password');
  await userEvent.type(retype, 'different');
  const retypeError = await screen.findByText("Passwords do not match")
  expect(retypeError).toBeInTheDocument();
});