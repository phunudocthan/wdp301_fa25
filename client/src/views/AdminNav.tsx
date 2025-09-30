import React from "react";
import { NavLink } from "react-router-dom";

const navs = [
  { to: "/admin/profile", label: "Admin Profile" },
  
  { to: "/admin/notifications", label: "Manager Notification" },
  { to: "/profile", label: "Profile" },

  // Thêm các page admin khác ở đây nếu có
];

const AdminNav: React.FC = () => (
  <nav className="flex gap-4 mb-6 border-b pb-2">
    {navs.map((nav) => (
      <NavLink
        key={nav.to}
        to={nav.to}
        className={({ isActive }) =>
          `px-3 py-1 rounded font-medium transition-colors ${
            isActive ? "bg-indigo-600 text-white" : "text-indigo-700 hover:bg-indigo-100"
          }`
        }
      >
        {nav.label}
      </NavLink>
    ))}
  </nav>
);

export default AdminNav;
