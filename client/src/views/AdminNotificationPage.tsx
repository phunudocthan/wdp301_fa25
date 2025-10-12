import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { restoreNotification } from "../api/notifications";
import AdminNav from "./AdminNav";
import "./../styles/AdminNotificationPage.css"; // import CSS thuần

interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  category: "promotion" | "order" | "product" | "system" | "engagement";
  type: "order" | "system" | "promotion" | "product" | "engagement";
  link?: string;
  image?: string;
  meta?: any;
  createdAt?: string;
}

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [undoInfo, setUndoInfo] = useState<{ id: string; timer?: any } | null>(null);
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

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

  const fetchSent = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/notifications/admin/sent`, { withCredentials: true });
      let notifications: NotificationItem[] = res.data.notifications || [];

      // Lọc trùng theo title + message, giữ notification mới nhất
      const map = new Map<string, typeof notifications[0]>();
      notifications.forEach((n: NotificationItem) => {
        const key = `${n.title.trim()}|${n.message.trim()}`;
        const existing = map.get(key);
        const nTime = n.createdAt ? new Date(n.createdAt).getTime() : 0;
        const existingTime = existing && existing.createdAt ? new Date(existing.createdAt).getTime() : 0;
        if (!existing || nTime > existingTime) {
          map.set(key, n);
        }
      });

      setNotifications(Array.from(map.values()));
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchSent();
  }, []);

  const handleSuggestion = (cat: NotificationItem["category"], idx: number) => {
    setCategory(cat);
    setTitle(suggestionMap[cat][idx].title);
    setMessage(suggestionMap[cat][idx].message);
  };

  const doSend = async (payload: any) => {
    setLoading(true);
    try {
      await axiosInstance.post(`/notifications/admin`, payload, { withCredentials: true });
      setTitle(""); setMessage(""); setCategory("system"); setType("system"); setLink(""); setImage(""); setUserId("");
      fetchSent();
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Gửi thông báo thất bại");
    } finally {
      setLoading(false);
      setShowBroadcastConfirm(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return setError("Tiêu đề không được để trống");
    if (!message) return setError("Nội dung thông báo không được để trống");

    const payload = userId
      ? { userId, title, message, category, type, link, image }
      : { title, message, category, type, link, image, confirmBroadcast: true };

    // If broadcasting to all users (no userId), show a confirmation modal first
    if (!userId) {
      setShowBroadcastConfirm(true);
      return;
    }

    await doSend(payload);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/notifications/admin/${id}`, { withCredentials: true });
      fetchSent();
      // show undo toast for 8s
      const t = setTimeout(() => {
        setUndoInfo(null);
      }, 8000);
      setUndoInfo({ id, timer: t });
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (id: string) => {
    // cancel timer
    if (undoInfo?.timer) clearTimeout(undoInfo.timer);
    setLoading(true);
    try {
      await restoreNotification(id);
      fetchSent();
      setUndoInfo(null);
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Phục hồi thất bại");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: NotificationItem) => {
    setEditId(item._id);
    setEditMessage(item.message);
    setEditType(item.type);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editMessage) return setError("Message không được để trống");
    setLoading(true);
    try {
      await axiosInstance.patch(`/notifications/admin/${editId}`, { message: editMessage, type: editType }, { withCredentials: true });
      setEditId(null); setEditMessage(""); setEditType("system");
      fetchSent();
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <h1 className="admin-title">Quản lý Notification</h1>

      <form onSubmit={handleSend} className="admin-form">
        <div className="form-row">
          <select value={category} onChange={e => setCategory(e.target.value as NotificationItem["category"])} className="form-select">
            <option value="promotion">Khuyến mãi & Marketing</option>
            <option value="order">Đơn hàng & Giao dịch</option>
            <option value="product">Sản phẩm mới</option>
            <option value="system">Thông báo hệ thống</option>
            <option value="engagement">Tương tác khách hàng</option>
          </select>
          {/* optional user targeting input (commented) */}
        </div>
        <div style={{ position: 'relative' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề thông báo" className="form-input" maxLength={120} />
          <small style={{ position: 'absolute', right: 8, top: 6, color: '#666' }}>{title.length}/120</small>
        </div>
        {/* <input value={link} onChange={e => setLink(e.target.value)} placeholder="Link chi tiết (nếu có)" className="form-input" /> */}
        {/* <input value={image} onChange={e => setImage(e.target.value)} placeholder="Link ảnh (nếu có)" className="form-input" /> */}
        <div style={{ position: 'relative' }}>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Nội dung thông báo" className="form-textarea" maxLength={1000} />
          <small style={{ position: 'absolute', right: 8, bottom: 8, color: '#666' }}>{message.length}/1000</small>
        </div>

        <div className="preview-box">
          <h4>Preview</h4>
          <div className="preview-card">
            <div className="preview-title">{title || 'Tiêu đề (preview)'}</div>
            <div className="preview-message">{message || 'Nội dung (preview)'}</div>
            <div className="preview-meta">{category.toUpperCase()} • {type}</div>
          </div>
        </div>

        <div className="suggestion-row">
          {suggestionMap[category].map((sug, idx) => (
            <button type="button" key={idx} className="suggestion-btn" onClick={() => handleSuggestion(category, idx)}>
              {sug.title}
            </button>
          ))}
        </div>

        <div className="form-row">
          <select value={type} onChange={e => setType(e.target.value as NotificationItem["type"])} className="form-select">
          <option value="system">System</option>
          <option value="order">Order</option>
          <option value="promotion">Promotion</option>
          <option value="product">Product</option>
          <option value="engagement">Engagement</option>
        </select>

          <div style={{ minWidth: 160 }}>
            <button type="submit" className="btn-submit" disabled={loading}>Gửi thông báo</button>
          </div>
        </div>
        {error && <div className="error-msg">{error}</div>}
      </form>

      {showBroadcastConfirm && (
        <div className="broadcast-confirm-overlay">
          <div className="broadcast-confirm">
            <h3>Xác nhận gửi tới toàn bộ người dùng</h3>
            <p>Bạn sắp gửi thông báo tới tất cả users (trừ admin). Đây là hành động không thể hoàn tác.</p>
            <div className="confirm-actions">
              <button onClick={() => setShowBroadcastConfirm(false)} className="btn-cancel">Hủy</button>
              <button onClick={() => doSend({ title, message, category, type, link, image, confirmBroadcast: true })} className="btn-confirm" disabled={loading}>Xác nhận và gửi</button>
            </div>
          </div>
        </div>
      )}

      <h2 className="section-title">Notifications đã gửi</h2>
      {loading ? (
        <div className="loading-text">Đang tải...</div>
      ) : (
        <ul className="notification-list">
          {notifications.map(item => (
            <li key={item._id} className="notification-card">
              {editId === item._id ? (
                <form onSubmit={handleEdit} className="edit-form">
                  <textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} className="form-textarea" />
                  <select value={editType} onChange={e => setEditType(e.target.value as NotificationItem["type"])} className="form-select">
                    <option value="system">System</option>
                    <option value="order">Order</option>
                    <option value="promotion">Promotion</option>
                    <option value="product">Product</option>
                    <option value="engagement">Engagement</option>
                  </select>
                  <div className="edit-btns">
                    <button type="submit" className="btn-save">Lưu</button>
                    <button type="button" onClick={() => setEditId(null)} className="btn-cancel">Hủy</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="notification-header">
                    <span className="category">{item.category.toUpperCase()}</span>
                    <span className="created-at">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span>
                  </div>
                  <div className="notification-title">{item.title}</div>
                  <div className="notification-message">{item.message}</div>
                  {item.link && <a href={item.link} className="notification-link" target="_blank" rel="noopener noreferrer">Xem chi tiết</a>}
                  {item.image && <img src={item.image} alt="notification" className="notification-img" />}
                  <div className="notification-actions">
                    <button onClick={() => startEdit(item)} className="btn-edit">Sửa</button>
                    <div style={{ display: 'inline-block', position: 'relative' }}>
                      <button onClick={() => setConfirmDeleteId(item._id)} className="btn-delete">Xóa</button>
                      {confirmDeleteId === item._id && (
                        <div className="confirm-bubble">
                          <div>Bạn có chắc?</div>
                          <div className="confirm-actions">
                            <button className="btn-cancel" onClick={() => setConfirmDeleteId(null)}>Hủy</button>
                            <button className="btn-confirm" onClick={() => { handleDelete(item._id); setConfirmDeleteId(null); }}>Xác nhận</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {undoInfo && (
        <div className="undo-toast">
          <span>Thông báo đã được xóa.</span>
          <button onClick={() => handleUndo(undoInfo.id)}>Undo</button>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationPage;
