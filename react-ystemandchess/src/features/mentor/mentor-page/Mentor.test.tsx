import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import Mentor from './Mentor';

// check if the heading is rendered
it("renders the heading", () => {
    render(
        <MemoryRouter>
            <Mentor/>
        </MemoryRouter>
    );
    expect(screen.getByText(/Become a Mentor/i)).toBeInTheDocument();
    expect(screen.getByText(/Your time and talent can make a real difference in people's lives./i)).toBeInTheDocument();
});

