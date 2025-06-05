import React,{act} from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SetPassword from './set-password';
import { MemoryRouter } from 'react-router';

// missing token in parameter
test('invalid parameters', () => {
    render(
        <MemoryRouter>
            <SetPassword />
        </MemoryRouter>
        );
    const invalid = screen.getByText(
        "Invalid reset link. Please request a new password reset."
    );
    expect(invalid).toBeInTheDocument();
});