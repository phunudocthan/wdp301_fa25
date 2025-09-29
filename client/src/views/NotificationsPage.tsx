import React, { useEffect, useMemo, useRef, useState } from "react";
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
        // setError(err instanceof Error ? err.message : "Unable to load notifications");
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

  const handleMarkRead = async (id: string) => {
    try {
      const updated = await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item._id === updated._id ? { ...item, status: updated.status } : item))
      );
    } catch (err) {
      // setError(err instanceof Error ? err.message : "Unable to update notification status");
    }
  };

  const handleShowDetail = async (id: string) => {
    setSelectedId(id);
    setLoadingDetail(true);
    try {
      const data = await fetchNotificationDetail(id);
      setDetail(data);
    } finally {
      setLoadingDetail(false);
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
                  onClick={() => handleShowDetail(notification._id)}
                  style={{ cursor: "pointer" }}
                  className={`bg-white rounded-xl shadow-sm border transition hover:shadow-md ${
                    isUnread ? 'border-indigo-200' : 'border-slate-200'
                  }`}
                >
                  <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${
                          notification.category === 'order'
                            ? 'bg-emerald-100 text-emerald-600'
                            : notification.category === 'promotion'
                            ? 'bg-amber-100 text-amber-600'
                            : notification.category === 'product'
                            ? 'bg-blue-100 text-blue-600'
                            : notification.category === 'engagement'
                            ? 'bg-pink-100 text-pink-600'
                            : 'bg-indigo-100 text-indigo-600'
                        }`}>
                          {notification.category?.toUpperCase() || notification.type?.toUpperCase()}
                        </span>
                        {isUnread && (
                          <span className="text-xs text-indigo-500 font-medium">New</span>
                        )}
                      </div>
                      <div className="font-bold text-lg text-indigo-700 mb-1">{notification.title}</div>
                      <p className="text-slate-700 whitespace-pre-line">{notification.message}</p>
                      {notification.link && (
                        <a href={notification.link} className="text-blue-500 underline text-xs block mt-1" target="_blank" rel="noopener noreferrer">Xem chi tiết</a>
                      )}
                      {notification.image && (
                        <img src={notification.image} alt="notification" className="max-h-24 mt-2 rounded shadow" />
                      )}
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

        {selectedId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 transition-all duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-[scaleIn_0.2s] border-t-8"
              style={{
                borderTopColor: detail?.type === 'order' ? '#10b981' : detail?.type === 'promotion' ? '#f59e42' : '#6366f1',
              }}
            >
              <button
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-2xl font-bold transition-colors"
                onClick={() => { setSelectedId(null); setDetail(null); }}
                aria-label="Close"
              >×</button>
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center min-h-[120px]">
                  <span className="loader mb-2"></span>
                  <span className="text-slate-500">Loading...</span>
                </div>
              ) : detail ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`rounded-full p-3 mb-2 shadow-lg ${
                    detail?.category === 'order' ? 'bg-emerald-100 text-emerald-600' :
                    detail?.category === 'promotion' ? 'bg-amber-100 text-amber-600' :
                    detail?.category === 'product' ? 'bg-blue-100 text-blue-600' :
                    detail?.category === 'engagement' ? 'bg-pink-100 text-pink-600' :
                    'bg-indigo-100 text-indigo-600'
                  }`}>
                    <Bell size={32}/>
                  </div>
                  <h3 className="text-2xl font-bold mb-1 tracking-tight">
                    {detail?.title || (detail?.category ? detail.category.toUpperCase() : '')}
                  </h3>
                  <div className="text-base text-slate-700 whitespace-pre-line mb-2">{detail?.message}</div>
                  {detail?.link && (
                    <a href={detail.link} className="text-blue-500 underline text-xs block mb-2" target="_blank" rel="noopener noreferrer">Xem chi tiết</a>
                  )}
                  {detail?.image && (
                    <img src={detail.image} alt="notification" className="max-h-32 mb-2 rounded shadow" />
                  )}
                  <div className="flex flex-col items-center gap-1 mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                      detail?.status === 'unread' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {detail?.status === 'unread' ? 'Unread' : 'Read'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {detail?.createdAt ? new Date(detail.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[120px] text-slate-400">Not found</div>
              )}
            </div>
            <style>{`
              @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
              .animate-\[scaleIn_0.2s\] { animation: scaleIn 0.2s cubic-bezier(.4,0,.2,1); }
              .loader { border: 3px solid #e5e7eb; border-top: 3px solid #6366f1; border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite; }
              @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
