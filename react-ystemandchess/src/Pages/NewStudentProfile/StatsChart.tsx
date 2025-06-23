import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useState } from 'react';
import { Line } from 'react-chartjs-2';

// X, Y axes for the plot
type StatsChartProps = {
  monthAxis: string[]; // X-axis, months, e.g. "Jan", "Feb"...
  dataAxis: number[]; // Y-axis, time spent in minutes
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const StatsChart: React.FC<StatsChartProps> = ({ monthAxis, dataAxis }) => {
  const labels = monthAxis; // X-axis
  const [data, setData] = useState({
    labels: labels,
    datasets: [{
      label: 'Website', // shows time spent on website
      data: dataAxis, // Y-axis
      fill: false,
      borderColor: 'rgb(0, 0, 0)',
      borderWidth: 2,
      backgroundColor: 'rgb(0, 0, 0)',
      pointRadius: 0,
      tension: 0.1
    }]
  });

  return <Line data={data} />;
};
