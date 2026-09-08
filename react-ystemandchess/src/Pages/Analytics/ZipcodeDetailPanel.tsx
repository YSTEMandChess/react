import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ZipcodeStats {
  zipcode: string;
  totalStudents: number;
  avgTotalTimeHours: number;
  avgGameTimeHours: number;
  avgLessonTimeHours: number;
  avgPuzzleTimeHours: number;
  avgStreakDays: number;
  globalAvgTotalTimeHours: number;
}

interface Props {
  stats: ZipcodeStats;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

const CATEGORIES = ['Game Time', 'Lesson Time', 'Puzzle Time'];

const ZipcodeDetailPanel: React.FC<Props> = ({ stats }) => {
  const zipValues    = [stats.avgGameTimeHours, stats.avgLessonTimeHours, stats.avgPuzzleTimeHours];
  const globalTotal  = stats.globalAvgTotalTimeHours;
  // Distribute global avg proportionally across known categories if zip has data
  const zipTotal     = stats.avgTotalTimeHours || 1;
  const globalValues = zipValues.map((v) =>
    Math.round((v / zipTotal) * globalTotal * 100) / 100
  );

  const chartData = {
    labels: CATEGORIES,
    datasets: [
      {
        label: `Zipcode ${stats.zipcode}`,
        data: zipValues,
        backgroundColor: 'rgba(74, 222, 128, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
      {
        label: 'Platform Avg',
        data: globalValues,
        backgroundColor: 'rgba(148, 163, 184, 0.5)',
        borderColor: 'rgb(100, 116, 139)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-800">
          Zipcode {stats.zipcode}
        </h3>
        <p className="text-xs text-gray-400">{stats.totalStudents} student(s)</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Avg Total Hrs" value={stats.avgTotalTimeHours.toFixed(1)} />
        <StatCard label="Avg Game Hrs"  value={stats.avgGameTimeHours.toFixed(1)} />
        <StatCard label="Avg Lesson Hrs" value={stats.avgLessonTimeHours.toFixed(1)} />
        <StatCard label="Avg Streak"    value={`${stats.avgStreakDays}d`} />
      </div>

      <div>
        <h4 className="text-xs font-medium text-gray-500 mb-2">
          Avg hours by activity — zipcode vs. platform
        </h4>
        <div style={{ height: 220 }}>
          <Bar
            data={chartData}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: true, title: { display: true, text: 'Hours' } } },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ZipcodeDetailPanel;
