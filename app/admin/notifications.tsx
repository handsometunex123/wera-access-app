"use client";
import React, { useEffect, useState } from "react";
import {
  BellAlertIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

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
  const [role, setRole] = useState<string>("ALL");
  const [sending, setSending] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function toggleRead(id: string, read: boolean) {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
    setError("");
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to update notification state");
        // Re-sync from server on failure
        fetchNotifications();
      }
    } catch {
      setError("Network error updating notification");
      fetchNotifications();
    }
  }

  function openNotification(n: Notification) {
    setSelectedNotification(n);
    setIsModalOpen(true);
    if (!n.read) {
      toggleRead(n.id, true);
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedNotification(null);
  }

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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, role }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to send notification");
      else {
        setMessage("");
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
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <BellAlertIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">Notifications</h1>
            <p className="text-[11px] text-emerald-700">
              Send broadcast messages and review recent delivery.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Total pages</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>{totalPages}</span>
        </div>
      </header>

      {/* Compose notification */}
      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={handleSend}>
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium text-emerald-800">Message</label>
            <input
              className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1 sm:w-48">
            <label className="mb-1 block text-[11px] font-medium text-emerald-800">Audience</label>
            <select
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="ALL">All users</option>
              <option value="MAIN_RESIDENT">Residents</option>
              <option value="ESTATE_GUARD">Estate guards</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto rounded-full bg-emerald-700 px-4 py-2 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:bg-emerald-300 disabled:text-emerald-900/50"
            disabled={sending}
          >
            {sending
              ? "Sending..."
              : role === "ALL"
              ? "Send to all"
              : role === "MAIN_RESIDENT"
              ? "Send to residents"
              : "Send to guards"}
          </button>
        </form>
      </section>

      {/* List & search */}
      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Recent notifications</h2>
            <p className="text-[11px] text-emerald-700">Search by message, recipient name or email.</p>
          </div>
          <div className="relative w-full sm:max-w-xs transition-all duration-300 ease-out sm:w-64 sm:focus-within:w-80 max-w-full">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500" />
            <input
              className="w-full rounded-full border border-emerald-100 bg-white px-7 py-1.5 pr-8 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Search by message, name, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                aria-label="Clear search"
              >
                <span className="text-[10px] font-bold">×</span>
              </button>
            )}
          </div>
        </div>
        {loading && (
          <div className="mb-3 space-y-3">
            {/* Mobile skeleton notifications */}
            <div className="space-y-3 md:hidden">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm animate-pulse"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-3 w-32 rounded-full bg-emerald-50" />
                    <div className="h-2.5 w-40 rounded-full bg-emerald-50" />
                    <div className="h-2.5 w-48 rounded-full bg-emerald-50" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-5 w-16 rounded-full bg-emerald-50" />
                    <div className="h-6 w-16 rounded-full bg-emerald-50" />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop skeleton rows */}
            <div className="hidden md:block">
              <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/80">
                <div className="max-h-[480px] overflow-y-auto">
                  <div className="divide-y divide-emerald-50">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-2.5 text-xs animate-pulse"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-40 rounded-full bg-emerald-50" />
                          <div className="h-2.5 w-32 rounded-full bg-emerald-50" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-6 w-16 rounded-full bg-emerald-50" />
                          <div className="h-6 w-16 rounded-full bg-emerald-50" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {error && <div className="mb-2 text-[11px] font-semibold text-red-700">{error}</div>}

        {/* Mobile: stacked notifications (blur unread content until opened) */}
        {!loading && notifications.length > 0 && (
          <div className="space-y-3 md:hidden">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={
                  "flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm transition " +
                  (n.read ? "" : "opacity-70")
                }
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] text-emerald-950 truncate">{n.user.fullName}</div>
                  <div className="text-[11px] text-emerald-700 truncate">{n.user.email}</div>
                  <div
                    className={
                      "mt-1 text-[11px] text-emerald-900 break-words whitespace-normal " +
                      (n.read ? "" : "blur-sm select-none")
                    }
                  >
                    {n.message}
                  </div>
                  <div className="mt-1 text-[10px] text-emerald-600">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end gap-1 text-[10px]">
                  <span
                    className={
                      "inline-flex items-center rounded-full px-2 py-0.5 font-medium " +
                      (n.read ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")
                    }
                  >
                    {n.read ? "Read" : "Unread"}
                  </span>
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className="mt-0.5 rounded-full border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-50"
                  >
                    Read
                  </button>
                  {n.read && (
                    <button
                      type="button"
                      onClick={() => toggleRead(n.id, false)}
                      className="text-[10px] text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                    >
                      Unread
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/80">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="min-w-full text-xs text-emerald-950">
                <thead className="bg-emerald-50/80 text-[11px] uppercase tracking-wide text-emerald-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">User</th>
                    <th className="px-4 py-2 text-left font-semibold">Email</th>
                    <th className="px-4 py-2 text-left font-semibold">Message</th>
                    <th className="px-4 py-2 text-left font-semibold">Created</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {notifications.map((n) => (
                    <tr
                      key={n.id}
                      className={
                        "transition hover:bg-emerald-50/60 " +
                        (n.read ? "" : "bg-amber-50/20")
                      }
                    >
                      <td className="px-4 py-2.5 align-middle">
                        <div className="flex flex-col">
                          <span className="truncate text-[13px] font-semibold text-emerald-950">{n.user.fullName}</span>
                          <span className="truncate text-[11px] text-emerald-700">{n.user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="truncate text-[11px] text-emerald-800">{n.user.email}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span
                          className={
                            "text-[11px] text-emerald-900 " +
                            (n.read ? "" : "blur-sm select-none")
                          }
                        >
                          {n.message}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-800">{new Date(n.createdAt).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                            (n.read ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")
                          }
                        >
                          {n.read ? "Read" : "Unread"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-right text-[11px] text-emerald-700 space-y-1">
                        <button
                          type="button"
                          onClick={() => openNotification(n)}
                          className="inline-flex items-center rounded-full border border-emerald-200 px-3 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-50"
                        >
                          Read
                        </button>
                        {n.read && (
                          <button
                            type="button"
                            onClick={() => toggleRead(n.id, false)}
                            className="block w-full text-right text-[10px] text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                          >
                            Unread
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {notifications.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-[11px] text-emerald-800 bg-emerald-50/40"
                      >
                        No notifications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notification detail modal */}
        {isModalOpen && selectedNotification && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-950">
                    Notification for {selectedNotification.user.fullName}
                  </h3>
                  <p className="text-[11px] text-emerald-700">{selectedNotification.user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  Close
                </button>
              </div>
              <div className="mb-3 rounded-xl bg-emerald-50/60 p-3">
                <p className="text-[11px] text-emerald-900 whitespace-pre-wrap break-words">
                  {selectedNotification.message}
                </p>
              </div>
              <div className="text-[10px] text-emerald-700">
                Sent on {new Date(selectedNotification.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-4 flex flex-col items-center justify-between gap-2 text-[11px] sm:flex-row">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-900 border border-emerald-100">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="px-2 text-[11px] font-medium text-emerald-900">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40"
            >
              Next
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
