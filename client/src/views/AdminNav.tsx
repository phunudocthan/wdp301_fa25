import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/AdminDashboard.css";

const navs = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/dashboard/revenue", label: "Revenue" },
  { to: "/admin/dashboard/orders", label: "Order stats" },
  { to: "/admin/orders", label: "Manage orders" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/notifications", label: "Notifications" },
  { to: "/profile", label: "Profile" },
];

const AdminNav: React.FC = () => (
  <nav className="admin-tabs" style={{ marginBottom: 24 }}>
    {navs.map((nav) => (
      <NavLink
        key={nav.to}
        to={nav.to}
        className={({ isActive }) => `admin-tab ${isActive ? "is-active" : ""}`}
      >
        {nav.label}
      </NavLink>
    ))}
  </nav>
);

export default AdminNav;
