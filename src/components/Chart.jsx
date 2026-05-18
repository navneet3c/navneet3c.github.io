import { useEffect, useRef } from 'preact/hooks';
import {
  Chart,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  LinearScale,
  Tooltip,
  Legend,
);

const CHART_COLORS = [
  '#3dd6c6',
  '#7fd99a',
  '#ffcc66',
  '#f07178',
  '#82aaff',
  '#c792ea',
  '#89ddff',
  '#8b9cb3',
];

export function DoughnutChart({ labels, values, title }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: CHART_COLORS.slice(0, labels.length),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8b9cb3', boxWidth: 10 } },
          title: title
            ? { display: true, text: title, color: '#e8edf4', font: { size: 13 } }
            : undefined,
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels.join('|'), values.join('|'), title]);

  return (
    <div class="chart-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}

export function BarChart({ labels, values, title, currency = true }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: 'rgba(61, 214, 198, 0.7)',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: title
            ? { display: true, text: title, color: '#e8edf4', font: { size: 13 } }
            : undefined,
        },
        scales: {
          x: { ticks: { color: '#8b9cb3', maxRotation: 45 }, grid: { display: false } },
          y: {
            ticks: {
              color: '#8b9cb3',
              callback: currency ? (v) => `₹${v}` : undefined,
            },
            grid: { color: 'rgba(45, 58, 74, 0.5)' },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels.join('|'), values.join('|'), title, currency]);

  return (
    <div class="chart-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
