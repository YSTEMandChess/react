import React,{act} from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SetPassword from './set-password';
import { MemoryRouter } from 'react-router';
import * as router from 'react-router';
import userEvent from '@testing-library/user-event';

// mock the navigation & location for react-router imports
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
  useNavigate: jest.fn()
}));

// missing token in parameter
test('invalid parameters', () => {
    (router.useLocation as jest.Mock).mockReturnValue({
        search: '', // no token parameters
    });
    render(
        <MemoryRouter>
            <SetPassword />
        </MemoryRouter>
        );

    // correctly renders warning
    const invalid = screen.getByText(
        "Invalid reset link. Please request a new password reset."
    );
    expect(invalid).toBeInTheDocument();
});

// has valid token, password does not match
test('password does not match', async () => {
    (router.useLocation as jest.Mock).mockReturnValue({
        search: '?token=test-token', // mock token parameter
    });
    render(
        <MemoryRouter>
        <SetPassword />
        </MemoryRouter>
    );
    // correctly renders password fields
    const pwText = screen.getByText("New Password");
    expect(pwText).toBeInTheDocument();

    // enter new password
    const newField = screen.getByTestId("password")
    expect(newField).toBeInTheDocument();
    await userEvent.type(newField, "password");
    // confirm but with different password
    const confirmField = screen.getByTestId("confirmPassword")
    expect(confirmField).toBeInTheDocument();
    await userEvent.type(confirmField, "donotmatch");

    // try changing the password
    const setBtn = screen.getByTestId("setBtn");
    expect(setBtn).toBeInTheDocument();
    await act(async () => {
        fireEvent.click(setBtn);
    })
    // 
    const noMatchText = screen.getByText("Passwords do not match");
    expect(noMatchText).toBeInTheDocument();
});

// has valid token, password too short
test('password does not match', async () => {
    (router.useLocation as jest.Mock).mockReturnValue({
        search: '?token=test-token', // mock token parameter
    });
    render(
        <MemoryRouter>
        <SetPassword />
        </MemoryRouter>
    );

    // enter new password, but too short
    const newField = screen.getByTestId("password")
    await userEvent.type(newField, "pw");
    // confirm with same password
    const confirmField = screen.getByTestId("confirmPassword")
    await userEvent.type(confirmField, "pw");

    // try changing the password
    const setBtn = screen.getByTestId("setBtn");
    await act(async () => {
        fireEvent.click(setBtn);
    })
    // shows password too short error
    const noMatchText = screen.getByText("Password must be at least 8 characters long");
    expect(noMatchText).toBeInTheDocument();
});

// failed to update password
test('successfully updated', async () => {
    (router.useLocation as jest.Mock).mockReturnValue({
        search: '?token=test-token', // mock token parameter
    });
    render(
        <MemoryRouter>
            <SetPassword />
        </MemoryRouter>
    );

    // mock failed fetching
    global.fetch = jest.fn((url) => {
        return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: 'Failed to update password' }), // error message
        })
    }) as jest.Mock
    
    // enter new password
    const newField = screen.getByTestId("password")
    await userEvent.type(newField, "password");
    // confirm with same password
    const confirmField = screen.getByTestId("confirmPassword")
    await userEvent.type(confirmField, "password");

    // try changing the password
    const setBtn = screen.getByTestId("setBtn");
    await act(async () => {
        fireEvent.click(setBtn);
    })

    // check if there is a fail text
    const failedText = screen.getByText("Failed to update password")
    expect(failedText).toBeInTheDocument();
});

// has valid token, password successfully updated
test('successfully updated', async () => {
    (router.useLocation as jest.Mock).mockReturnValue({
        search: '?token=test-token', // mock token parameter
    });
    render(
        <MemoryRouter>
        <SetPassword />
        </MemoryRouter>
    );

    // mock successful fetching
    global.fetch = jest.fn((url) => {
        return Promise.resolve({
            ok: true,
        })
    }) as jest.Mock
    
    // enter new password
    const newField = screen.getByTestId("password")
    await userEvent.type(newField, "password");
    // confirm with same password
    const confirmField = screen.getByTestId("confirmPassword")
    await userEvent.type(confirmField, "password");

    // try changing the password
    const setBtn = screen.getByTestId("setBtn");
    await act(async () => {
        fireEvent.click(setBtn);
    })
});