import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Programs } from "./Programs";
import { MemoryRouter } from "react-router";
// Test that the Programs page renders without crashing
test("renders Programs page", () => {
    render(
        <MemoryRouter>
            <Programs />
        </MemoryRouter>
    );
});

// Test that the Programs title is present
test("displays the Programs page title", () => {
    render(
        <MemoryRouter>
            <Programs />
        </MemoryRouter>
    );
    const programsTitle = screen.getByTestId("programs-title");
    expect(programsTitle).toBeInTheDocument();
});

// Test that the apply now buttons are present
test("shows the apply now buttons", () => {
    render(
        <MemoryRouter>
            <Programs />
        </MemoryRouter>
    );
    const applyButtons = screen.getAllByText("Apply Now!");
    expect(applyButtons.length).toBeGreaterThan(0);
});

// Test that the donate button is present
test("shows the donate button", () => {
    render(
        <MemoryRouter>
            <Programs />
        </MemoryRouter>
    );
    const donateButton = screen.getByText("Donate Now!");
    expect(donateButton).toBeInTheDocument();
});

// Test that the free card terms are displayed correctly
test("shows the free card terms", () => {
    render(
        <MemoryRouter>
            <Programs />
        </MemoryRouter>
    );
    const freeCard = screen.getByText("Free");
    expect(freeCard).toBeInTheDocument();
});

// Test that the premium card terms are displayed correctly
test("shows the premium card terms", () => {
    render(
        <MemoryRouter>
            <Programs />
        </MemoryRouter>
    );
    const premiumCard = screen.getByText("Premium");
    expect(premiumCard).toBeInTheDocument();
});
