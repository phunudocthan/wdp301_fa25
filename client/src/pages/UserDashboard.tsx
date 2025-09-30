import React from "react";

const UserDashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Customer Dashboard
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Chào mừng khách hàng!
          </h2>
          <p className="text-gray-600 mb-4">
            Đây là trang dành cho khách hàng. Bạn có thể:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800">Mua sắm Lego</h3>
              <p className="text-red-600 text-sm">
                Khám phá và mua các bộ Lego yêu thích
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Đơn hàng của tôi</h3>
              <p className="text-blue-600 text-sm">
                Theo dõi trạng thái đơn hàng
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Wishlist</h3>
              <p className="text-yellow-600 text-sm">
                Danh sách sản phẩm yêu thích
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Hồ sơ cá nhân</h3>
              <p className="text-green-600 text-sm">
                Cập nhật thông tin tài khoản
              </p>
            </div>
          </div>

          <div className="mt-6">
            <a
              href="/shop"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Bắt đầu mua sắm
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
