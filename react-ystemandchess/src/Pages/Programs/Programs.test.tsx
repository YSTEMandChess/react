import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import Programs from './Programs';

// check if the heading is rendered
it("renders the heading", () => {
    render(
        <MemoryRouter>
            <Programs/>
        </MemoryRouter>
    );
    expect(screen.getByText(/Our Programs/i)).toBeInTheDocument();
    expect(screen.getByText(/Become a member today to benefit your child and all other children participating in our program!/i)).toBeInTheDocument();
});
