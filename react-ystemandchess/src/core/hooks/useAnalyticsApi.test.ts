import { renderHook, act, waitFor } from "@testing-library/react";
import { useAnalyticsApi } from "./useAnalyticsApi";

// mock environment URL
jest.mock("../../environments/environment", () => ({
  environment: { urls: { middlewareURL: "http://mockurl.com" } },
}));

// mock useCookies — preserve CookiesProvider for any consumers, override the hook
jest.mock("react-cookie", () => {
  const actual = jest.requireActual("react-cookie");
  return {
    ...actual,
    useCookies: () => [{ login: "mock-jwt-token" }, jest.fn(), jest.fn()],
  };
});

describe("useAnalyticsApi", () => {
  beforeEach(() => {
    // mock fetch — the hook should NOT call this while USE_MOCK is true
    global.fetch = jest.fn(() =>
      Promise.reject("fetch should not be called in mock mode")
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns initial state synchronously when disabled", () => {
    const { result } = renderHook(() =>
      useAnalyticsApi({ endpoint: "/analytics/individual", enabled: false })
    );

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("resolves to mock analytics data when enabled", async () => {
    const { result } = renderHook(() =>
      useAnalyticsApi({ endpoint: "/analytics/individual" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    // /analytics/individual resolves to the student summary list.
    expect(Array.isArray(result.current.data)).toBe(true);
    expect((result.current.data as any[]).length).toBeGreaterThan(0);
    expect((result.current.data as any[])[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        username: expect.any(String),
        totalHours: expect.any(Number),
      })
    );
    // mock mode must not hit the network
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("skips fetching when enabled=false", async () => {
    const { result } = renderHook(() =>
      useAnalyticsApi({ endpoint: "/analytics/individual", enabled: false })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("re-runs the effect when endpoint changes", async () => {
    const { result, rerender } = renderHook(
      ({ endpoint }) => useAnalyticsApi({ endpoint }),
      { initialProps: { endpoint: "/analytics/individual" } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstData = result.current.data;
    expect(Array.isArray(firstData)).toBe(true); // student list

    rerender({ endpoint: "/analytics/global" });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // The effect re-ran and resolved the global summary (a different shape).
    expect(result.current.data).not.toEqual(firstData);
    expect(result.current.data).toEqual(
      expect.objectContaining({
        kpis: expect.any(Array),
        genderBreakdown: expect.any(Array),
        eventTypes: expect.any(Array),
      })
    );
  });
});
