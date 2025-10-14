// src/pages/AdminProfile.tsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../components/context/AuthContext";
import { useNavigate } from "react-router-dom";
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

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(res.data);

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

  // ✅ Hàm xử lý logout
  const handleLogout = () => {
    logout();       // xoá token + setUser(null)
    navigate("/");  // quay về trang chủ
  };

  if (loading) return <div className="p-6">Đang tải thông tin...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <>
      <button onClick={() => navigate(-1)}>Back</button>
      <div className="admin-profile-container">
        <div className="admin-profile-header">
          {/* <div className="admin-avatar">{admin?.name[0]}</div> */}
          <div className="admin-header-info">
            <h2>{admin?.name}</h2>
            <p>{admin?.role}</p>
          </div>
        </div>

        <div className="admin-profile-details">
          <p><strong>Email:</strong> {admin?.email}</p>
          <p><strong>Phone:</strong> {admin?.phone}</p>
          <p><strong>Ngày tạo:</strong> {new Date(admin!.createdAt).toLocaleDateString("vi-VN")}</p>
        </div>

        <div className="admin-profile-actions">
          <button className="btn-change-password">Đổi mật khẩu</button>
          <button className="btn-edit">Chỉnh sửa</button>
          <button onClick={handleLogout} className="btn-logout">Đăng xuất</button>
        </div>
      </div>

      {error && <div className="text-error">{error}</div>}
    </>
  );
};

export default AdminProfile;
