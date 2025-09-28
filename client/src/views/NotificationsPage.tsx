import React, { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Bell, CheckCircle2, Send, WifiOff } from "lucide-react";
import { fetchNotifications, createNotification, markNotificationRead, NotificationItem } from "../api/notifications";
import { apiBaseURL } from "../api/axiosInstance";
import { storage } from "../lib/storage";

const socketEndpoint = apiBaseURL.replace(/\/api$/, "");

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [newMessage, setNewMessage] = useState("");
  const [type, setType] = useState<NotificationItem["type"]>("system");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);

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
        setError(err instanceof Error ? err.message : "Unable to load notifications");
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

    socket.on("connect", () => {
      setConnectionStatus("connected");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

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

  const handleSendNotification = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim()) {
      setError("Please enter a message before sending");
      return;
    }
    try {
      setSending(true);
      setError("");
      const notification = await createNotification(newMessage.trim(), type);
      if (notification) {
        setNotifications((prev) => [notification, ...prev]);
      }
      setNewMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send notification");
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const updated = await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item._id === updated._id ? { ...item, status: updated.status } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update notification status");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Bell className="text-indigo-600" /> Notifications
            </h1>
            <p className="text-slate-500 mt-1">
              Receive live updates about your orders and promotions in real time.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {connectionStatus === "connected" ? (
              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                <CheckCircle2 size={16} /> Realtime connected
              </span>
            ) : connectionStatus === "connecting" ? (
              <span className="flex items-center gap-1 text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                <WifiOff size={16} /> Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 bg-rose-100 px-3 py-1 rounded-full">
                <WifiOff size={16} /> Realtime disconnected
              </span>
            )}
            <span className="text-slate-500">Unread: {unreadCount}</span>
          </div>
        </header>

        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Send size={18} /> Send a test notification
          </h2>
          <form onSubmit={handleSendNotification} className="grid grid-cols-1 md:grid-cols-[1fr,180px,140px] gap-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a notification message..."
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NotificationItem['type'])}
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="system">System</option>
              <option value="order">Order</option>
              <option value="promotion">Promotion</option>
            </select>
            <button
              type="submit"
              className="inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send notification'}
            </button>
          </form>
          {error && (
            <div className="mt-3 bg-rose-100 border border-rose-200 text-rose-600 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </section>

        <section className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center text-slate-500">
              You do not have any notifications yet.
            </div>
          ) : (
            notifications.map((notification) => {
              const isUnread = notification.status === 'unread';
              return (
                <div
                  key={notification._id}
                  className={`bg-white rounded-xl shadow-sm border transition hover:shadow-md ${
                    isUnread ? 'border-indigo-200' : 'border-slate-200'
                  }`}
                >
                  <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${
                          notification.type === 'order'
                            ? 'bg-emerald-100 text-emerald-600'
                            : notification.type === 'promotion'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-indigo-100 text-indigo-600'
                        }`}>
                          {notification.type === 'order'
                            ? 'Order'
                            : notification.type === 'promotion'
                            ? 'Promotion'
                            : 'System'}
                        </span>
                        {isUnread && (
                          <span className="text-xs text-indigo-500 font-medium">New</span>
                        )}
                      </div>
                      <p className="text-slate-700">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {notification.createdAt
                          ? new Date(notification.createdAt).toLocaleString()
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <button
                          onClick={() => handleMarkRead(notification._id)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        >
                          <CheckCircle2 size={16} /> Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
};

export default NotificationsPage;
