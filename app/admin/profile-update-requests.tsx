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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6">
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
        <div className="overflow-x-auto">
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
                  <td className="p-2 text-gray-900">{req.user.fullName}</td>
                  <td className="p-2 text-gray-900">{req.user.email}</td>
                  <td className="p-2 text-gray-900">{req.updateType}</td>
                  <td className="p-2 text-gray-900">{new Date(req.createdAt).toLocaleString()}</td>
                  <td className="p-2">
                    <button
                      className="text-emerald-900 underline font-semibold mr-2"
                      onClick={() => handleAction(req.id, "approve")}
                    >Approve</button>
                    <button
                      className="text-red-800 underline font-semibold"
                      onClick={() => handleAction(req.id, "reject")}
                    >Reject</button>
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
