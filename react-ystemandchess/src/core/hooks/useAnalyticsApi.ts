import { useCallback, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { environment } from "../../environments/environment";

/**
 * Cookie that holds the JWT used for analytics API auth.
 * This app stores the JWT under `login` (see App.tsx / globals.ts), so we read
 * from there. Centralized as a constant so swapping cookie sources is a
 * one-line change.
 */
const AUTH_COOKIE_NAME = "login";

/**
 * When true, the hook resolves to endpoint-specific MOCK data after a short
 * delay instead of hitting the network. Flip to false once the backend
 * analytics endpoints are ready — the response shapes below are the contract
 * the API is expected to match (see S4.3).
 */
const USE_MOCK = true;

/** Base URL for analytics endpoints; sourced from environment config. */
export const ANALYTICS_API_BASE = environment.urls.middlewareURL;

/* -------------------------------------------------------------------------- */
/* Response shapes — one per endpoint. These are the API contract.            */
/* -------------------------------------------------------------------------- */

/** Generic time/metric record (kept for backward compat with early consumers). */
export interface AnalyticsRecord {
  date: string;
  metric: string;
  value: number;
}
export type AnalyticsData = AnalyticsRecord[];

/** GET /analytics/individual — row per student in the search/list view. */
export interface StudentSummary {
  id: string;
  name: string;
  username: string;
  zipcode: string;
  totalHours: number;
}

/** Stat-card figures for a single student. */
export interface StudentStats {
  totalTimeHours: number;
  currentStreakDays: number;
  badges: number;
  activitiesCompleted: number;
}

/** One point on a student's time-over-period line chart. */
export interface StudentTimePoint {
  date: string;
  hours: number;
}

/** GET /analytics/individual/{id} — full detail for the selected student. */
export interface StudentDetail {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  zipcode: string;
  joinedDate: string;
  stats: StudentStats;
  timeSeries: StudentTimePoint[];
}

export type ActivityType = "lesson" | "puzzle" | "game" | "badge" | "login";

/** A single entry in a student's activity feed. */
export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  timestamp: string;
}

/**
 * GET /analytics/individual/{id}/activity?page=N — one page of the feed.
 * `nextPage` is null when there are no further pages (drives infinite scroll).
 */
export interface ActivityPage {
  items: ActivityEvent[];
  nextPage: number | null;
}

/** GET /analytics/zipcode — row per zipcode in the sortable table. */
export interface ZipcodeRow {
  zipcode: string;
  studentCount: number;
  avgHours: number;
}

/** One grouped-bar metric: this zipcode's value vs. the global average. */
export interface ZipcodeMetric {
  label: string;
  zipcodeValue: number;
  globalValue: number;
}

/** GET /analytics/zipcode/{zip} — detail comparison for one zipcode. */
export interface ZipcodeDetail {
  zipcode: string;
  metrics: ZipcodeMetric[];
}

/** A KPI summary card on the Global view. */
export interface KpiCard {
  label: string;
  value: number;
  unit?: string;
}

/** A labelled value for pie/bar category charts. */
export interface CategoryDatum {
  label: string;
  value: number;
}

/** GET /analytics/global — KPIs + category breakdowns. */
export interface GlobalSummary {
  kpis: KpiCard[];
  genderBreakdown: CategoryDatum[];
  eventTypes: CategoryDatum[];
}

/** GET /analytics/global/trends — multi-series monthly trend. */
export interface TrendSeries {
  labels: string[];
  activeUsers: number[];
  hours: number[];
}

/* -------------------------------------------------------------------------- */
/* Mock data + resolver (used while USE_MOCK is true).                        */
/* -------------------------------------------------------------------------- */

const MOCK_STUDENTS: StudentSummary[] = [
  { id: "s1", name: "Ava Martinez", username: "ava_m", zipcode: "10001", totalHours: 42 },
  { id: "s2", name: "Liam Chen", username: "liam_c", zipcode: "10001", totalHours: 31 },
  { id: "s3", name: "Noah Patel", username: "noah_p", zipcode: "94110", totalHours: 58 },
  { id: "s4", name: "Sophia Nguyen", username: "sophia_n", zipcode: "60614", totalHours: 27 },
  { id: "s5", name: "Mateo Rossi", username: "mateo_r", zipcode: "94110", totalHours: 19 },
];

const ACTIVITY_TYPES: ActivityType[] = ["lesson", "puzzle", "game", "badge", "login"];
const ACTIVITY_PAGE_SIZE = 10;
const ACTIVITY_TOTAL = 34;

const round = (n: number): number => Math.round(n * 10) / 10;
const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function buildStudentDetail(id: string): StudentDetail {
  const base = MOCK_STUDENTS.find((s) => s.id === id) ?? MOCK_STUDENTS[0];
  // Deterministic per-student variation so detail panels differ without RNG.
  const seed = base.id.charCodeAt(1) || 1;
  return {
    id: base.id,
    name: base.name,
    username: base.username,
    email: `${base.username}@example.com`,
    role: "student",
    zipcode: base.zipcode,
    joinedDate: "2025-09-01",
    stats: {
      totalTimeHours: base.totalHours,
      currentStreakDays: (seed % 14) + 1,
      badges: (seed % 9) + 4,
      activitiesCompleted: ACTIVITY_TOTAL,
    },
    timeSeries: [
      { date: "Week 1", hours: 4 + (seed % 5) },
      { date: "Week 2", hours: 7 + (seed % 4) },
      { date: "Week 3", hours: 3 + (seed % 6) },
      { date: "Week 4", hours: 9 + (seed % 3) },
      { date: "Week 5", hours: 6 + (seed % 5) },
    ],
  };
}

function buildActivityPage(page: number): ActivityPage {
  const start = page * ACTIVITY_PAGE_SIZE;
  const items: ActivityEvent[] = [];
  for (let i = start; i < Math.min(start + ACTIVITY_PAGE_SIZE, ACTIVITY_TOTAL); i++) {
    const type = ACTIVITY_TYPES[i % ACTIVITY_TYPES.length];
    items.push({
      id: `evt-${i}`,
      type,
      title: `${type.charAt(0).toUpperCase()}${type.slice(1)} — activity #${ACTIVITY_TOTAL - i}`,
      timestamp: `2026-05-${String((i % 28) + 1).padStart(2, "0")}T${String(8 + (i % 12)).padStart(2, "0")}:00:00Z`,
    });
  }
  const nextPage = start + ACTIVITY_PAGE_SIZE < ACTIVITY_TOTAL ? page + 1 : null;
  return { items, nextPage };
}

const MOCK_ZIPCODES: ZipcodeRow[] = [
  { zipcode: "10001", studentCount: 24, avgHours: 18.5 },
  { zipcode: "94110", studentCount: 31, avgHours: 22.1 },
  { zipcode: "60614", studentCount: 12, avgHours: 14.7 },
  { zipcode: "73301", studentCount: 8, avgHours: 9.3 },
  { zipcode: "02139", studentCount: 19, avgHours: 27.4 },
];

function buildZipcodeDetail(zip: string): ZipcodeDetail {
  const row = MOCK_ZIPCODES.find((z) => z.zipcode === zip) ?? MOCK_ZIPCODES[0];
  const globalAvgHours = avg(MOCK_ZIPCODES.map((z) => z.avgHours));
  const globalAvgCount = avg(MOCK_ZIPCODES.map((z) => z.studentCount));
  return {
    zipcode: row.zipcode,
    metrics: [
      { label: "Students", zipcodeValue: row.studentCount, globalValue: round(globalAvgCount) },
      { label: "Avg hours / student", zipcodeValue: round(row.avgHours), globalValue: round(globalAvgHours) },
      { label: "Avg badges", zipcodeValue: round(row.avgHours / 2), globalValue: round(globalAvgHours / 2) },
      { label: "Avg streak (days)", zipcodeValue: Math.round(row.avgHours / 3), globalValue: Math.round(globalAvgHours / 3) },
    ],
  };
}

const MOCK_GLOBAL: GlobalSummary = {
  kpis: [
    { label: "Total Students", value: 94 },
    { label: "Total Hours", value: 1820, unit: "h" },
    { label: "Active Streaks", value: 37 },
    { label: "Badges Earned", value: 512 },
  ],
  genderBreakdown: [
    { label: "Female", value: 41 },
    { label: "Male", value: 47 },
    { label: "Non-binary", value: 4 },
    { label: "Undisclosed", value: 2 },
  ],
  eventTypes: [
    { label: "Lessons", value: 320 },
    { label: "Puzzles", value: 280 },
    { label: "Games", value: 190 },
    { label: "Badges", value: 130 },
    { label: "Logins", value: 410 },
  ],
};

const MOCK_TRENDS: TrendSeries = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  activeUsers: [40, 52, 61, 58, 72, 80],
  hours: [180, 240, 300, 290, 360, 410],
};

/**
 * Maps a (clean, query-free) endpoint path to its mock payload. Patterns are
 * ordered most-specific first so `/individual/{id}/activity` wins over
 * `/individual/{id}` over `/individual`.
 */
function resolveMock(
  endpoint: string,
  params?: UseAnalyticsApiOptions["params"],
): unknown {
  if (/\/analytics\/individual\/[^/]+\/activity$/.test(endpoint)) {
    return buildActivityPage(Number(params?.page ?? 0));
  }
  if (/\/analytics\/individual\/[^/]+$/.test(endpoint)) {
    return buildStudentDetail(endpoint.split("/").pop() as string);
  }
  if (endpoint === "/analytics/individual") {
    return MOCK_STUDENTS;
  }
  if (/\/analytics\/zipcode\/[^/]+$/.test(endpoint)) {
    return buildZipcodeDetail(endpoint.split("/").pop() as string);
  }
  if (endpoint === "/analytics/zipcode") {
    return MOCK_ZIPCODES;
  }
  if (endpoint === "/analytics/global/trends") {
    return MOCK_TRENDS;
  }
  if (endpoint === "/analytics/global") {
    return MOCK_GLOBAL;
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

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
 * - Returns endpoint-specific mock data while USE_MOCK is true.
 * - When USE_MOCK is false: reads JWT from `login` cookie, sends it as
 *   `Authorization: Bearer <token>`, and fetches from
 *   `${ANALYTICS_API_BASE}${endpoint}` with optional query params.
 * - Re-runs when endpoint, params, enabled, the auth cookie, or refetch change.
 * - Aborts inflight requests on unmount/dep change to avoid setState leaks.
 *
 * @returns { data, loading, error, refetch } with initial { null, false, null }.
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
          setData(resolveMock(endpoint, params) as T);
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
