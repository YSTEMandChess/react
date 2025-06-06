import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Programs from "./Programs";
import { MemoryRouter } from "react-router";

test("renders Programs page", () => {
    const locationSpy = jest.spyOn(window.location, 'assign').mockImplementation(() => {});

    render(
        <MemoryRouter>
            <Programs />
        </MemoryRouter>
    );
  
    // Check if the Programs page is rendered
    const programsTitle = screen.getByTestId("programs-title");
    expect(programsTitle).toBeInTheDocument();

    const registerButton = screen.getByTestId("register-btn");
    expect(registerButton).toBeInTheDocument();
    fireEvent.click(registerButton);
    expect(locationSpy).toHaveBeenCalledWith("https://forms.gle/cvdJxrSRCg1kpWXP8");

    const subTermsLeft = screen.getByTestId("sub-terms-left");
    expect(subTermsLeft).toBeInTheDocument();
    expect(subTermsLeft.children[0]).toContain("First Month is Free");

    const subTermsRight = screen.getByTestId("sub-terms-right");
    expect(subTermsRight).toBeInTheDocument();
    expect(subTermsRight.children[0]).toContain("Can't afford to pay monthly? We'd still love to have your student join!");

});
