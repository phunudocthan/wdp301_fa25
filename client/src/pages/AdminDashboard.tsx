import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import AdminNav from "../views/AdminNav";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user && user.role !== "admin") {
    return <Navigate to="/profile" replace />;
  }

  const quickLinks = [
    {
      title: "Revenue insights",
      description: "Track weekly, monthly, and yearly sales trends",
      tone: "bg-purple-50 text-purple-800",
      action: () => navigate("/admin/dashboard/revenue"),
    },
    {
      title: "Order analytics",
      description: "Monitor fulfilment status and performance",
      tone: "bg-orange-50 text-orange-800",
      action: () => navigate("/admin/dashboard/orders"),
    },
    {
      title: "Manage orders",
      description: "Review, update, and follow up customer orders",
      tone: "bg-amber-50 text-amber-800",
      action: () => navigate("/admin/orders"),
    },
    {
      title: "Manage products",
      description: "Create, edit, and publish LEGO sets",
      tone: "bg-blue-50 text-blue-800",
      action: () => navigate("/admin/products"),
    },
    {
      title: "Manage categories",
      description: "Keep catalogue groupings tidy and searchable",
      tone: "bg-yellow-50 text-yellow-800",
      action: () => navigate("/admin/categories"),
    },
    {
      title: "Manage users",
      description: "List users, inspect detail, block/unblock accounts",
      tone: "bg-green-50 text-green-800",
      action: () => navigate("/admin/users"),
    },
    {
      title: "Notifications",
      description: "Send announcements and system alerts",
      tone: "bg-red-50 text-red-800",
      action: () => navigate("/admin/notifications"),
    },
    {
      title: "Admin profile",
      description: "Update your information and manage credentials",
      tone: "bg-slate-50 text-slate-800",
      action: () => navigate("/admin/profile"),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <AdminNav />
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Admin dashboard
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome back! Jump straight into the key admin workflows with the
          shortcuts below.
        </p>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {quickLinks.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className={`${item.tone} p-5 rounded-lg text-left shadow-sm hover:shadow transition-all`}
              >
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
