import { useCallback, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { environment } from "../../environments/environment";

/**
 * Cookie that holds the JWT used for analytics API auth.
 * The Day 2 spec referenced `auth_token` as an example; this app stores the
 * JWT under `login` (see App.tsx / globals.ts), so we read from there.
 * Centralized as a constant so swapping cookie sources is a one-line change.
 */
const AUTH_COOKIE_NAME = "login";

/**
 * When true, the hook resolves to MOCK_ANALYTICS_DATA after a short delay
 * instead of hitting the network. Flip to false once the backend endpoint
 * is ready.
 */
const USE_MOCK = true;

/** Base URL for analytics endpoints; sourced from environment config. */
export const ANALYTICS_API_BASE = environment.urls.middlewareURL;

export interface AnalyticsRecord {
  date: string;
  metric: string;
  value: number;
}

export type AnalyticsData = AnalyticsRecord[];

export interface UseAnalyticsApiOptions {
  /** Path appended to ANALYTICS_API_BASE, e.g. "/analytics/individual". */
  endpoint: string;
  /** Optional query string parameters. Undefined/empty values are stripped. */
  params?: Record<string, string | number | undefined>;
  /** When false, the hook skips the fetch entirely. Defaults to true. */
  enabled?: boolean;
}

export interface UseAnalyticsApiResult<T = AnalyticsData> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** Re-runs the request with the current options (e.g. after an error). */
  refetch: () => void;
}

const MOCK_ANALYTICS_DATA: AnalyticsData = [
  { date: "2026-05-01", metric: "active_users", value: 142 },
  { date: "2026-05-02", metric: "active_users", value: 158 },
  { date: "2026-05-03", metric: "active_users", value: 161 },
  { date: "2026-05-04", metric: "active_users", value: 173 },
];

const buildQuery = (params?: UseAnalyticsApiOptions["params"]): string => {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${search.toString()}`;
};

/**
 * Loads analytics data with mock-first behavior.
 *
 * - Returns mocked data while USE_MOCK is true (great for unblocking UI work).
 * - When USE_MOCK is false: reads JWT from `login` cookie, sends it as
 *   `Authorization: Bearer <token>`, and fetches from
 *   `${ANALYTICS_API_BASE}${endpoint}` with optional query params.
 * - Re-runs when endpoint, params, enabled, or the auth cookie change.
 * - Aborts inflight requests on unmount/dep change to avoid setState leaks.
 *
 * @returns { data, loading, error } with initial state { null, false, null }.
 */
export function useAnalyticsApi<T = AnalyticsData>(
  { endpoint, params, enabled = true }: UseAnalyticsApiOptions,
): UseAnalyticsApiResult<T> {
  const [cookies] = useCookies([AUTH_COOKIE_NAME]);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadIndex, setReloadIndex] = useState<number>(0);

  const paramsKey = JSON.stringify(params ?? {});

  const refetch = useCallback(() => setReloadIndex((i) => i + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const fetchData = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      
      try {
        if (USE_MOCK) {
          // Simulate latency so loading states are observable in dev.
          await new Promise((resolve) => setTimeout(resolve, 300));
          if (cancelled) return;
          setData(MOCK_ANALYTICS_DATA as unknown as T);
          return;
        }

        const token: string | undefined = cookies[AUTH_COOKIE_NAME];
        if (!token) {
          throw new Error("Missing authentication token");
        }

        const url = `${ANALYTICS_API_BASE}${endpoint}${buildQuery(params)}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        const json = (await response.json()) as T;
        if (cancelled) return;
        setData(json);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, paramsKey, enabled, cookies[AUTH_COOKIE_NAME], reloadIndex]);

  return { data, loading, error, refetch };
}
