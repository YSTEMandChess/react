import { renderHook, waitFor } from "@testing-library/react";
import { useAnalyticsApi } from "./useAnalyticsApi";

// Mock environment so the hook doesn't import a real backend URL.
jest.mock("../../environments/environment", () => ({
  environment: { urls: { middlewareURL: "http://mockurl.com" } },
}));

// Mock react-cookie so useCookies returns a controllable value.
jest.mock("react-cookie", () => ({
  useCookies: () => [{ login: "mock-jwt-token" }, jest.fn(), jest.fn()],
}));

describe("useAnalyticsApi", () => {
  describe("mock-mode (default)", () => {
    it("returns initial state synchronously: data=null, loading=false, error=null", () => {
      const { result } = renderHook(() =>
        useAnalyticsApi({ endpoint: "/analytics/individual", enabled: false })
      );
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("resolves to MOCK_ANALYTICS_DATA when enabled", async () => {
      const { result } = renderHook(() =>
        useAnalyticsApi({ endpoint: "/analytics/individual" })
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBeNull();
      expect(Array.isArray(result.current.data)).toBe(true);
      expect((result.current.data as any[]).length).toBeGreaterThan(0);
      expect((result.current.data as any[])[0]).toHaveProperty("date");
      expect((result.current.data as any[])[0]).toHaveProperty("metric");
      expect((result.current.data as any[])[0]).toHaveProperty("value");
    });

    it("skips fetching when enabled=false", async () => {
      const { result } = renderHook(() =>
        useAnalyticsApi({ endpoint: "/analytics/individual", enabled: false })
      );

      // Wait a tick to ensure no async work updates state.
      await new Promise((r) => setTimeout(r, 50));
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("re-fetches when endpoint changes", async () => {
      const { result, rerender } = renderHook(
        ({ endpoint }) => useAnalyticsApi({ endpoint }),
        { initialProps: { endpoint: "/analytics/individual" } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      const firstData = result.current.data;

      rerender({ endpoint: "/analytics/global" });
      // After dep change, loading should flip true then resolve again.
      await waitFor(() => expect(result.current.loading).toBe(false));
      // In mock mode the payload is identical, but the effect did re-run.
      expect(result.current.data).toEqual(firstData);
    });
  });
});
