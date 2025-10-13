import React from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickLinks = [
    {
      title: "Manage products",
      description: "Create, edit, and publish LEGO sets",
      tone: "bg-blue-50 text-blue-800",
      action: () => navigate("/admin/products"),
    },
    {
      title: "Manage users",
      description: "Review customer accounts and permissions",
      tone: "bg-green-50 text-green-800",
      action: () => navigate("/user"),
    },
    {
      title: "Revenue insights",
      description: "Track sales performance and KPIs",
      tone: "bg-purple-50 text-purple-800",
      action: () => navigate("/admin"),
    },
    {
      title: "Manage orders",
      description: "Process and monitor order lifecycles",
      tone: "bg-orange-50 text-orange-800",
      action: () => navigate("/admin/orders"),
    },
    {
      title: "Manage categories",
      description: "Organise catalog collections and tags",
      tone: "bg-yellow-50 text-yellow-800",
      action: () => navigate("/admin/categories"),
    },
    {
      title: "Notifications",
      description: "Send announcements and system alerts",
      tone: "bg-red-50 text-red-800",
      action: () => navigate("/admin/notifications"),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Admin dashboard</h1>
        <p className="text-gray-600 mb-6">
          Welcome back! Use the shortcuts below to jump straight into the most common admin
          workflows.
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
