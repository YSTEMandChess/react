import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import AboutUs from './AboutUs';

// check if all subheadings have been rendered
it("renders the heading", () => {
    render(
        <MemoryRouter>
            <AboutUs/>
        </MemoryRouter>
    );
    expect(screen.getByText(/About Us/i)).toBeInTheDocument();
    expect(screen.getByText(/What We Offer/i)).toBeInTheDocument();
    expect(screen.getByText(/Our Current Status/i)).toBeInTheDocument();
});

