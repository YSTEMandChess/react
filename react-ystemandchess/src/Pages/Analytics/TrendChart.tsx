import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { TrendSeries } from "../../core/hooks/useAnalyticsApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface TrendChartProps {
  /** Monthly trend series; null while the parent is still loading. */
  series: TrendSeries | null;
}

/**
 * Multi-line chart of monthly active users and hours. Each series sits on its
 * own y-axis (counts on the left, hours on the right). Presentational.
 */
const TrendChart = ({ series }: TrendChartProps) => {
  if (!series || series.labels.length === 0) {
    return <p className="text-muted text-sm">No data for this period.</p>;
  }

  const data = {
    labels: series.labels,
    datasets: [
      {
        label: "Active Users",
        data: series.activeUsers,
        borderColor: "#7FCC26", // primary
        backgroundColor: "#7FCC26",
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
        yAxisID: "y",
      },
      {
        label: "Hours",
        data: series.hours,
        borderColor: "#EAD94C", // accent
        backgroundColor: "#EAD94C",
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
        yAxisID: "y1",
      },
    ],
  };

  return (
    <div className="h-72">
      <Line
        data={data}
        options={{
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { position: "top" } },
          scales: {
            y: {
              type: "linear",
              position: "left",
              beginAtZero: true,
              title: { display: true, text: "Active Users" },
            },
            y1: {
              type: "linear",
              position: "right",
              beginAtZero: true,
              title: { display: true, text: "Hours" },
              grid: { drawOnChartArea: false },
            },
          },
        }}
      />
    </div>
  );
};

export default TrendChart;
