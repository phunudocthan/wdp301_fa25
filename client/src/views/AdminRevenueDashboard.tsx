import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { adminApi, RevenueDashboardResponse } from "../api/admin";
import AdminNav from "./AdminNav";
import { useAuth } from "../components/context/AuthContext";
import "../styles/AdminDashboard.css";

type Timeframe = "week" | "month" | "year";

const timeframeLabels: Record<Timeframe, string> = {
  week: "Last 7 days",
  month: "Last 30 days",
  year: "Last 12 months",
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCurrency = (value: number) => currencyFormatter.format(value || 0);
const formatCompact = (value: number) => compactFormatter.format(value || 0);

const AdminRevenueDashboard: React.FC = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [data, setData] = useState<RevenueDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await adminApi.getRevenueDashboard();
        setData(response);
      } catch (err: any) {
        setError(err.message || "Unable to load revenue stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const series = useMemo(() => {
    if (!data) return null;
    return data[timeframe];
  }, [data, timeframe]);

  const maxValue = useMemo(() => {
    if (!series || series.data.length === 0) return 0;
    return Math.max(...series.data, 0);
  }, [series]);

  const averageValue = useMemo(() => {
    if (!series || series.data.length === 0) return 0;
    return series.total / series.data.length;
  }, [series]);

  const bestIndex = useMemo(() => {
    if (!series || series.data.length === 0) return -1;
    let index = 0;
    let max = series.data[0];
    series.data.forEach((value, idx) => {
      if (value > max) {
        max = value;
        index = idx;
      }
    });
    return index;
  }, [series]);

  if (user && user.role !== "admin") {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="admin-page">
      <AdminNav />
      <h1>Revenue insights</h1>
      <p className="admin-subtitle">
        Stay on top of store performance to make decisions with confidence.
      </p>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>{timeframeLabels[timeframe]}</h2>
          <div className="admin-tabs">
            {(["week", "month", "year"] as Timeframe[]).map((option) => (
              <button
                key={option}
                className={`admin-tab ${timeframe === option ? "is-active" : ""}`}
                onClick={() => setTimeframe(option)}
              >
                {option === "week" && "Weekly"}
                {option === "month" && "Monthly"}
                {option === "year" && "Yearly"}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="admin-empty-state">Loading data...</div>}
        {error && <div className="admin-empty-state" style={{ color: "#dc2626" }}>{error}</div>}

        {!loading && !error && series && (
          <>
            <div className="admin-metric-grid" style={{ marginBottom: 24 }}>
              <div className="admin-metric-card">
                <div className="admin-metric-label">Total revenue</div>
                <div className="admin-metric-value">{formatCurrency(series.total)}</div>
                <div className="admin-metric-helper">
                  {timeframe === "week" && "Across the last 7 days"}
                  {timeframe === "month" && "Across the last 30 days"}
                  {timeframe === "year" && "Across the last 12 months"}
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-label">Average</div>
                <div className="admin-metric-value">{formatCurrency(averageValue)}</div>
                <div className="admin-metric-helper">
                  Per {timeframe === "year" ? "month" : "day"} in range
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-label">Best period</div>
                <div className="admin-metric-value">
                  {bestIndex >= 0 ? formatCurrency(series.data[bestIndex]) : "0"}
                </div>
                <div className="admin-metric-helper">
                  {bestIndex >= 0 ? `On ${series.labels[bestIndex]}` : "No data yet"}
                </div>
              </div>
            </div>

            <div className="bar-chart">
              {series.data.map((value, idx) => {
                const ratio = maxValue === 0 ? 0 : Math.round((value / maxValue) * 100);
                const showValue = series.data.length <= 12 || value === maxValue;
                return (
                  <div key={series.labels[idx] + idx} className="bar-chart__bar">
                    {showValue && (
                      <div className="bar-chart__value">{formatCompact(value)}</div>
                    )}
                    <div
                      className="bar-chart__shape"
                      style={{ height: `${ratio}%` }}
                      title={`${series.labels[idx]} - ${formatCurrency(value)}`}
                    />
                    <div className="bar-chart__label">{series.labels[idx]}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminRevenueDashboard;
