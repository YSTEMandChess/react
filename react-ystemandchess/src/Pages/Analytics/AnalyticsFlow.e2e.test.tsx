import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { CookiesProvider } from "react-cookie";
import AnalyticsLayout from "./AnalyticsLayout";

jest.mock("../../environments/environment", () => ({
  environment: { urls: { middlewareURL: "http://mock-api.com" } },
}));

jest.mock("react-cookie", () => {
  const actual = jest.requireActual("react-cookie");
  return {
    ...actual,
    useCookies: () => [{ login: "mock-jwt-token" }, jest.fn(), jest.fn()],
  };
});

// Chart.js needs a real canvas; follow the repo pattern of stubbing the charts.
jest.mock("react-chartjs-2", () => ({
  __esModule: true,
  Line: () => <div data-testid="mock-line-chart" />,
  Bar: () => <div data-testid="mock-bar-chart" />,
  Pie: () => <div data-testid="mock-pie-chart" />,
}));

const renderLayout = () =>
  render(
    <MemoryRouter>
      <CookiesProvider>
        <AnalyticsLayout />
      </CookiesProvider>
    </MemoryRouter>
  );

const pickDates = () => {
  fireEvent.change(screen.getByLabelText(/Start date/i), { target: { value: "2026-05-01" } });
  fireEvent.change(screen.getByLabelText(/End date/i), { target: { value: "2026-05-04" } });
};

describe("Analytics flow end-to-end (mock-first hook)", () => {
  it("Individual: dates → student list → search → select → detail panel", async () => {
    renderLayout();

    // Shell: three tabs, Individual selected by default.
    expect(screen.getByRole("heading", { name: /Analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Individual/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Zipcode/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Global/i })).toBeInTheDocument();

    // Before dates: prompt.
    expect(screen.getByText(/Select a start and end date to load analytics/i)).toBeInTheDocument();

    // Pick dates → student list loads.
    pickDates();
    expect(screen.getByRole("search")).toBeInTheDocument();
    await screen.findByText(/Ava Martinez/);
    expect(screen.getByText(/Liam Chen/)).toBeInTheDocument();

    // Search filters the list client-side.
    fireEvent.change(screen.getByPlaceholderText(/Search by name/i), { target: { value: "ava" } });
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));
    expect(screen.getByText(/Ava Martinez/)).toBeInTheDocument();
    expect(screen.queryByText(/Liam Chen/)).not.toBeInTheDocument();

    // Select the student → detail panel with profile + stat cards + chart + feed.
    fireEvent.click(screen.getByText(/Ava Martinez/));
    await screen.findByText(/ava_m@example\.com/);
    expect(screen.getByText(/Total time \(hours\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Badges/)).toBeInTheDocument();
    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();
    // Activity feed first page renders.
    await screen.findByText(/activity #34/i);
  });

  it("Individual: empty state when search matches nothing", async () => {
    renderLayout();
    pickDates();
    await screen.findByText(/Ava Martinez/);

    fireEvent.change(screen.getByPlaceholderText(/Search by name/i), {
      target: { value: "zzz-nobody" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));
    expect(screen.getByText(/No data for this period\./i)).toBeInTheDocument();
  });

  it("Zipcode: table renders, sorts, and row select opens detail", async () => {
    renderLayout();
    fireEvent.click(screen.getByRole("tab", { name: /Zipcode/i }));
    pickDates();

    await screen.findByText("10001");
    const table = screen.getByRole("table");
    expect(within(table).getByText("94110")).toBeInTheDocument();

    // Sort by Avg hours — the column header reflects the sort direction.
    const avgHeader = screen.getByRole("columnheader", { name: /Avg hours/i });
    fireEvent.click(within(avgHeader).getByRole("button"));
    expect(avgHeader).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(within(avgHeader).getByRole("button"));
    expect(avgHeader).toHaveAttribute("aria-sort", "descending");

    // Select a row → detail panel (grouped bar chart) appears.
    fireEvent.click(within(table).getByText("94110"));
    await screen.findByText(/vs\. global average/i);
    expect(screen.getByTestId("mock-bar-chart")).toBeInTheDocument();
  });

  it("Global: KPI cards and charts render", async () => {
    renderLayout();
    fireEvent.click(screen.getByRole("tab", { name: /Global/i }));
    pickDates();

    await screen.findByText(/Total Students/i);
    expect(screen.getByText("94")).toBeInTheDocument();
    expect(screen.getByText(/Gender breakdown/i)).toBeInTheDocument();
    expect(screen.getByTestId("mock-pie-chart")).toBeInTheDocument();
    expect(screen.getByText(/Event types/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-bar-chart").length).toBeGreaterThan(0);
  });

  it("DateRangeFilter clamps min/max between the two inputs", () => {
    renderLayout();
    const startInput = screen.getByLabelText(/Start date/i) as HTMLInputElement;
    const endInput = screen.getByLabelText(/End date/i) as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: "2026-05-10" } });
    expect(endInput).toHaveAttribute("min", "2026-05-10");

    fireEvent.change(endInput, { target: { value: "2026-05-20" } });
    expect(startInput).toHaveAttribute("max", "2026-05-20");
  });
});
