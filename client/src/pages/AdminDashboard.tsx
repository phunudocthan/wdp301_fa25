import React from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Admin Dashboard
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Chào mừng Admin!
          </h2>
          <p className="text-gray-600 mb-4">
            Đây là trang quản trị dành cho Admin. Bạn có thể quản lý:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div
              className="bg-blue-50 p-4 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => navigate("/admin/products")}
            >
              <h3 className="font-semibold text-blue-800">Quản lý sản phẩm</h3>
              <p className="text-blue-600 text-sm">
                Thêm, sửa, xóa sản phẩm Lego
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">
                Quản lý người dùng
              </h3>
              <p className="text-green-600 text-sm">
                Xem và quản lý tài khoản khách hàng
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">
                Báo cáo doanh thu
              </h3>
              <p className="text-purple-600 text-sm">
                Thống kê và phân tích bán hàng
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800">
                Quản lý đơn hàng
              </h3>
              <p className="text-orange-600 text-sm">
                Xử lý và theo dõi đơn hàng
              </p>
            </div>

            <div
              className="bg-yellow-50 p-4 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
              onClick={() => navigate("/admin/categories")}
            >
              <h3 className="font-semibold text-yellow-800">
                Quản lý danh mục
              </h3>
              <p className="text-yellow-600 text-sm">
                Thêm, sửa, xóa danh mục sản phẩm
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate("/admin/products")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quản lý sản phẩm
          </button>

          <button
            onClick={() => navigate("/admin/notifications")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Quản lý thông báo
          </button>

          <button
            onClick={() => navigate("/admin/categories")}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Quản lý danh mục
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
