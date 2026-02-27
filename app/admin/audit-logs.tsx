"use client";
import React, { useEffect, useState } from "react";

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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-full sm:max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-4 md:p-6">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Audit Logs</h1>
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="border rounded px-3 py-2 w-48 text-gray-900 placeholder-gray-700"
            placeholder="User name..."
            value={user}
            onChange={e => { setUser(e.target.value); setPage(1); }}
          />
          <input
            className="border rounded px-3 py-2 w-48 text-gray-900 placeholder-gray-700"
            placeholder="Action..."
            value={action}
            onChange={e => { setAction(e.target.value); setPage(1); }}
          />
          <input
            type="date"
            className="border rounded px-3 py-2 text-gray-900"
            value={from}
            onChange={e => { setFrom(e.target.value); setPage(1); }}
          />
          <input
            type="date"
            className="border rounded px-3 py-2 text-gray-900"
            value={to}
            onChange={e => { setTo(e.target.value); setPage(1); }}
          />
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-800 mb-2">{error}</div>}
        {/* Mobile cards */}
        {!loading && logs.length > 0 && (
          <div className="space-y-3 md:hidden">
            {logs.map(log => (
              <div key={log.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="font-semibold text-emerald-900">{log.user.fullName}</div>
                <div className="text-xs text-gray-500">{log.user.email}</div>
                <div className="mt-2 text-sm text-gray-800 break-words whitespace-normal">{log.action}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(log.createdAt).toLocaleString()}</div>
                {log.metadata && <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap break-words break-all max-w-full">{log.metadata}</pre>}
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border text-sm text-gray-900">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">User</th>
                <th className="p-2">Email</th>
                <th className="p-2">Action</th>
                <th className="p-2">Metadata</th>
                <th className="p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b">
                  <td className="p-2 text-gray-900">{log.user.fullName}</td>
                  <td className="p-2 text-gray-900">{log.user.email}</td>
                  <td className="p-2 text-gray-900">{log.action}</td>
                  <td className="p-2 text-gray-900 break-words break-all max-w-xs">{log.metadata}</td>
                  <td className="p-2 text-gray-900">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr><td colSpan={5} className="text-center p-4 text-gray-700">No audit logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-3 py-1 rounded bg-emerald-300 text-emerald-900 font-bold disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >Prev</button>
          <span className="text-gray-900 font-bold">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-emerald-300 text-emerald-900 font-bold disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >Next</button>
        </div>
      </div>
    </div>
  );
}
