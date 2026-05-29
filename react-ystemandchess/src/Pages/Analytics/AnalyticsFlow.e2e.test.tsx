import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { CookiesProvider } from "react-cookie";
import AnalyticsLayout from "./AnalyticsLayout";
import type { AnalyticsRecord } from "../../core/hooks/useAnalyticsApi";

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

// Drive the hook from the test so we can exercise loading / data / error
// without flipping USE_MOCK in the real hook.
type HookState = {
  data: AnalyticsRecord[] | null;
  loading: boolean;
  error: Error | null;
};

let mockState: HookState;

jest.mock("../../core/hooks/useAnalyticsApi", () => ({
  useAnalyticsApi: () => mockState,
}));

const renderLayout = () =>
  render(
    <MemoryRouter>
      <CookiesProvider>
        <AnalyticsLayout />
      </CookiesProvider>
    </MemoryRouter>
  );

const SAMPLE_ROWS: AnalyticsRecord[] = [
  { date: "2026-05-01", metric: "active_users", value: 142 },
  { date: "2026-05-02", metric: "lesson_completions", value: 58 },
];

describe("Analytics flow end-to-end", () => {
  beforeEach(() => {
    mockState = { data: null, loading: false, error: null };
  });

  it("walks the full flow: empty → pick dates → loading → data → search → error → tab switch", async () => {
    const { rerender } = renderLayout();

    // 1. Layout shell renders with all three tabs and the date range filter.
    expect(screen.getByRole("heading", { name: /Analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Individual/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Zipcode/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Global/i })).toBeInTheDocument();

    const startInput = screen.getByLabelText(/Start date/i) as HTMLInputElement;
    const endInput = screen.getByLabelText(/End date/i) as HTMLInputElement;
    expect(startInput).toHaveValue("");
    expect(endInput).toHaveValue("");

    // 2. Before dates are picked, IndividualView shows the prompt.
    expect(
      screen.getByText(/Select a start and end date to load analytics/i)
    ).toBeInTheDocument();

    // 3. Pick dates — IndividualView is now active and renders a search box.
    fireEvent.change(startInput, { target: { value: "2026-05-01" } });
    fireEvent.change(endInput, { target: { value: "2026-05-04" } });

    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by metric/i)).toBeInTheDocument();

    // 4. Loading state — LoadingSpinner appears.
    mockState = { data: null, loading: true, error: null };
    rerender(
      <MemoryRouter>
        <CookiesProvider>
          <AnalyticsLayout />
        </CookiesProvider>
      </MemoryRouter>
    );
    // Re-pick dates after rerender (state was reset).
    fireEvent.change(screen.getByLabelText(/Start date/i), { target: { value: "2026-05-01" } });
    fireEvent.change(screen.getByLabelText(/End date/i), { target: { value: "2026-05-04" } });

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveTextContent(/Loading/i);

    // 5. Data state — results list renders both rows.
    mockState = { data: SAMPLE_ROWS, loading: false, error: null };
    rerender(
      <MemoryRouter>
        <CookiesProvider>
          <AnalyticsLayout />
        </CookiesProvider>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Start date/i), { target: { value: "2026-05-01" } });
    fireEvent.change(screen.getByLabelText(/End date/i), { target: { value: "2026-05-04" } });

    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument()
    );

    const list = screen.getByRole("list");
    expect(within(list).getByText(/active_users/i)).toBeInTheDocument();
    expect(within(list).getByText(/lesson_completions/i)).toBeInTheDocument();

    // 6. Search filters results — typing "active" + submit drops the lesson row.
    fireEvent.change(screen.getByPlaceholderText(/Search by metric/i), {
      target: { value: "active" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));

    expect(within(screen.getByRole("list")).getByText(/active_users/i)).toBeInTheDocument();
    expect(within(screen.getByRole("list")).queryByText(/lesson_completions/i)).not.toBeInTheDocument();

    // 7. Error state — ErrorBanner replaces the list.
    mockState = { data: null, loading: false, error: new Error("Network unreachable") };
    rerender(
      <MemoryRouter>
        <CookiesProvider>
          <AnalyticsLayout />
        </CookiesProvider>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Start date/i), { target: { value: "2026-05-01" } });
    fireEvent.change(screen.getByLabelText(/End date/i), { target: { value: "2026-05-04" } });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Network unreachable/i);

    // 8. Tab switch — moving to Zipcode shows the layout-level placeholder
    //    (no dedicated view yet) without crashing.
    fireEvent.click(screen.getByRole("tab", { name: /Zipcode/i }));
    expect(screen.getByRole("tab", { name: /Zipcode/i })).toHaveAttribute("aria-selected", "true");
    // The Zipcode tab uses the layout-level fetch, which is in error state too.
    expect(screen.getByRole("alert")).toHaveTextContent(/Network unreachable/i);
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

  it("IndividualView shows a 'No results' row when the search matches nothing", () => {
    mockState = { data: SAMPLE_ROWS, loading: false, error: null };
    renderLayout();

    fireEvent.change(screen.getByLabelText(/Start date/i), { target: { value: "2026-05-01" } });
    fireEvent.change(screen.getByLabelText(/End date/i), { target: { value: "2026-05-04" } });

    fireEvent.change(screen.getByPlaceholderText(/Search by metric/i), {
      target: { value: "nonexistent_metric_xyz" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));

    expect(screen.getByText(/No results\./i)).toBeInTheDocument();
  });
});
