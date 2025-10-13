import React from "react";

interface ProductStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
  };
}

const ProductStats: React.FC<ProductStatsProps> = ({ stats }) => {
  const statItems = [
    {
      label: "Tổng sản phẩm",
      value: stats.total,
      className: "stat-total",
      icon: "📦",
    },
    {
      label: "Đang hoạt động",
      value: stats.active,
      className: "stat-active",
      icon: "✅",
    },
    {
      label: "Không hoạt động",
      value: stats.inactive,
      className: "stat-inactive",
      icon: "❌",
    },
    {
      label: "Sắp hết hàng",
      value: stats.lowStock,
      className: "stat-low-stock",
      icon: "⚠️",
    },
  ];

  return (
    <div className="product-stats">
      {statItems.map((item, index) => (
        <div key={index} className={`stat-card ${item.className}`}>
          <div className="stat-icon">{item.icon}</div>
          <div className="stat-content">
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductStats;
