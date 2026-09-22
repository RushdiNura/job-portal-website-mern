import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiCheck } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import { getSocket } from "../services/socket.js";
import toast from "react-hot-toast";

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/**
 * Real notification center wired to the existing GET/PUT /api/notifications
 * API - this replaces what was previously a decorative, non-functional bell
 * icon in the navbar. Polls on an interval as a reliable baseline and also
 * listens for the "notification" socket event for near-instant updates when
 * the connection is live, without depending on the socket alone.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
      setError(false);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Baseline reliability: poll every 45s regardless of socket state, so
    // notifications still arrive even if the websocket connection drops.
    const interval = setInterval(load, 45000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNotification = () => load();
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, [load]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const handleEscape = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const markAllRead = async (e) => {
    e.stopPropagation();
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.put("/notifications/read-all");
    } catch (err) {
      setNotifications(previous);
      toast.error(getErrorMessage(err));
    }
  };

  const handleClick = async (notification) => {
    setOpen(false);
    if (!notification.read) {
      setNotifications((prev) => prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n)));
      api.put(`/notifications/${notification._id}/read`).catch(() => {});
    }
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        className="relative p-2.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-primary-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-primary-400 transition"
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 max-w-[90vw] max-h-[28rem] overflow-y-auto card shadow-lg z-50 animate-fadeIn"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 inline-flex items-center gap-1">
                <FiCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">Loading...</p>
          ) : error ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Couldn't load notifications.</p>
              <button onClick={load} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">Try again</button>
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">You're all caught up.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((n) => (
                <li key={n._id}>
                  <button
                    role="menuitem"
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      !n.read ? "bg-primary-50/50 dark:bg-primary-950/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" aria-hidden="true" />}
                      <div className={!n.read ? "" : "pl-3.5"}>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
