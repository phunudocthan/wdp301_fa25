import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import {
  adminApi,
  AdminOverviewResponse,
  OrderStatusInfo,
} from "../api/admin";
import "../styles/AdminDashboard.css";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "In transit",
  delivered: "Delivered",
  canceled: "Cancelled",
  refunded: "Refunded",
};

const formatCurrency = (value: number) => currencyFormatter.format(value || 0);
const formatNumber = (value: number) => numberFormatter.format(value || 0);

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await adminApi.getOverview();
        setOverview(payload);
      } catch (err: any) {
        setError(err.message || "Unable to load dashboard overview.");
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const statusBreakdown = useMemo(() => {
    if (!overview) return [];
    const data = overview.orders.statusBreakdown || {};
    const entries: Array<{
      key: string;
      label: string;
      payload: OrderStatusInfo;
    }> = [];

    Object.keys(statusLabels).forEach((key) => {
      if (data[key]) {
        entries.push({
          key,
          label: statusLabels[key],
          payload: data[key],
        });
      }
    });

    return entries;
  }, [overview]);

  if (user && user.role !== "admin") {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="admin-page">
      <h1>Admin dashboard</h1>
      <p className="admin-subtitle">
        Revenue, orders, and user activity at a glance.
      </p>

      {loading && (
        <div className="admin-section">
          <div className="admin-empty-state">Loading overview...</div>
        </div>
      )}

      {error && (
        <div className="admin-section">
          <div className="admin-empty-state" style={{ color: "#dc2626" }}>
            {error}
          </div>
        </div>
      )}

      {!loading && !error && overview && (
        <>
          <div className="admin-section">
            <div className="admin-metric-grid">
              <div className="admin-metric-card">
                <div className="admin-metric-label">Revenue (30 days)</div>
                <div className="admin-metric-value">
                  {formatCurrency(overview.revenue.last30Days)}
                </div>
                <div className="admin-metric-helper">
                  Recognised across the last 30 calendar days
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-label">Total orders</div>
                <div className="admin-metric-value">
                  {formatNumber(overview.orders.orders)}
                </div>
                <div className="admin-metric-helper">
                  Recognised revenue {formatCurrency(overview.orders.revenue)}
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-label">Users</div>
                <div className="admin-metric-value">
                  {formatNumber(overview.users.total)}
                </div>
                <div className="admin-metric-helper">
                  Active: {formatNumber(overview.users.byStatus["active"] || 0)} ·
                  Locked: {formatNumber(overview.users.byStatus["locked"] || 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Order status overview</h2>
            </div>
            {statusBreakdown.length === 0 ? (
              <div className="admin-empty-state">
                No orders have been placed yet.
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Orders</th>
                      <th>Recognised revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusBreakdown.map(({ key, label, payload }) => (
                      <tr key={key}>
                        <td>
                          <span className={`admin-badge status-${key}`}>
                            {label}
                          </span>
                        </td>
                        <td>{formatNumber(payload.count)}</td>
                        <td>{formatCurrency(payload.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
