import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { CookiesProvider } from "react-cookie";
import AnalyticsLayout from "./AnalyticsLayout";

// Mock environment
jest.mock("../../environments/environment", () => ({
  environment: {
    urls: {
      middlewareURL: "http://mock-api.com",
    },
  },
}));

// Mock useCookies — match the jest.requireActual + spread pattern used in admin.test.tsx
jest.mock("react-cookie", () => {
  const actual = jest.requireActual("react-cookie");
  return {
    ...actual,
    useCookies: () => [{ login: "mock-jwt-token" }, jest.fn(), jest.fn()],
  };
});

const renderLayout = () =>
  render(
    <MemoryRouter>
      <CookiesProvider>
        <AnalyticsLayout />
      </CookiesProvider>
    </MemoryRouter>
  );

describe("AnalyticsLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // mock fetch — the hook should NOT call this while USE_MOCK is true
    global.fetch = jest.fn(() =>
      Promise.reject("fetch should not be called in mock mode")
    ) as jest.Mock;
  });

  it("renders three tabs: Individual, Zipcode, Global", () => {
    renderLayout();
    expect(screen.getByRole("tab", { name: /Individual/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Zipcode/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Global/i })).toBeInTheDocument();
  });

  it("defaults to Individual tab selected", () => {
    renderLayout();
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
    renderLayout();
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
    renderLayout();
    expect(
      screen.getByText(/Select a start and end date to load analytics/i)
    ).toBeInTheDocument();
  });

  it("loads mock data once start and end dates are set", async () => {
    renderLayout();
    const startInput = screen.getByLabelText(/Start date/i) as HTMLInputElement;
    const endInput = screen.getByLabelText(/End date/i) as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: "2026-05-01" } });
    fireEvent.change(endInput, { target: { value: "2026-05-04" } });

    await waitFor(() =>
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    );

    // IndividualView renders the mock student list once dates are set.
    const panel = screen.getByRole("tabpanel");
    expect(panel.textContent).toMatch(/Ava Martinez/);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
