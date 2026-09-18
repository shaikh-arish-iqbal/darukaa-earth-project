/**
 * AnalyticsChart Component
 * ========================
 * Displays three metrics over time using Chart.js line charts:
 *   1. Carbon Sequestration (tonnes CO₂/ha/yr)
 *   2. NDVI (vegetation health, -1 to 1)
 *   3. Biodiversity Score (0–100)
 *
 * NOTE: All displayed data is mock/demo data seeded for demonstration.
 * Real values would come from satellite imagery analysis or field surveys.
 */

import { Line } from "react-chartjs-2";
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

// Register Chart.js components (required in Chart.js v3+)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsChart({ records }) {
  if (!records || records.length === 0) {
    return (
      <div className="empty-state">
        <p>No analytics data available for this site.</p>
      </div>
    );
  }

  // Format dates as "Jan 2023" for the x-axis labels
  const labels = records.map((r) =>
    new Date(r.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Carbon Seq. (t CO₂/ha/yr)",
        data: records.map((r) => r.carbon_seq_tonnes),
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.1)",
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "NDVI",
        data: records.map((r) => r.ndvi),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.3,
        pointRadius: 3,
        yAxisID: "y1",
      },
      {
        label: "Biodiversity Score",
        data: records.map((r) => r.biodiversity_score),
        borderColor: "#d97706",
        backgroundColor: "rgba(217, 119, 6, 0.1)",
        tension: 0.3,
        pointRadius: 3,
        yAxisID: "y2",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: { font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          // Add units to each dataset in the tooltip
          label: (ctx) => {
            const units = ["t CO₂/ha/yr", "", "/100"];
            return ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2)}${units[ctx.datasetIndex] || ""}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { size: 11 }, maxTicksLimit: 12 },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      y: {
        title: { display: true, text: "Carbon (t CO₂/ha/yr)", font: { size: 11 } },
        ticks: { font: { size: 11 } },
      },
      y1: {
        position: "right",
        title: { display: true, text: "NDVI", font: { size: 11 } },
        ticks: { font: { size: 11 } },
        grid: { drawOnChartArea: false },
        min: 0,
        max: 1,
      },
      y2: {
        display: false, // hidden to keep chart readable
      },
    },
  };

  return (
    <div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
      <p className="analytics-meta">
        ⚠️ Analytics data shown is mock/demo data for demonstration purposes only.
      </p>
    </div>
  );
}
