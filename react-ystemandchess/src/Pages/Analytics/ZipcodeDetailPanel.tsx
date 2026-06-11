import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useAnalyticsApi, ZipcodeDetail } from "../../core/hooks/useAnalyticsApi";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBanner from "./ErrorBanner";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ZipcodeDetailPanelProps {
  zipcode: string;
  startDate: string;
  endDate: string;
}

/**
 * Grouped bar chart comparing the selected zipcode's metrics against the
 * global average. Fetches its own detail payload for the given zipcode.
 */
const ZipcodeDetailPanel = ({ zipcode, startDate, endDate }: ZipcodeDetailPanelProps) => {
  const { data, loading, error, refetch } = useAnalyticsApi<ZipcodeDetail>({
    endpoint: `/analytics/zipcode/${zipcode}`,
    params: { startDate, endDate },
    enabled: Boolean(zipcode),
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error.message} onRetry={refetch} />;
  if (!data || data.metrics.length === 0) {
    return <p className="text-muted text-sm">No data for this period.</p>;
  }

  const chartData = {
    labels: data.metrics.map((m) => m.label),
    datasets: [
      {
        label: `Zipcode ${data.zipcode}`,
        data: data.metrics.map((m) => m.zipcodeValue),
        backgroundColor: "#7FCC26", // primary
      },
      {
        label: "Global average",
        data: data.metrics.map((m) => m.globalValue),
        backgroundColor: "#BFD99E", // secondary
      },
    ],
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-dark mb-3">
        Zipcode {data.zipcode} vs. global average
      </h3>
      <div className="h-72">
        <Bar
          data={chartData}
          options={{
            maintainAspectRatio: false,
            plugins: { legend: { position: "top" } },
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>
    </div>
  );
};

export default ZipcodeDetailPanel;
