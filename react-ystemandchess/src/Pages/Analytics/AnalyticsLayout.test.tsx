import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AnalyticsLayout from "./AnalyticsLayout";

jest.mock("../../environments/environment", () => ({
  environment: { urls: { middlewareURL: "http://mockurl.com" } },
}));

jest.mock("react-cookie", () => ({
  useCookies: () => [{ login: "mock-jwt-token" }, jest.fn(), jest.fn()],
}));

describe("AnalyticsLayout", () => {
  it("renders three tabs: Individual, Zipcode, Global", () => {
    render(<AnalyticsLayout />);
    expect(screen.getByRole("tab", { name: /Individual/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Zipcode/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Global/i })).toBeInTheDocument();
  });

  it("defaults to Individual tab selected", () => {
    render(<AnalyticsLayout />);
    expect(screen.getByRole("tab", { name: /Individual/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: /Zipcode/i })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("switches selection when a tab is clicked", () => {
    render(<AnalyticsLayout />);
    fireEvent.click(screen.getByRole("tab", { name: /Global/i }));
    expect(screen.getByRole("tab", { name: /Global/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: /Individual/i })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("renders the date-range prompt before dates are picked", () => {
    render(<AnalyticsLayout />);
    expect(
      screen.getByText(/Select a start and end date to load analytics/i)
    ).toBeInTheDocument();
  });

  it("loads mock data once start and end dates are set", async () => {
    const { container } = render(<AnalyticsLayout />);
    const startInput = container.querySelector(
      'input[type="date"]:nth-of-type(1)'
    ) as HTMLInputElement;
    const endInput = container.querySelectorAll(
      'input[type="date"]'
    )[1] as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: "2026-05-01" } });
    fireEvent.change(endInput, { target: { value: "2026-05-04" } });

    // Loading indicator first
    await waitFor(() =>
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    );

    // Mock data renders inside the <pre> as JSON
    const panel = screen.getByRole("tabpanel");
    expect(panel.textContent).toMatch(/active_users/);
  });
});
