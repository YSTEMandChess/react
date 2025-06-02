import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResetPassword from './reset-password';  // Assuming ResetPassword is a React component
import { MemoryRouter } from 'react-router';

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

// test('shows error message on invalid username', () => {
//   render(
//     <MemoryRouter>
//       <ResetPassword />
//     </MemoryRouter>
//     );
//   const usernameInput = screen.getByPlaceholderText('UserName');
//   fireEvent.blur(usernameInput, { target: { value: 'ab' } });
//   const errorMessage = screen.getByText('Invalid username');
//   expect(errorMessage).toBeInTheDocument();
// });

// test('shows error message on invalid email', () => {
//   render(
//     <MemoryRouter>
//       <ResetPassword />
//     </MemoryRouter>
//     );
//   const emailInput = screen.getByPlaceholderText('Email');
//   fireEvent.blur(emailInput, { target: { value: 'invalidemail' } });
//   const errorMessage = screen.getByText('Invalid Email');
//   expect(errorMessage).toBeInTheDocument();
// });

// test('verifies user input', () => {
//   render(
//     <MemoryRouter>
//       <ResetPassword />
//     </MemoryRouter>
//     );
//   const usernameInput = screen.getByPlaceholderText('UserName');
//   const emailInput = screen.getByPlaceholderText('Email');
//   fireEvent.blur(usernameInput, { target: { value: 'validusername' } });
//   fireEvent.blur(emailInput, { target: { value: 'validemail@example.com' } });
//   const button = screen.getByText('Enter');
//   fireEvent.click(button);
// });
