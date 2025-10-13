import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { adminApi, AdminUserListResponse } from "../api/admin";
import AdminNav from "./AdminNav";
import { useAuth } from "../components/context/AuthContext";
import "../styles/AdminDashboard.css";

type RoleFilter = "" | "admin" | "seller" | "customer";
type StatusFilter = "" | "active" | "locked" | "inactive";

const roleOptions: { value: RoleFilter; label: string }[] = [
  { value: "", label: "All roles" },
  { value: "admin", label: "Admin" },
  { value: "seller", label: "Staff" },
  { value: "customer", label: "Customer" },
];

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "locked", label: "Locked" },
  { value: "inactive", label: "Inactive" },
];

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState<AdminUserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await adminApi.listUsers({
          page,
          search: search || undefined,
          role: role || undefined,
          status: status || undefined,
          limit: 12,
        });
        if (!controller.signal.aborted) {
          setPayload(response);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setError(err.message || "Unable to load users.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();
    return () => controller.abort();
  }, [page, search, role, status]);

  const users = useMemo(() => payload?.users ?? [], [payload]);
  const pagination = payload?.pagination;

  const handleToggleStatus = async (targetId: string, currentStatus?: string) => {
    if (isUpdating) return;

    const action = currentStatus === "locked" ? "unblock" : "block";
    setIsUpdating(true);
    try {
      const response = await adminApi.updateUserStatus(targetId, action);
      toast.success(response.message || "Status updated.");
      setPayload((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.map((item: any) =>
            item._id === targetId ? { ...item, ...response.user } : item
          ),
        };
      });
    } catch (err: any) {
      toast.error(err.message || "Unable to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setRole("");
    setStatus("");
    setPage(1);
  };

  if (user && user.role !== "admin") {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="admin-page">
      <AdminNav />
      <h1>User directory</h1>
      <p className="admin-subtitle">
        Browse every account, inspect details, and lock access in one place.
      </p>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>All accounts</h2>
          <button className="admin-button is-secondary" onClick={resetFilters}>
            Reset filters
          </button>
        </div>

        <div className="admin-actions">
          <input
            type="search"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as RoleFilter);
              setPage(1);
            }}
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="admin-empty-state">Loading data...</div>}
        {error && <div className="admin-empty-state" style={{ color: "#dc2626" }}>{error}</div>}

        {!loading && !error && users.length === 0 && (
          <div className="admin-empty-state">No matching users found.</div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Full name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((item: any) => (
                  <tr key={item._id}>
                    <td>
                      <div>{item.name}</div>
                      {item.phone && (
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{item.phone}</div>
                      )}
                    </td>
                    <td>{item.email}</td>
                    <td>
                      <span className={`admin-badge role-${item.role}`}>{item.role}</span>
                    </td>
                    <td>
                      <span className={`admin-badge status-${item.status || "active"}`}>
                        {item.status || "active"}
                      </span>
                    </td>
                    <td>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <div className="admin-actions" style={{ marginBottom: 0 }}>
                        <button
                          className="admin-button is-secondary"
                          onClick={() => navigate(`/admin/users/${item._id}`)}
                        >
                          View detail
                        </button>
                        <button
                          className={`admin-button ${item.status === "locked" ? "" : "is-danger"}`}
                          disabled={isUpdating}
                          onClick={() => handleToggleStatus(item._id, item.status)}
                        >
                          {item.status === "locked" ? "Unlock" : "Lock"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && pagination && (
          <div className="admin-pagination">
            <button
              className="admin-button is-secondary"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Previous
            </button>
            <span>
              Page {pagination.page}/{pagination.pages} - {pagination.total} users
            </span>
            <button
              className="admin-button is-secondary"
              disabled={page >= pagination.pages}
              onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
