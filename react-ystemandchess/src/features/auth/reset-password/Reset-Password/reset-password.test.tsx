import React,{act} from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPassword from './reset-password';  // Assuming ResetPassword is a React component
import { MemoryRouter } from 'react-router';

// correctly renders component
test('renders reset password component', () => {
  render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
    );
  const heading = screen.getAllByText(
    "Reset Password"
  );
  for (const h of heading) {
    expect(h).toBeInTheDocument();
  }
});

// failed verfication
test('failed verification', async () => {
  render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
    );

  // mock failed fetching
  global.fetch = jest.fn((url) => {
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ message: 'Error requesting password reset' }), // failure message
    })
  }) as jest.Mock

  // input username & email
  const usernameInput = screen.getByPlaceholderText('UserName');
  const emailInput = screen.getByPlaceholderText('Email');
  fireEvent.blur(usernameInput, { target: { value: 'validusername' } });
  fireEvent.blur(emailInput, { target: { value: 'validemail@example.com' } });

  // submit credentials
  const button = screen.getByTestId('reset-submit');
  await act(async () => {
    fireEvent.click(button);
  })

  // check that error text is displayed
  const errorText = screen.getByText('Error requesting password reset');
  expect(errorText).toBeInTheDocument();
});

// mock network error
test('network error', async () => {
  render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
    );

  // mock failed fetching
  global.fetch = jest.fn((url) => {
    return Promise.reject(new Error('Network error'))
  }) as jest.Mock

  // input username & email
  const usernameInput = screen.getByPlaceholderText('UserName');
  const emailInput = screen.getByPlaceholderText('Email');
  fireEvent.blur(usernameInput, { target: { value: 'validusername' } });
  fireEvent.blur(emailInput, { target: { value: 'validemail@example.com' } });

  // submit credentials
  const button = screen.getByTestId('reset-submit');
  await act(async () => {
    fireEvent.click(button);
  })

  // check that error text is displayed
  const errorText = screen.getByText('Error connecting to server. Please try again.');
  expect(errorText).toBeInTheDocument();
});

// successful verfication
test('successful verification', async () => {
  render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
    );

  // mock successful fetching
  global.fetch = jest.fn((url) => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ token: 'test-token' }), // a fake token
    })
  }) as jest.Mock

  // input username & email
  const usernameInput = screen.getByPlaceholderText('UserName');
  const emailInput = screen.getByPlaceholderText('Email');
  fireEvent.blur(usernameInput, { target: { value: 'validusername' } });
  fireEvent.blur(emailInput, { target: { value: 'validemail@example.com' } });

  // submit credentials
  const button = screen.getByTestId('reset-submit');
  await act(async () => {
    fireEvent.click(button);
  })
});