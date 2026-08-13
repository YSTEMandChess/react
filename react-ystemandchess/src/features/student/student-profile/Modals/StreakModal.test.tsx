/**
 * StreakModal — replaces the hardcoded streak figure and placeholder calendar
 * image with real data from GET /streak and GET /streak/calendar.
 *
 * The calendar endpoint buckets by UTC date, so these tests pin dates in UTC
 * to keep the assertions independent of the machine's timezone.
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import StreakModal from "./StreakModal";

jest.mock("react-cookie", () => ({
  useCookies: () => [{ login: "test-token" }],
}));

jest.mock("../../../../environments", () => ({
  environment: { urls: { middlewareURL: "http://mw" } },
}));

const SUMMARY = { currentStreak: 4, longestStreak: 9, lastCompletedDate: "2026-08-12" };

function mockFetch(summary: any = SUMMARY, days: any[] = []) {
  return jest.fn((url: string) => {
    const body = String(url).includes("/streak/calendar") ? { days } : summary;
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  });
}

beforeEach(() => {
  // Pin "now" so the grid and the "Today is" label are deterministic.
  jest.useFakeTimers().setSystemTime(new Date("2026-08-13T12:00:00Z"));
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("StreakModal", () => {
  it("renders the real streak figure from GET /streak, not a hardcoded value", async () => {
    global.fetch = mockFetch() as any;
    render(<StreakModal onClose={jest.fn()} username="alice" />);

    expect(await screen.findByText("4")).toBeInTheDocument();
    // The pre-existing hardcoded placeholders must be gone.
    expect(screen.queryByText("9", { selector: ".streak-left .big" })).not.toBeInTheDocument();
  });

  it("sends the auth token on both requests", async () => {
    const fetchMock = mockFetch();
    global.fetch = fetchMock as any;
    render(<StreakModal onClose={jest.fn()} username="alice" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    fetchMock.mock.calls.forEach(([, opts]: any) => {
      expect(opts.headers.Authorization).toBe("Bearer test-token");
    });
  });

  it("requests the calendar for the month currently in view", async () => {
    const fetchMock = mockFetch();
    global.fetch = fetchMock as any;
    render(<StreakModal onClose={jest.fn()} username="alice" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const calendarCall = fetchMock.mock.calls.find(([u]: any) => String(u).includes("/calendar"));
    expect(calendarCall[0]).toContain("month=2026-08");
    expect(calendarCall[0]).toContain("username=alice");
  });

  it("marks completed days and leaves incomplete ones unmarked", async () => {
    global.fetch = mockFetch(SUMMARY, [
      { date: "2026-08-05", completed: true },
      { date: "2026-08-06", completed: false },
    ]) as any;
    render(<StreakModal onClose={jest.fn()} username="alice" />);

    const completed = await screen.findByLabelText("2026-08-05, completed");
    expect(completed).toHaveClass("is-completed");
    expect(screen.getByLabelText("2026-08-06")).not.toHaveClass("is-completed");
  });

  it("treats a date absent from the response as not completed", async () => {
    global.fetch = mockFetch(SUMMARY, [{ date: "2026-08-05", completed: true }]) as any;
    render(<StreakModal onClose={jest.fn()} username="alice" />);

    await screen.findByLabelText("2026-08-05, completed");
    // 2026-08-20 was never returned — no events recorded that day.
    expect(screen.getByLabelText("2026-08-20")).not.toHaveClass("is-completed");
  });

  it("refetches when the user navigates to the previous month", async () => {
    const fetchMock = mockFetch();
    global.fetch = fetchMock as any;
    render(<StreakModal onClose={jest.fn()} username="alice" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByLabelText("Previous month"));

    await waitFor(() => {
      const months = fetchMock.mock.calls
        .map(([u]: any) => String(u))
        .filter((u) => u.includes("/calendar"));
      expect(months.some((u) => u.includes("month=2026-07"))).toBe(true);
    });
  });

  it("builds the grid so the 1st falls on its real weekday", async () => {
    global.fetch = mockFetch() as any;
    render(<StreakModal onClose={jest.fn()} username="alice" />);

    // 2026-08-01 is a Saturday, so six leading blanks precede it.
    await screen.findByLabelText("2026-08-01");
    const grid = screen.getByRole("grid");
    const blanks = grid.querySelectorAll(".calendar-day.is-blank");
    expect(blanks.length).toBe(6);
  });

  it("shows a notice instead of hanging when the request fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) })
    ) as any;
    render(<StreakModal onClose={jest.fn()} username="alice" />);

    expect(await screen.findByText(/couldn't load your streak/i)).toBeInTheDocument();
  });

  it("closes when the overlay is clicked", async () => {
    global.fetch = mockFetch() as any;
    const onClose = jest.fn();
    const { container } = render(<StreakModal onClose={onClose} username="alice" />);

    fireEvent.click(container.querySelector(".streak-modal-overlay")!);
    expect(onClose).toHaveBeenCalled();
  });
});
