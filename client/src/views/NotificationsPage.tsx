import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "react-modal";
import { io, Socket } from "socket.io-client";
import { Bell, CheckCircle2, WifiOff } from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  fetchNotificationDetail,
  NotificationItem,
} from "../api/notifications";
import { apiBaseURL } from "../api/axiosInstance";
import { storage } from "../lib/storage";
import Header from "../components/common/Header";
import "../styles/NotificationsPage.scss";

Modal.setAppElement("#root"); // quan trọng, để accessibility

const socketEndpoint = apiBaseURL.replace(/\/api$/, "");

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<NotificationItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
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
      setConnectionStatus("disconnected");
      return;
    }

    const socket = io(socketEndpoint, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnectionStatus("connected"));
    socket.on("disconnect", () => setConnectionStatus("disconnected"));

    socket.on("notification:new", (payload: NotificationItem) => {
      setNotifications((prev) => {
        const exists = prev.some((item) => item._id === payload._id);
        if (exists) {
          return prev.map((item) =>
            item._id === payload._id ? { ...payload, status: payload.status || "unread" } : item
          );
        }
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
        prev.map((item) => (item._id === updated._id ? { ...item, status: updated.status } : item))
      );
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleShowDetail = async (id: string) => {
    setSelectedId(id);
    handleMarkRead(id);

    setLoadingDetail(true);
    try {
      const data = await fetchNotificationDetail(id);
      setDetail(data);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <>
      <Header />
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
            <div key={notification._id} className="d-flex align-items-center justify-content-between notification-item-wrapper">
              <div
                key={notification._id}
                onClick={() => handleShowDetail(notification._id)}
              >
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>

              </div>

              <div
                key={notification._id}
                className={`notification-item ${notification.status === "unread" ? "unread" : "read"
                  }`}
                onClick={() => handleShowDetail(notification._id)}

              >
                {notification.status === "unread" ? (
                  <WifiOff className="status-icon unread-icon" title="Unread" />
                ) : (
                  <CheckCircle2 className="status-icon read-icon" title="Read" />
                )}

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
            content: { maxWidth: "500px", maxHeight: "300px", margin: "auto", borderRadius: "8px", padding: "20px", position: "absolute", zIndex: 1001 },
          }}
        >
          <button onClick={() => setSelectedId(null)} style={{ float: "right" }}>
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
          ) : (
            <p>Not found</p>
          )}
        </Modal>
      </div>
    </>
  );
};

export default NotificationsPage;
