import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Programs from "./Programs";
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

// Test that the register button is present
test("shows the register button", () => {
    render(
        <MemoryRouter>
            <Programs />
        </MemoryRouter>
    );
    const registerButton = screen.getByTestId("register-btn-link");
    expect(registerButton).toBeInTheDocument();
});

// Test that the register link inside the button is present
test("shows the register button link", () => {
    render(
        <MemoryRouter>
            <Programs />
        </MemoryRouter>
    );
    const registerLink = screen.getByTestId("register-btn-link");
    expect(registerLink).toBeInTheDocument();
});

// Test that the left subscription terms are displayed correctly
test("shows the left subscription terms", () => {
    render(
        <MemoryRouter>
            <Programs />
        </MemoryRouter>
    );
    const subTermsLeft = screen.getByTestId("sub-terms-left");
    expect(subTermsLeft).toBeInTheDocument();
    // Check the text content of the left subscription terms
    expect(subTermsLeft.children[0].textContent).toBe("First Month is Free  Cancel anytime");
});

// Test that the right subscription terms are displayed correctly
test("shows the right subscription terms", () => {
    render(
        <MemoryRouter>
            <Programs />
        </MemoryRouter>
    );
    const subTermsRight = screen.getByTestId("sub-terms-right");
    expect(subTermsRight).toBeInTheDocument();
    // Check the text content of the right subscription terms
    expect(subTermsRight.children[0].textContent).toBe("Can't afford to pay monthly? We'd still love to have your student join!");
});
