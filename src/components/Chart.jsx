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

const rupeeTooltip = {
  callbacks: {
    label: (ctx) => {
      const v = ctx.parsed ?? ctx.raw;
      return `${ctx.label || ''}: ₹${Number(v).toLocaleString()}`;
    },
  },
};

const rupeeYAxis = {
  ticks: {
    color: '#8b9cb3',
    callback: (v) => `₹${v}`,
  },
  grid: { color: 'rgba(45, 58, 74, 0.5)' },
};

function syncDoughnut(chart, labels, values) {
  chart.data.labels = labels;
  const ds = chart.data.datasets[0];
  ds.data = values;
  ds.backgroundColor = CHART_COLORS.slice(0, labels.length);
  chart.update('none');
}

function syncBar(chart, labels, values) {
  chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.update('none');
}

export function DoughnutChart({ labels, values, title, currency = true }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const labelsKey = labels.join('|');
  const valuesKey = values.join('|');

  useEffect(() => {
    if (!canvasRef.current) return undefined;
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
        animation: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8b9cb3', boxWidth: 10 } },
          title: title
            ? { display: true, text: title, color: '#e8edf4', font: { size: 13 } }
            : undefined,
          tooltip: currency ? rupeeTooltip : undefined,
        },
      },
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) syncDoughnut(chartRef.current, labels, values);
  }, [labelsKey, valuesKey]);

  return (
    <div class="chart-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}

export function BarChart({ labels, values, title, currency = true }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const labelsKey = labels.join('|');
  const valuesKey = values.join('|');

  useEffect(() => {
    if (!canvasRef.current) return undefined;
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
        animation: false,
        plugins: {
          legend: { display: false },
          title: title
            ? { display: true, text: title, color: '#e8edf4', font: { size: 13 } }
            : undefined,
        },
        scales: {
          x: { ticks: { color: '#8b9cb3', maxRotation: 45 }, grid: { display: false } },
          y: currency ? rupeeYAxis : { ticks: { color: '#8b9cb3' }, grid: { color: 'rgba(45, 58, 74, 0.5)' } },
        },
      },
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) syncBar(chartRef.current, labels, values);
  }, [labelsKey, valuesKey]);

  return (
    <div class="chart-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
