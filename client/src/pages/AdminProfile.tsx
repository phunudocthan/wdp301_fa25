// src/pages/AdminProfile.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminNav from "../views/AdminNav";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  createdAt: string;
}

const AdminProfile: React.FC = () => {
  const [admin, setAdmin] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAdmin(res.data);
      } catch (err: any) {
        console.error("Lỗi khi lấy thông tin admin:", err);
        setError("Không thể tải thông tin admin.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, []);

  if (loading) return <div className="p-6">Đang tải thông tin...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <AdminNav />
      <div className="flex items-center space-x-4">
        <div className="bg-blue-600 text-white rounded-full h-16 w-16 flex items-center justify-center text-xl">
          {admin?.name[0]}
        </div>
        <div>
          <h2 className="text-xl font-bold">{admin?.name}</h2>
          <p className="text-sm text-gray-500 capitalize">{admin?.role}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <p><strong>Email:</strong> {admin?.email}</p>
        <p><strong>Phone:</strong> {admin?.phone}</p>
        <p><strong>Ngày tạo:</strong> {new Date(admin!.createdAt).toLocaleDateString("vi-VN")}</p>
      </div>

      <div className="pt-4 flex gap-3">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Đổi mật khẩu</button>
        <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Chỉnh sửa</button>
        <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Đăng xuất</button>
      </div>
    </div>
  );
};

export default AdminProfile;
