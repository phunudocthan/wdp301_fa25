import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiBaseURL } from "../api/axiosInstance";

interface NotificationItem {
  _id: string;
  userId: string;
  message: string;
  type: "order" | "system" | "promotion";
  createdAt?: string;
}

const AdminNotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationItem["type"]>("system");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editType, setEditType] = useState<NotificationItem["type"]>("system");
  const [error, setError] = useState("");

  // Fetch sent notifications
  const fetchSent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBaseURL}/notifications/admin/sent`, { withCredentials: true });
      setNotifications(res.data.notifications || []);
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSent();
  }, []);

  // Send notification
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return setError("Nội dung thông báo không được để trống");
    setLoading(true);
    try {
      await axios.post(`${apiBaseURL}/notifications/admin`, userId ? { userId, message, type } : { message, type }, { withCredentials: true });
      setMessage("");
      setUserId("");
      setType("system");
      fetchSent();
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Gửi thông báo thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa notification này?")) return;
    setLoading(true);
    try {
      await axios.delete(`${apiBaseURL}/notifications/admin/${id}`, { withCredentials: true });
      fetchSent();
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Start edit
  const startEdit = (item: NotificationItem) => {
    setEditId(item._id);
    setEditMessage(item.message);
    setEditType(item.type);
  };

  // Save edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editMessage) return setError("Message không được để trống");
    setLoading(true);
    try {
      await axios.patch(`${apiBaseURL}/notifications/admin/${editId}`, { message: editMessage, type: editType }, { withCredentials: true });
      setEditId(null);
      setEditMessage("");
      setEditType("system");
      fetchSent();
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Notification Management</h1>
      <form onSubmit={handleSend} className="flex flex-col gap-3 mb-8 bg-white p-4 rounded shadow">
        <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="UserId (bỏ trống để gửi toàn bộ user)" className="border px-3 py-2 rounded" />
        <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Nội dung thông báo" className="border px-3 py-2 rounded" />
        <select value={type} onChange={e => setType(e.target.value as NotificationItem["type"])} className="border px-3 py-2 rounded">
          <option value="system">System</option>
          <option value="order">Order</option>
          <option value="promotion">Promotion</option>
        </select>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" disabled={loading}>Gửi thông báo</button>
      </form>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <h2 className="text-lg font-semibold mb-2">Danh sách notification đã gửi</h2>
      {loading ? <div>Đang tải...</div> : (
        <ul className="space-y-3">
          {notifications.map(item => (
            <li key={item._id} className="bg-gray-50 p-3 rounded shadow flex flex-col gap-2">
              {editId === item._id ? (
                <form onSubmit={handleEdit} className="flex flex-col gap-2">
                  <input value={editMessage} onChange={e => setEditMessage(e.target.value)} className="border px-2 py-1 rounded" />
                  <select value={editType} onChange={e => setEditType(e.target.value as NotificationItem["type"])} className="border px-2 py-1 rounded">
                    <option value="system">System</option>
                    <option value="order">Order</option>
                    <option value="promotion">Promotion</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-emerald-600 text-white px-3 py-1 rounded">Lưu</button>
                    <button type="button" onClick={() => setEditId(null)} className="bg-gray-300 px-3 py-1 rounded">Hủy</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.type.toUpperCase()}</span>
                    <span className="text-xs text-gray-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span>
                  </div>
                  <div>{item.message}</div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => startEdit(item)} className="bg-yellow-400 text-white px-3 py-1 rounded">Sửa</button>
                    <button onClick={() => handleDelete(item._id)} className="bg-rose-500 text-white px-3 py-1 rounded">Xóa</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminNotificationPage;
