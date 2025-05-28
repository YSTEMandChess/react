import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResetPassword from './reset-password';  // Assuming ResetPassword is a React component
import '@testing-library/jest-dom';

test('renders reset password component', () => {
  render(<ResetPassword />);
  const heading = screen.getByText(
    /Please Enter UserName and Email To Reset Your Password/i
  );
  expect(heading).toBeInTheDocument();
});

test('shows error message on invalid username', () => {
  render(<ResetPassword />);
  const usernameInput = screen.getByPlaceholderText('UserName');
  fireEvent.blur(usernameInput, { target: { value: 'ab' } });
  const errorMessage = screen.getByText('Invalid username');
  expect(errorMessage).toBeInTheDocument();
});

test('shows error message on invalid email', () => {
  render(<ResetPassword />);
  const emailInput = screen.getByPlaceholderText('Email');
  fireEvent.blur(emailInput, { target: { value: 'invalidemail' } });
  const errorMessage = screen.getByText('Invalid Email');
  expect(errorMessage).toBeInTheDocument();
});

test('verifies user input', () => {
  render(<ResetPassword />);
  const usernameInput = screen.getByPlaceholderText('UserName');
  const emailInput = screen.getByPlaceholderText('Email');
  fireEvent.blur(usernameInput, { target: { value: 'validusername' } });
  fireEvent.blur(emailInput, { target: { value: 'validemail@example.com' } });
  const button = screen.getByText('Enter');
  fireEvent.click(button);
});
