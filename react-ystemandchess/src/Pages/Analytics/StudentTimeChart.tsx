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
import { StudentTimePoint } from "../../core/hooks/useAnalyticsApi";

// Same registration pattern as features/student/student-profile/StatsChart.tsx.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface StudentTimeChartProps {
  /** Hours-per-period series for the selected student. */
  points: StudentTimePoint[];
}

/**
 * Line chart of a single student's time-on-platform over the selected period.
 * Presentational — the parent fetches the series and passes it in.
 */
const StudentTimeChart = ({ points }: StudentTimeChartProps) => {
  if (points.length === 0) {
    return <p className="text-muted text-sm">No data for this period.</p>;
  }

  const data = {
    labels: points.map((p) => p.date),
    datasets: [
      {
        label: "Hours",
        data: points.map((p) => p.hours),
        fill: false,
        borderColor: "#7FCC26", // primary
        backgroundColor: "#7FCC26",
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="h-64">
      <Line
        data={data}
        options={{
          maintainAspectRatio: false,
          plugins: { legend: { position: "top" } },
          scales: { y: { beginAtZero: true } },
        }}
      />
    </div>
  );
};

export default StudentTimeChart;
