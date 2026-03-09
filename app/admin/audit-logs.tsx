"use client";
import React, { useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface AuditLog {
  id: string;
  action: string;
  metadata: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [page, user, action, from, to]);

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        user,
        action,
        from,
        to,
      });
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load logs");
      else {
        setLogs(data.logs);
        // Always show at least 1 page
        setTotalPages(Math.max(1, data.totalPages));
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <ClipboardDocumentListIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">Audit logs</h1>
            <p className="text-[11px] text-emerald-700">
              Inspect security-sensitive actions taken by admins and users.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Pages</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>{totalPages}</span>
        </div>
      </header>

      {/* Filters */}
      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full xs:w-auto xs:flex-1 sm:max-w-xs transition-all duration-300 ease-out sm:w-64 sm:focus-within:w-80 max-w-full">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500" />
            <input
              className="w-full rounded-full border border-emerald-100 bg-white px-7 py-1.5 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Filter by user name..."
              value={user}
              onChange={(e) => {
                setUser(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <input
            className="w-full rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:w-48"
            placeholder="Action contains..."
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          />
          <input
            type="date"
            className="w-full rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[11px] text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:w-40"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <input
            type="date"
            className="w-full rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[11px] text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:w-40"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {loading && (
          <div className="mt-3 space-y-2 text-[11px] text-emerald-700">
            <div className="h-2.5 w-40 rounded-full bg-emerald-50" />
            <div className="h-2.5 w-32 rounded-full bg-emerald-50" />
          </div>
        )}
        {error && <div className="mt-2 text-[11px] font-semibold text-red-700">{error}</div>}
      </section>

      {/* Results */}
      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        {/* Mobile cards */}
        {!loading && logs.length > 0 && (
          <div className="space-y-3 md:hidden">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm"
              >
                <div className="font-semibold text-[13px] text-emerald-950">{log.user.fullName}</div>
                <div className="text-[11px] text-emerald-700">{log.user.email}</div>
                <div className="mt-1 text-[11px] text-emerald-900 break-words whitespace-normal">{log.action}</div>
                <div className="mt-1 text-[10px] text-emerald-600">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
                {log.metadata && (
                  <pre className="mt-2 max-w-full whitespace-pre-wrap break-words break-all text-[10px] text-emerald-800">
                    {log.metadata}
                  </pre>
                )}
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
                    <th className="px-4 py-2 text-left font-semibold">Action</th>
                    <th className="px-4 py-2 text-left font-semibold">Metadata</th>
                    <th className="px-4 py-2 text-left font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-emerald-50/60">
                      <td className="px-4 py-2.5 align-middle">
                        <div className="flex flex-col">
                          <span className="truncate text-[13px] font-semibold text-emerald-950">{log.user.fullName}</span>
                          <span className="truncate text-[11px] text-emerald-700">{log.user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="truncate text-[11px] text-emerald-800">{log.user.email}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-900">{log.action}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="max-w-xs break-words break-all text-[10px] text-emerald-800">
                          {log.metadata}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-800">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-[11px] text-emerald-800 bg-emerald-50/40"
                      >
                        No audit logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

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
