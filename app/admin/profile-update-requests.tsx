"use client";
import React, { useEffect, useState } from "react";

interface ProfileUpdateRequest {
  id: string;
  updateType: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function ProfileUpdateRequestsPage() {
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, [page, search]);

  async function fetchRequests() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/profile-update-requests?page=${page}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load requests");
      else {
        setRequests(data.requests);
        // Always show at least 1 page
        setTotalPages(Math.max(1, data.totalPages));
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleAction(id: string, action: "approve" | "reject") {
    if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
    setLoading(true);
    fetch(`/api/admin/profile-update-requests/${id}/${action}`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else fetchRequests();
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-full sm:max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-4 md:p-6">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Profile Update Requests</h1>
        <div className="flex gap-2 mb-4">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Search by type, name, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-800 mb-2">{error}</div>}
        {/* Mobile: stacked cards */}
        {!loading && requests.length > 0 && (
          <div className="space-y-3 md:hidden">
            {requests.map(req => (
              <div key={req.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-emerald-900 truncate">{req.user.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">{req.user.email}</div>
                    <div className="mt-2 text-sm text-gray-800 break-words whitespace-normal">{req.updateType}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(req.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-32 sm:w-auto">
                    <button className="w-full sm:w-auto text-center text-emerald-900 bg-emerald-100/40 px-3 py-1 rounded text-sm" onClick={() => handleAction(req.id, 'approve')}>Approve</button>
                    <button className="w-full sm:w-auto text-center text-red-700 bg-red-100/40 px-3 py-1 rounded text-sm" onClick={() => handleAction(req.id, 'reject')}>Reject</button>
                  </div>
                </div>
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
                <th className="p-2">Type</th>
                <th className="p-2">Created</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="border-b">
                  <td className="p-2 text-gray-900 min-w-0">{req.user.fullName}</td>
                  <td className="p-2 text-gray-900 min-w-0">{req.user.email}</td>
                  <td className="p-2 text-gray-900 min-w-0">{req.updateType}</td>
                  <td className="p-2 text-gray-900">{new Date(req.createdAt).toLocaleString()}</td>
                  <td className="p-2">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        className="px-2 py-1 bg-emerald-100 text-emerald-900 rounded text-sm"
                        onClick={() => handleAction(req.id, "approve")}
                      >Approve</button>
                      <button
                        className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm"
                        onClick={() => handleAction(req.id, "reject")}
                      >Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && !loading && (
                <tr><td colSpan={5} className="text-center p-4 text-gray-700">No pending requests.</td></tr>
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
          <span className="text-gray-900">Page {page} of {totalPages}</span>
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
