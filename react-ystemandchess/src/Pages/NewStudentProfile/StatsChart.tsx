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

type StatsChartProps = {
  monthAxis: string[];
  dataAxis: number[];
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
  const labels = monthAxis;
  const [data, setData] = useState({
    labels: labels,
    datasets: [{
      label: 'Website',
      data: dataAxis,
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
