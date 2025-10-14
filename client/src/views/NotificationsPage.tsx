import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "react-modal";
import { io, Socket } from "socket.io-client";
import { Bell } from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  fetchNotificationDetail,
  NotificationItem,
} from "../api/notifications";
import { apiBaseURL } from "../api/axiosInstance";
import { storage } from "../lib/storage";
import "../styles/NotificationsPage.scss";

Modal.setAppElement("#root"); // quan trọng, để accessibility

const socketEndpoint = apiBaseURL.replace(/\/api$/, "");

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  // connection status is tracked but not used in UI; keep ref via ref if needed later
  const connectionStatusRef = useRef<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<NotificationItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailMissingMessage, setDetailMissingMessage] = useState<
    string | null
  >(null);
  const socketRef = useRef<Socket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const text = (item.title + item.message).toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });
  }, [notifications, searchTerm]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.status === "unread").length,
    [notifications]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchNotifications();
        setNotifications(list);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const token = storage.getToken();
    if (!token) {
      connectionStatusRef.current = "disconnected";
      return;
    }

    const socket = io(socketEndpoint, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => (connectionStatusRef.current = "connected"));
    socket.on(
      "disconnect",
      () => (connectionStatusRef.current = "disconnected")
    );

    socket.on("notification:new", (payload: NotificationItem) => {
      setNotifications((prev) => {
        const exists = prev.some((item) => item._id === payload._id);
        if (exists) {
          return prev.map((item) =>
            item._id === payload._id
              ? { ...payload, status: payload.status || "unread" }
              : item
          );
        }
        return [payload, ...prev];
      });
    });

    socket.on("notification:updated", (payload: NotificationItem) => {
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === payload._id ? { ...item, ...payload } : item
        )
      );
    });

    socket.on("notification:deleted", ({ _id }: { _id: string }) => {
      setNotifications((prev) => prev.filter((item) => item._id !== _id));
      // if the deleted notification is currently open in modal, close it
      setSelectedId((current) => (current === _id ? null : current));
    });

    socket.on("notification:restored", (payload: NotificationItem) => {
      setNotifications((prev) => {
        // if exists, replace, otherwise insert at top
        const exists = prev.some((p) => p._id === payload._id);
        if (exists)
          return prev.map((p) => (p._id === payload._id ? payload : p));
        return [payload, ...prev];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      const updated = await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === updated._id ? { ...item, status: updated.status } : item
        )
      );
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleShowDetail = async (id: string) => {
    setSelectedId(id);
    handleMarkRead(id);
    setLoadingDetail(true);
    setDetailMissingMessage(null);
    try {
      const data = await fetchNotificationDetail(id);
      setDetail(data);
    } catch (err: any) {
      // if not found or removed, show friendly message
      setDetail(null);
      setDetailMissingMessage(
        err?.response?.data?.msg ||
          "Thông báo này đã bị thu hồi hoặc không tồn tại."
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <>
      <div className="notifications-page">
        <div className="notifications-header">
          <h1>
            <Bell /> Notifications
          </h1>
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div>Unread: {unreadCount}</div>
        </div>

        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`card notification ${
                notification.status === "unread" ? "unread" : ""
              }`}
            >
              <div
                className="notification-content"
                onClick={() => handleShowDetail(notification._id)}
              >
                <div className="notification-meta">
                  <span className={`category ${notification.category}`}>
                    {notification.category}
                  </span>
                  <small className="tag-new">
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleString()
                      : ""}
                  </small>
                </div>
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                {notification.link && (
                  <a href={notification.link} target="_blank" rel="noreferrer">
                    View more
                  </a>
                )}
              </div>
              <div className="notification-actions">
                <button
                  className="btn-read"
                  onClick={() => handleMarkRead(notification._id)}
                >
                  Mark read
                </button>
              </div>
            </div>
          ))}
        </div>

        <Modal
          isOpen={selectedId}
          onRequestClose={() => setSelectedId(null)}
          contentLabel="Notification Detail"
          style={{
            overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
            content: {
              maxWidth: "500px",
              maxHeight: "300px",
              margin: "auto",
              borderRadius: "8px",
              padding: "20px",
              position: "absolute",
              zIndex: 1001,
            },
          }}
        >
          <button
            className="modal-close-btn"
            onClick={() => {
              setSelectedId(null);
              setDetail(null);
              setDetailMissingMessage(null);
            }}
          >
            ×
          </button>
          {loadingDetail ? (
            <p>Loading...</p>
          ) : detail ? (
            <>
              <h3>{detail.title}</h3>
              <p>{detail.message}</p>
              {detail.link && (
                <a href={detail.link} target="_blank" rel="noreferrer">
                  View more
                </a>
              )}
            </>
          ) : detailMissingMessage ? (
            <div className="detail-missing">
              <p>{detailMissingMessage}</p>
            </div>
          ) : (
            <p>Not found</p>
          )}
        </Modal>
      </div>
    </>
  );
};

export default NotificationsPage;
