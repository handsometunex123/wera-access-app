"use client";
import React, { useEffect, useState } from "react";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("ALL");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, [page, search]);

  async function fetchNotifications() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/notifications?page=${page}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load notifications");
      else {
        setNotifications(data.notifications);
        // Always show at least 1 page
        setTotalPages(Math.max(1, data.totalPages));
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleMarkRead(id: string) {
    setLoading(true);
    fetch(`/api/admin/notifications/${id}/mark-read`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else fetchNotifications();
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message, role }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to send notification");
      else {
        setMessage("");
        setUserId(null);
        setRole("ALL");
        fetchNotifications();
      }
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h1>
        <form className="mb-6 flex gap-2 items-end" onSubmit={handleSend}>
          <input
            className="border border-gray-400 rounded px-3 py-2 w-96 text-gray-900 placeholder-gray-500 focus:border-emerald-800 focus:ring-emerald-800 focus:outline-none"
            placeholder="Notification message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
          <select
            className="border border-gray-400 rounded px-3 py-2 text-gray-900 focus:border-emerald-800 focus:ring-emerald-800 focus:outline-none"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="ALL">All Users</option>
            <option value="MAIN_RESIDENT">Residents</option>
            <option value="ESTATE_GUARD">Estate Guards</option>
          </select>
          <button
            type="submit"
            className="bg-emerald-800 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-900 transition disabled:bg-emerald-300 disabled:text-gray-400"
            disabled={sending}
          >{sending ? "Sending..." : role === "ALL" ? "Send to All" : role === "MAIN_RESIDENT" ? "Send to Residents" : "Send to Guards"}</button>
        </form>
        <div className="flex gap-2 mb-4">
          <input
            className="border border-gray-400 rounded px-3 py-2 w-full text-gray-900 placeholder-gray-500 focus:border-emerald-800 focus:ring-emerald-800 focus:outline-none"
            placeholder="Search by message, name, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {loading && <div className="text-gray-900">Loading...</div>}
        {error && <div className="text-red-900 mb-2 font-semibold">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-gray-900">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-gray-900">User</th>
                <th className="p-2 text-gray-900">Email</th>
                <th className="p-2 text-gray-900">Message</th>
                <th className="p-2 text-gray-900">Created</th>
                <th className="p-2 text-gray-900">Read</th>
                <th className="p-2 text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n.id} className="border-b">
                  <td className="p-2 text-gray-900">{n.user.fullName}</td>
                  <td className="p-2 text-gray-900">{n.user.email}</td>
                  <td className="p-2 text-gray-900">{n.message}</td>
                  <td className="p-2 text-gray-900">{new Date(n.createdAt).toLocaleString()}</td>
                  <td className="p-2 text-gray-900">{n.read ? "Yes" : "No"}</td>
                  <td className="p-2">
                    {!n.read && (
                      <button
                        className="text-emerald-900 underline font-semibold hover:text-emerald-800 focus:text-emerald-800 focus:outline-none"
                        onClick={() => handleMarkRead(n.id)}
                      >Mark Read</button>
                    )}
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && !loading && (
                <tr><td colSpan={6} className="text-center p-4 text-gray-800">No notifications found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-3 py-1 rounded bg-emerald-800 text-white font-bold disabled:opacity-50 disabled:bg-emerald-200 disabled:text-gray-400 transition"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >Prev</button>
          <span className="text-gray-900 font-semibold">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-emerald-800 text-white font-bold disabled:opacity-50 disabled:bg-emerald-200 disabled:text-gray-400 transition"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >Next</button>
        </div>
      </div>
    </div>
  );
}
