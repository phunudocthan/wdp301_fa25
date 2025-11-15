import {} from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "/logo.png";

export default function EmployeeHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/employee/themes" className="brand">
          <img src={logo} alt="Logo" className="logo" style={{ height: 32 }} />
          <span style={{ marginLeft: 8 }}>Employee Manager</span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link
            to="/employee/themes"
            style={{
              textDecoration: "none",
              color: isActive("/employee/themes") ? "#1976d2" : "#666",
              fontWeight: isActive("/employee/themes") ? 600 : 400,
            }}
          >
            Themes
          </Link>
          <Link
            to="/employee/characters"
            style={{
              textDecoration: "none",
              color: isActive("/employee/characters") ? "#1976d2" : "#666",
              fontWeight: isActive("/employee/characters") ? 600 : 400,
            }}
          >
            Characters
          </Link>
          <Link
            to="/employee/news"
            style={{
              textDecoration: "none",
              color: isActive("/employee/news") ? "#1976d2" : "#666",
              fontWeight: isActive("/employee/news") ? 600 : 400,
            }}
          >
            News
          </Link>
          <Link
            to="/employee/orders"
            style={{
              textDecoration: "none",
              color: isActive("/employee/orders") ? "#1976d2" : "#666",
              fontWeight: isActive("/employee/orders") ? 600 : 400,
            }}
          >
            Orders
          </Link>
          {/* <Link
            to="/history-orders"
            style={{
              textDecoration: "none",
              color: isActive("/history-orders") ? "#1976d2" : "#666",
              fontWeight: isActive("/history-orders") ? 600 : 400,
            }}
          >
            History Orders
          </Link>
          <Link
            to="/notifications"
            style={{
              textDecoration: "none",
              color: isActive("/notifications") ? "#1976d2" : "#666",
              fontWeight: isActive("/notifications") ? 600 : 400,
            }}
          >
            Notifications
          </Link> */}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            to="/employee/profile"
            style={{
              textDecoration: "none",
              color: isActive("/employee/profile") ? "#1976d2" : "#666",
              fontWeight: isActive("/employee/profile") ? 600 : 400,
            }}
          >
            {user?.name}
          </Link>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
