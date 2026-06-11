import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import {
  useAnalyticsApi,
  GlobalSummary,
  TrendSeries,
} from "../../core/hooks/useAnalyticsApi";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBanner from "./ErrorBanner";
import TrendChart from "./TrendChart";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface GlobalViewProps {
  startDate: string;
  endDate: string;
}

// Brand palette for category slices/bars.
const PALETTE = ["#7FCC26", "#BFD99E", "#EAD94C", "#E5F3D2", "#5C5C5C"];

/**
 * Global analytics: KPI summary cards, a gender pie chart, an event-type bar
 * chart, and the monthly trend chart (active users + hours).
 */
const GlobalView = ({ startDate, endDate }: GlobalViewProps) => {
  const dateRangeReady = Boolean(startDate && endDate);

  const summary = useAnalyticsApi<GlobalSummary>({
    endpoint: "/analytics/global",
    params: { startDate, endDate },
    enabled: dateRangeReady,
  });

  const trends = useAnalyticsApi<TrendSeries>({
    endpoint: "/analytics/global/trends",
    params: { startDate, endDate },
    enabled: dateRangeReady,
  });

  if (!dateRangeReady) {
    return <p className="text-muted">Select a start and end date to load analytics.</p>;
  }
  if (summary.loading) return <LoadingSpinner />;
  if (summary.error) {
    return <ErrorBanner message={summary.error.message} onRetry={summary.refetch} />;
  }
  if (!summary.data) {
    return <p className="text-muted text-sm">No data for this period.</p>;
  }

  const { kpis, genderBreakdown, eventTypes } = summary.data;

  const genderData = {
    labels: genderBreakdown.map((g) => g.label),
    datasets: [
      {
        data: genderBreakdown.map((g) => g.value),
        backgroundColor: PALETTE,
      },
    ],
  };

  const eventData = {
    labels: eventTypes.map((e) => e.label),
    datasets: [
      {
        label: "Events",
        data: eventTypes.map((e) => e.value),
        backgroundColor: "#7FCC26", // primary
      },
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-light border border-borderLight rounded-lg p-4">
            <p className="text-2xl font-semibold text-dark">
              {kpi.value.toLocaleString()}
              {kpi.unit ? <span className="text-base text-muted"> {kpi.unit}</span> : null}
            </p>
            <p className="text-xs text-muted mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Gender pie + event-type bar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-borderLight rounded-lg p-4">
          <h3 className="text-lg font-semibold text-dark mb-2">Gender breakdown</h3>
          <div className="h-72">
            <Pie
              data={genderData}
              options={{ maintainAspectRatio: false, plugins: { legend: { position: "right" } } }}
            />
          </div>
        </section>

        <section className="border border-borderLight rounded-lg p-4">
          <h3 className="text-lg font-semibold text-dark mb-2">Event types</h3>
          <div className="h-72">
            <Bar
              data={eventData}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </section>
      </div>

      {/* Monthly trend */}
      <section className="border border-borderLight rounded-lg p-4">
        <h3 className="text-lg font-semibold text-dark mb-2">Monthly trend</h3>
        {trends.loading ? (
          <LoadingSpinner />
        ) : trends.error ? (
          <ErrorBanner message={trends.error.message} onRetry={trends.refetch} />
        ) : (
          <TrendChart series={trends.data} />
        )}
      </section>
    </div>
  );
};

export default GlobalView;
