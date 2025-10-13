import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { restoreNotification } from "../api/notifications";
import AdminNav from "./AdminNav";
import "./../styles/AdminNotificationPage.css";

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
  const [category, setCategory] =
    useState<NotificationItem["category"]>("system");
  const [type, setType] = useState<NotificationItem["type"]>("system");
  const [link, setLink] = useState("");
  const [image, setImage] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editType, setEditType] =
    useState<NotificationItem["type"]>("system");
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [undoInfo, setUndoInfo] = useState<{ id: string; timer?: any } | null>(
    null
  );
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

  const suggestionMap: Record<
    NotificationItem["category"],
    { title: string; message: string }[]
  > = {
    promotion: [
      {
        title: "Ưu đãi đặc biệt tháng này!",
        message:
          "Nhận ngay mã giảm giá 20% cho đơn hàng đầu tiên trong tháng này. Số lượng có hạn!",
      },
      {
        title: "Flash Sale cuối tuần",
        message:
          "Chỉ hôm nay: Giảm giá 50% cho tất cả sản phẩm LEGO chủ đề Star Wars!",
      },
    ],
    order: [
      {
        title: "Đơn hàng đã được xác nhận",
        message:
          "Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đang được xử lý và sẽ giao sớm nhất.",
      },
      {
        title: "Đơn hàng đã giao thành công",
        message:
          "Đơn hàng #12345 đã được giao thành công. Chúc bạn trải nghiệm vui vẻ!",
      },
    ],
    product: [
      {
        title: "Ra mắt sản phẩm mới",
        message:
          "Khám phá bộ sưu tập LEGO Technic 2025 vừa cập bến! Đặt trước ngay hôm nay.",
      },
      {
        title: "Sản phẩm hot trở lại kho",
        message: "Bộ LEGO Harry Potter đã có hàng trở lại. Đặt mua ngay!",
      },
    ],
    system: [
      {
        title: "Bảo trì hệ thống",
        message:
          "Website sẽ bảo trì từ 0h-2h ngày 1/10. Mong bạn thông cảm!",
      },
      {
        title: "Cập nhật chính sách bảo mật",
        message:
          "Chúng tôi vừa cập nhật chính sách bảo mật mới. Xem chi tiết tại đây.",
      },
    ],
    engagement: [
      {
        title: "Cảm ơn bạn đã đánh giá sản phẩm!",
        message:
          "Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ mỗi ngày.",
      },
      {
        title: "Tham gia khảo sát nhận quà",
        message: "Hoàn thành khảo sát ngắn và nhận ngay voucher 30k!",
      },
    ],
  };

  const fetchSent = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/notifications/admin/sent`, {
        withCredentials: true,
      });
      let sentNotifications: NotificationItem[] =
        res.data.notifications || [];

      const map = new Map<string, NotificationItem>();
      sentNotifications.forEach((n) => {
        const key = `${n.title.trim()}|${n.message.trim()}`;
        const existing = map.get(key);
        const currentTime = n.createdAt ? new Date(n.createdAt).getTime() : 0;
        const existingTime =
          existing && existing.createdAt
            ? new Date(existing.createdAt).getTime()
            : 0;
        if (!existing || currentTime > existingTime) {
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

  const handleSuggestion = (
    cat: NotificationItem["category"],
    idx: number
  ) => {
    setCategory(cat);
    setTitle(suggestionMap[cat][idx].title);
    setMessage(suggestionMap[cat][idx].message);
  };

  const doSend = async (payload: any) => {
    setLoading(true);
    try {
      await axiosInstance.post(`/notifications/admin`, payload, {
        withCredentials: true,
      });
      setTitle("");
      setMessage("");
      setCategory("system");
      setType("system");
      setLink("");
      setImage("");
      setUserId("");
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
    if (!message) return setError("Nội dung không được để trống");

    const payload = {
      title,
      message,
      category,
      type,
      link: link || undefined,
      image: image || undefined,
      userId: userId || undefined,
    };

    if (!payload.userId) {
      setShowBroadcastConfirm(true);
      return;
    }

    doSend(payload);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    try {
      await axiosInstance.patch(
        `/notifications/admin/${editId}`,
        {
          message: editMessage,
          type: editType,
        },
        { withCredentials: true }
      );
      setEditId(null);
      setEditMessage("");
      setEditType("system");
      fetchSent();
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Cập nhật thất bại");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/notifications/admin/${id}`, {
        withCredentials: true,
      });

      setNotifications((prev) => prev.filter((item) => item._id !== id));
      const timer = setTimeout(() => setUndoInfo(null), 6000);
      setUndoInfo({ id, timer });
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Xóa thông báo thất bại");
    }
  };

  const handleUndo = async (id: string) => {
    try {
      await restoreNotification(id);
      setUndoInfo((prev) => {
        if (prev?.timer) clearTimeout(prev.timer);
        return null;
      });
      fetchSent();
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Không thể khôi phục thông báo");
    }
  };

  const startEdit = (item: NotificationItem) => {
    setEditId(item._id);
    setEditMessage(item.message);
    setEditType(item.type);
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <h1 className="admin-title">Quản lý Notification</h1>

      <form onSubmit={handleSend} className="admin-form">
        <div className="form-row">
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as NotificationItem["category"])
            }
            className="form-select"
          >
            <option value="promotion">Khuyến mãi & Marketing</option>
            <option value="order">Đơn hàng & Giao dịch</option>
            <option value="product">Sản phẩm mới</option>
            <option value="system">Thông báo hệ thống</option>
            <option value="engagement">Tương tác khách hàng</option>
          </select>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="UserId (bỏ trống để gửi toàn bộ user)"
            className="form-input"
          />
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề thông báo"
          className="form-input"
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Link chi tiết (nếu có)"
          className="form-input"
        />
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Link ảnh (nếu có)"
          className="form-input"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nội dung thông báo"
          className="form-textarea"
        />

        <div className="suggestion-row">
          {suggestionMap[category].map((sug, idx) => (
            <button
              type="button"
              key={idx}
              className="suggestion-btn"
              onClick={() => handleSuggestion(category, idx)}
            >
              {sug.title}
            </button>
          ))}
        </div>

        <div className="form-row">
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as NotificationItem["type"])
            }
            className="form-select"
          >
            <option value="system">System</option>
            <option value="order">Order</option>
            <option value="promotion">Promotion</option>
            <option value="product">Product</option>
            <option value="engagement">Engagement</option>
          </select>

          <div style={{ minWidth: 160 }}>
            <button type="submit" className="btn-submit" disabled={loading}>
              Gửi thông báo
            </button>
          </div>
        </div>
        {error && <div className="error-msg">{error}</div>}
      </form>

      {showBroadcastConfirm && (
        <div className="broadcast-confirm-overlay">
          <div className="broadcast-confirm">
            <h3>Xác nhận gửi tới toàn bộ người dùng</h3>
            <p>
              Bạn sắp gửi thông báo tới tất cả users (trừ admin). Đây là hành
              động không thể hoàn tác.
            </p>
            <div className="confirm-actions">
              <button
                onClick={() => setShowBroadcastConfirm(false)}
                className="btn-cancel"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  doSend({
                    title,
                    message,
                    category,
                    type,
                    link,
                    image,
                    confirmBroadcast: true,
                  })
                }
                className="btn-confirm"
                disabled={loading}
              >
                Xác nhận và gửi
              </button>
            </div>
          </div>
        </div>
      )}

  <h2 className="section-title">Notifications đã gửi</h2>
      {loading ? (
        <div className="loading-text">Đang tải...</div>
      ) : (
        <ul className="notification-list">
          {notifications.map((item) => (
            <li key={item._id} className="notification-card">
              {editId === item._id ? (
                <form onSubmit={handleEdit} className="edit-form">
                  <textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className="form-textarea"
                  />
                  <select
                    value={editType}
                    onChange={(e) =>
                      setEditType(e.target.value as NotificationItem["type"])
                    }
                    className="form-select"
                  >
                    <option value="system">System</option>
                    <option value="order">Order</option>
                    <option value="promotion">Promotion</option>
                    <option value="product">Product</option>
                    <option value="engagement">Engagement</option>
                  </select>
                  <div className="edit-btns">
                    <button type="submit" className="btn-save">
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="btn-cancel"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="notification-header">
                    <span className="category">
                      {item.category.toUpperCase()}
                    </span>
                    <span className="created-at">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : ""}
                    </span>
                  </div>
                  <div className="notification-title">{item.title}</div>
                  <div className="notification-message">{item.message}</div>
                  {item.link && (
                    <a
                      href={item.link}
                      className="notification-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Xem chi tiết
                    </a>
                  )}
                  {item.image && (
                    <img
                      src={item.image}
                      alt="notification"
                      className="notification-img"
                    />
                  )}
                  <div className="notification-actions">
                    <button
                      onClick={() => startEdit(item)}
                      className="btn-edit"
                    >
                      Sửa
                    </button>
                    <div style={{ display: "inline-block", position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item._id)}
                        className="btn-delete"
                      >
                        Xóa
                      </button>
                      {confirmDeleteId === item._id && (
                        <div className="confirm-bubble">
                          <div>Bạn có chắc?</div>
                          <div className="confirm-actions">
                            <button
                              className="btn-cancel"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Hủy
                            </button>
                            <button
                              className="btn-confirm"
                              onClick={() => {
                                handleDelete(item._id);
                                setConfirmDeleteId(null);
                              }}
                            >
                              Xác nhận
                            </button>
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
