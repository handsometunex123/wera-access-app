"use client";
import React, { useEffect, useState } from "react";

interface Notification {
  id: string;
  message: string;
  createdAt: string;
  type: string;
}

export default function ResidentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resident/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-emerald-900 mb-4 text-center">Notifications</h1>
        {loading ? (
          <div className="text-center text-emerald-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-700">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-500">No notifications yet.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {notifications.map(n => (
              <li key={n.id} className="border rounded-lg p-3 bg-gray-50 flex flex-col gap-1">
                <span className="text-sm text-gray-800">{n.message}</span>
                <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}