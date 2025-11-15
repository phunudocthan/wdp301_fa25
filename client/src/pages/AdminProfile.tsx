// src/pages/AdminProfile.tsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../components/context/AuthContext";
import { useNavigate } from "react-router-dom";
import AdminProfileUI from "../components/AdminProfileUI";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  createdAt?: string;
}

const AdminProfile: React.FC = () => {
  const [admin, setAdmin] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
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
    <>
      <button onClick={() => navigate(-1)}>Back</button>
  <AdminProfileUI user={admin as any} onUpdateUser={updateUser} />
    </>
  );
};

export default AdminProfile;
