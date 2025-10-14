import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { adminApi, AdminUserDetailResponse } from "../api/admin";
import { useAuth } from "../components/context/AuthContext";
import "../styles/AdminDashboard.css";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const AdminUserDetailPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<AdminUserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await adminApi.getUserDetail(id);
        setData(response);
      } catch (err: any) {
        setError(err.message || "Unable to load user detail.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!id || !data || updating) return;
    const action = data.user.status === "locked" ? "unblock" : "block";
    setUpdating(true);
    try {
      const response = await adminApi.updateUserStatus(id, action);
      toast.success(response.message || "Status updated.");
      setData((prev) => (prev ? { ...prev, user: response.user } : prev));
    } catch (err: any) {
      toast.error(err.message || "Unable to update status.");
    } finally {
      setUpdating(false);
    }
  };

  if (user && user.role !== "admin") {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="admin-page">
      <button className="admin-button is-secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        Back
      </button>
      <h1>User detail</h1>

      {loading && <div className="admin-empty-state">Loading data...</div>}
      {error && <div className="admin-empty-state" style={{ color: "#dc2626" }}>{error}</div>}

      {!loading && !error && data && (
        <>
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Profile</h2>
              <button
                className={`admin-button ${data.user.status === "locked" ? "" : "is-danger"}`}
                onClick={handleToggleStatus}
                disabled={updating}
              >
                {data.user.status === "locked" ? "Unlock account" : "Lock account"}
              </button>
            </div>
            <div className="admin-metric-grid" style={{ marginBottom: 16 }}>
              <div className="admin-metric-card">
                <div className="admin-metric-label">Full name</div>
                <div className="admin-metric-value" style={{ fontSize: 20 }}>{data.user.name}</div>
                <div className="admin-metric-helper">{data.user.email}</div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-label">Role</div>
                <div className="admin-metric-value" style={{ fontSize: 20 }}>{data.user.role}</div>
                <div className="admin-metric-helper">
                  <span className={`admin-badge role-${data.user.role}`}>{data.user.role}</span>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-label">Status</div>
                <div className="admin-metric-value" style={{ fontSize: 20 }}>{data.user.status}</div>
                <div className="admin-metric-helper">
                  <span className={`admin-badge status-${data.user.status}`}>{data.user.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {data.user.phone && (
                <div><strong>Phone:</strong> {data.user.phone}</div>
              )}
              <div><strong>Created at:</strong> {new Date(data.user.createdAt).toLocaleString("vi-VN")}</div>
              <div><strong>Email verified:</strong> {data.user.isVerified ? "Yes" : "No"}</div>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Purchasing activity</h2>
            </div>

            <div className="admin-metric-grid" style={{ marginBottom: 24 }}>
              <div className="admin-metric-card">
                <div className="admin-metric-label">Total orders</div>
                <div className="admin-metric-value">{data.stats.totalOrders}</div>
                <div className="admin-metric-helper">Across every status</div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-label">Total spend</div>
                <div className="admin-metric-value">{currencyFormatter.format(data.stats.totalSpent)}</div>
                <div className="admin-metric-helper">
                  {data.stats.totalOrders > 0
                    ? `${currencyFormatter.format(
                        data.stats.totalSpent / data.stats.totalOrders || 0
                      )} per order`
                    : "No orders yet"}
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-label">Latest order</div>
                <div className="admin-metric-value" style={{ fontSize: 16 }}>
                  {data.stats.lastOrderAt
                    ? new Date(data.stats.lastOrderAt).toLocaleString("vi-VN")
                    : "n/a"}
                </div>
                <div className="admin-metric-helper">Most recent purchase</div>
              </div>
            </div>

            {data.recentOrders.length === 0 ? (
              <div className="admin-empty-state">This user has not placed any orders.</div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Total</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.orderNumber || order._id.slice(-8).toUpperCase()}</td>
                        <td>
                          <span className={`admin-badge status-${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{order.paymentStatus}</td>
                        <td>{currencyFormatter.format(order.total)}</td>
                        <td>{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
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

export default AdminUserDetailPage;
