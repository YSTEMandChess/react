import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { useNavigate } from 'react-router';
import SignUp from './SignUp'

// mock fetching from database
beforeEach(() => {
  global.fetch = jest.fn((url) => {
    // fetching students who don't have mentors yet
    if (url.includes('mentorless')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          "auser", // mock user names
          "aauser"
        ]), // completed just one lesson
      });
    }
    return Promise.reject(new Error('Unhandled fetch request: ' + url));
  }) as jest.Mock;
});

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
  await userEvent.type(firstName, 'firstname');

  // check for last names that include numbers
  const lastName = screen.getByPlaceholderText('Last name');
  await userEvent.type(lastName, '123');
  const lastNameError = await screen.findByText("Invalid Last Name")
  expect(lastNameError).toBeInTheDocument();
  await userEvent.type(lastName, 'lastname');

  // check for invalid emails
  const email = screen.getByPlaceholderText('Email');
  await userEvent.type(email, 'invalid@email');
  const emailError = await screen.findByText("Invalid Email")
  expect(emailError).toBeInTheDocument();
  await userEvent.type(email, 'valid@email.com');

  // check for usernames that are too long
  const username = screen.getByPlaceholderText('Username');
  await userEvent.type(username, '123456789012345');
  const usernameError = await screen.findByText("Invalid Username")
  expect(usernameError).toBeInTheDocument();
  await userEvent.type(username, 'username');

  // check for passwords that are too short
  const password = screen.getByPlaceholderText('Password');
  await userEvent.type(password, 'short');
  const passwordError = await screen.findByText("Password must be at least 8 characters")
  expect(passwordError).toBeInTheDocument();
  await userEvent.type(password, 'password');

  // check for passwords that are too short
  const retype = screen.getByPlaceholderText('Re-type password');
  await userEvent.type(retype, 'different');
  const retypeError = await screen.findByText("Passwords do not match")
  expect(retypeError).toBeInTheDocument();
  await userEvent.type(password, 'password');

  // when submitting without checking terms & conditions
  const submitBtn = screen.getByTestId('submit-btn');
  fireEvent.click(submitBtn);
  await screen.findByText("Please accept the terms and conditions.");
});

test("searching for student", async () => {
  render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>
  );

  // the search box for finding students to mentor
  const searchBox = screen.getByPlaceholderText("Find a student");
  expect(searchBox).toBeInTheDocument();

  // try searching for a student
  await userEvent.type(searchBox, "a");
  // checking if search results are displayed
  const searchResult1 = await screen.findByText("auser")
  expect(searchResult1).toBeInTheDocument();
  const searchResult2 = await screen.findByText("aauser")
  expect(searchResult2).toBeInTheDocument();
})

test("adding children", async () => {
  render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>
  );

  // select the parent account
  const selector = screen.getByTestId("account-selector");
  fireEvent.change(selector, { target: { value: 'parent' } });

  // create new student
  const createBtn = await screen.findByText("Create Student");
  fireEvent.click(createBtn);

  // delete new student
  const deleteBtn = await screen.findByText("Delete student");
  fireEvent.click(deleteBtn);
})