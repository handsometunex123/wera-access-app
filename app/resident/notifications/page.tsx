"use client";
import React, { useEffect, useState } from "react";
import ResidentBackToDashboard from "@/components/ResidentBackToDashboard";
import { BellAlertIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

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
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <ResidentBackToDashboard />
        <p className="hidden text-[11px] text-emerald-700 md:inline">Stay on top of estate updates and alerts.</p>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <BellAlertIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">Notifications</h1>
            <p className="text-[11px] text-emerald-700">Stay on top of estate updates and alerts.</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Total</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>{total}</span>
        </div>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white/95 p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Your notifications</h2>
            <p className="text-[11px] text-emerald-700">Newest messages from your estate admins appear here.</p>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 sm:mt-0">Page {currentPage} of {totalPages}</div>
        </div>

        {loading ? (
          <div className="text-[11px] text-emerald-800">Loading...</div>
        ) : error ? (
          <div className="text-[11px] font-semibold text-red-700">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
            No notifications yet.
          </div>
        ) : (
          <>
            <ul className="space-y-3 mb-4">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13px] text-emerald-950 truncate">{n.title}</div>
                    {n.subtitle && (
                      <div className="mt-0.5 text-[11px] text-emerald-800 break-words whitespace-normal">{n.subtitle}</div>
                    )}
                    <div className="mt-1 text-[10px] text-emerald-600">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px]">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 border border-emerald-100">
                      {n.type}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => currentPage > 1 && fetchNotifications(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => currentPage < totalPages && fetchNotifications(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40 disabled:hover:bg-white"
              >
                Next
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}