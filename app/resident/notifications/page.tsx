"use client";
import React, { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { RiRefreshLine } from "react-icons/ri";

interface Notification {
  id: string;
  title: string;
  subtitle?: string;
  createdAt: string;
  type: string;
}

export default function ResidentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const fetchNotifications = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resident/notifications?page=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.page || page);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <BackButton />
          <h1 className="text-xl font-bold text-emerald-900">Notifications</h1>
          <div className="w-10" />
        </div>
        {loading ? (
          <div className="text-center text-emerald-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-700">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-500">No notifications yet.</div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-3">
              <div />
              <div className="flex items-center gap-3">
                <button
                  aria-label="Refresh notifications"
                  onClick={() => fetchNotifications(currentPage)}
                  className="p-2 rounded-full hover:bg-gray-100 flex items-center gap-2"
                >
                  <RiRefreshLine className="h-5 w-5 text-emerald-700" />
                  <span className="text-sm text-emerald-700">Refresh</span>
                </button>
              </div>
            </div>
            <ul className="flex flex-col gap-3">
              {notifications.map((n) => (
                <li key={n.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">{n.title}</h3>
                    <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  {n.subtitle ? <p className="text-xs text-gray-600 mt-1">{n.subtitle}</p> : null}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">Total: {total}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (currentPage > 1) fetchNotifications(currentPage - 1);
                  }}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                >
                  Prev
                </button>
                <div className="text-sm text-gray-700">Page {currentPage} / {totalPages}</div>
                <button
                  onClick={() => {
                    if (currentPage < totalPages) fetchNotifications(currentPage + 1);
                  }}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}