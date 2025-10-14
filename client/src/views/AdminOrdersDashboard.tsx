import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { adminApi, OrderDashboardResponse } from "../api/admin";
import { useAuth } from "../components/context/AuthContext";
import "../styles/AdminDashboard.css";

const statusOrder = ["pending", "confirmed", "shipped", "delivered", "canceled", "refunded"] as const;

const statusLabel: Record<(typeof statusOrder)[number], string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  shipped: "In transit",
  delivered: "Delivered",
  canceled: "Cancelled",
  refunded: "Refunded",
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(value || 0);

const AdminOrdersDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<OrderDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await adminApi.getOrderDashboard();
        setData(response);
      } catch (err: any) {
        setError(err.message || "Unable to load order stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statusBreakdown = useMemo(() => {
    if (!data) return [];
    return statusOrder.map((status) => {
      const payload = data.statusBreakdown?.[status] || { count: 0, revenue: 0 };
      return {
        status,
        label: statusLabel[status],
        count: payload.count,
        revenue: payload.revenue,
      };
    });
  }, [data]);

  const maxCount = useMemo(() => {
    if (!statusBreakdown.length) return 0;
    return Math.max(...statusBreakdown.map((item) => item.count), 0);
  }, [statusBreakdown]);

  if (user && user.role !== "admin") {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="admin-page">
      <h1>Order overview</h1>
      <p className="admin-subtitle">
        Track fulfilment progress and spot issues across every status.
      </p>

      <div className="admin-section">
        <h2>Summary</h2>
        {loading && <div className="admin-empty-state">Loading data...</div>}
        {error && <div className="admin-empty-state" style={{ color: "#dc2626" }}>{error}</div>}

        {!loading && !error && data && (
          <>
            <div className="admin-metric-grid" style={{ marginBottom: 24 }}>
              <div className="admin-metric-card">
                <div className="admin-metric-label">Total orders</div>
                <div className="admin-metric-value">{data.totals.orders}</div>
                <div className="admin-metric-helper">All statuses included</div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-label">Recognised revenue</div>
                <div className="admin-metric-value">{formatCurrency(data.totals.revenue)}</div>
                <div className="admin-metric-helper">Confirmed, shipping or delivered</div>
              </div>
            </div>

            <div className="admin-section" style={{ marginBottom: 0, padding: 20 }}>
              <div className="admin-section-header" style={{ marginBottom: 16 }}>
                <h2>Status breakdown</h2>
              </div>
              <div className="status-list">
                {statusBreakdown.map((item) => {
                  const percentage = maxCount === 0 ? 0 : Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={item.status} className="status-item">
                      <div className="status-item-header">
                        <span>{item.label}</span>
                        <span>
                          {item.count} orders - {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      <div className="status-progress" aria-hidden>
                        <span style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Recent orders</h2>
        </div>
        {loading && <div className="admin-empty-state">Loading data...</div>}
        {error && <div className="admin-empty-state" style={{ color: "#dc2626" }}>{error}</div>}
        {!loading && !error && data && data.recent.length === 0 && (
          <div className="admin-empty-state">No orders yet.</div>
        )}

        {!loading && !error && data && data.recent.length > 0 && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber || order.id.slice(-8).toUpperCase()}</td>
                    <td>
                      {order.customer ? (
                        <>
                          <div>{order.customer.name}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{order.customer.email}</div>
                        </>
                      ) : (
                        "Unknown"
                      )}
                    </td>
                    <td><span className={`admin-badge status-${order.status}`}>{order.status}</span></td>
                    <td>{order.paymentStatus}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersDashboard;
