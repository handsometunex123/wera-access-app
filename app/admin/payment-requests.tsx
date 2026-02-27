"use client";

import React, { useEffect, useState } from "react";
import CreatePaymentRequestForm from "./CreatePaymentRequestForm";

interface PaymentRequest {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  details?: string;
  rejectReason?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function PaymentRequestsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
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
      const res = await fetch(`/api/admin/payment-requests?page=${page}&search=${encodeURIComponent(search)}`);
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
    if (action === "approve") {
      if (!window.confirm("Mark this payment as PAID?")) return;
      setLoading(true);
      fetch(`/api/admin/payment-requests/${id}/approve`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
          if (data.error) setError(data.error);
          else fetchRequests();
        })
        .catch(() => setError("Network error"))
        .finally(() => setLoading(false));
    } else {
      const rejectReason = window.prompt("Enter reason for rejection:");
      if (!rejectReason) return;
      setLoading(true);
      fetch(`/api/admin/payment-requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectReason }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) setError(data.error);
          else fetchRequests();
        })
        .catch(() => setError("Network error"))
        .finally(() => setLoading(false));
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Payment Requests</h1>
        <CreatePaymentRequestForm onCreated={fetchRequests} />
        <div className="flex gap-2 mb-4">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Search by name, email..."
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
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-emerald-900">{req.user.fullName}</div>
                    <div className="text-xs text-gray-500">{req.user.email}</div>
                    <div className="mt-2 text-sm text-gray-800 break-words whitespace-normal">₦{req.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">{req.details || "-"}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(req.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {req.status === "PENDING" && (
                      <>
                        <button className="text-emerald-900 underline" onClick={() => handleAction(req.id, "approve")}>Mark as Paid</button>
                        <button className="text-red-700 underline" onClick={() => handleAction(req.id, "reject")}>Reject</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border text-sm text-gray-900">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">User</th>
                <th className="p-2">Email</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Description</th>
                <th className="p-2">Status</th>
                <th className="p-2">Reject Reason</th>
                <th className="p-2">Created</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="border-b">
                  <td className="p-2 text-gray-900">{req.user.fullName}</td>
                  <td className="p-2 text-gray-900">{req.user.email}</td>
                  <td className="p-2 text-gray-900">₦{req.amount.toLocaleString()}</td>
                  <td className="p-2 text-gray-900">{req.details || "-"}</td>
                  <td className="p-2 text-gray-900">{req.status}</td>
                  <td className="p-2 text-gray-900">{req.rejectReason || "-"}</td>
                  <td className="p-2 text-gray-900">{new Date(req.createdAt).toLocaleString()}</td>
                  <td className="p-2">
                    {req.status === "PENDING" && (
                      <>
                        <button
                          className="text-emerald-900 underline font-semibold mr-2"
                          onClick={() => handleAction(req.id, "approve")}
                        >Mark as Paid</button>
                        <button
                          className="text-red-800 underline font-semibold"
                          onClick={() => handleAction(req.id, "reject")}
                        >Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && !loading && (
                <tr><td colSpan={6} className="text-center p-4 text-gray-700">No payment requests.</td></tr>
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
