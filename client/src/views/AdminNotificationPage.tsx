import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiBaseURL } from "../api/axiosInstance";

interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  category: 'promotion' | 'order' | 'product' | 'system' | 'engagement';
  type: 'order' | 'system' | 'promotion' | 'product' | 'engagement';
  link?: string;
  image?: string;
  meta?: any;
  createdAt?: string;
}

import AdminNav from "./AdminNav";

const AdminNotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<NotificationItem["category"]>("system");
  const [type, setType] = useState<NotificationItem["type"]>("system");
  const [link, setLink] = useState("");
  const [image, setImage] = useState("");
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
  // Gợi ý nội dung theo chủ đề
  const suggestionMap: Record<NotificationItem["category"], { title: string; message: string }[]> = {
    promotion: [
      { title: "Ưu đãi đặc biệt tháng này!", message: "Nhận ngay mã giảm giá 20% cho đơn hàng đầu tiên trong tháng này. Số lượng có hạn!" },
      { title: "Flash Sale cuối tuần", message: "Chỉ hôm nay: Giảm giá 50% cho tất cả sản phẩm LEGO chủ đề Star Wars!" },
    ],
    order: [
      { title: "Đơn hàng đã được xác nhận", message: "Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đang được xử lý và sẽ giao sớm nhất." },
      { title: "Đơn hàng đã giao thành công", message: "Đơn hàng #12345 đã được giao thành công. Chúc bạn trải nghiệm vui vẻ!" },
    ],
    product: [
      { title: "Ra mắt sản phẩm mới", message: "Khám phá bộ sưu tập LEGO Technic 2025 vừa cập bến! Đặt trước ngay hôm nay." },
      { title: "Sản phẩm hot trở lại kho", message: "Bộ LEGO Harry Potter đã có hàng trở lại. Đặt mua ngay!" },
    ],
    system: [
      { title: "Bảo trì hệ thống", message: "Website sẽ bảo trì từ 0h-2h ngày 1/10. Mong bạn thông cảm!" },
      { title: "Cập nhật chính sách bảo mật", message: "Chúng tôi vừa cập nhật chính sách bảo mật mới. Xem chi tiết tại đây." },
    ],
    engagement: [
      { title: "Cảm ơn bạn đã đánh giá sản phẩm!", message: "Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ mỗi ngày." },
      { title: "Tham gia khảo sát nhận quà", message: "Hoàn thành khảo sát ngắn và nhận ngay voucher 30k!" },
    ],
  };

  const handleSuggestion = (cat: NotificationItem["category"], idx: number) => {
    setCategory(cat);
    setTitle(suggestionMap[cat][idx].title);
    setMessage(suggestionMap[cat][idx].message);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return setError("Tiêu đề không được để trống");
    if (!message) return setError("Nội dung thông báo không được để trống");
    setLoading(true);
    try {
      await axios.post(`${apiBaseURL}/notifications/admin`,
        userId
          ? { userId, title, message, category, type, link, image }
          : { title, message, category, type, link, image },
        { withCredentials: true }
      );
      setTitle("");
      setMessage("");
      setCategory("system");
      setType("system");
      setLink("");
      setImage("");
      setUserId("");
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
      <AdminNav />
      <h1 className="text-2xl font-bold mb-6">Admin Notification Management</h1>
      <form onSubmit={handleSend} className="flex flex-col gap-3 mb-8 bg-white p-4 rounded shadow">
        <div className="flex flex-col md:flex-row gap-2">
          <select value={category} onChange={e => setCategory(e.target.value as NotificationItem["category"])} className="border px-3 py-2 rounded w-full md:w-1/3">
            <option value="promotion">Khuyến mãi & Marketing</option>
            <option value="order">Đơn hàng & Giao dịch</option>
            <option value="product">Sản phẩm mới</option>
            <option value="system">Thông báo hệ thống</option>
            <option value="engagement">Tương tác khách hàng</option>
          </select>
          <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="UserId (bỏ trống để gửi toàn bộ user)" className="border px-3 py-2 rounded w-full md:w-2/3" />
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề thông báo" className="border px-3 py-2 rounded w-full" />
          <input value={link} onChange={e => setLink(e.target.value)} placeholder="Link chi tiết (nếu có)" className="border px-3 py-2 rounded w-full" />
        </div>
        <input value={image} onChange={e => setImage(e.target.value)} placeholder="Link ảnh (nếu có)" className="border px-3 py-2 rounded" />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Nội dung thông báo" className="border px-3 py-2 rounded min-h-[80px]" />
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestionMap[category].map((sug, idx) => (
            <button type="button" key={idx} className="bg-slate-100 border px-2 py-1 rounded text-xs hover:bg-indigo-100" onClick={() => handleSuggestion(category, idx)}>
              Gợi ý: {sug.title}
            </button>
          ))}
        </div>
        <select value={type} onChange={e => setType(e.target.value as NotificationItem["type"])} className="border px-3 py-2 rounded">
          <option value="system">System</option>
          <option value="order">Order</option>
          <option value="promotion">Promotion</option>
          <option value="product">Product</option>
          <option value="engagement">Engagement</option>
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
                    <span className="font-semibold">{item.category.toUpperCase()}</span>
                    <span className="text-xs text-gray-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span>
                  </div>
                  <div className="font-bold text-indigo-700">{item.title}</div>
                  <div>{item.message}</div>
                  {item.link && <a href={item.link} className="text-blue-500 underline text-xs" target="_blank" rel="noopener noreferrer">Xem chi tiết</a>}
                  {item.image && <img src={item.image} alt="notification" className="max-h-24 mt-1 rounded" />}
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
