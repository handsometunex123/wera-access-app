"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface Request {
  id: string;
  dependant: { id: string; fullName: string; email: string };
  mainResident: { id: string; fullName: string; email: string };
  reason: string;
  status: string;
  type: string;
  createdAt: string;
}

export default function DependantPermissionRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dependant-permission-requests")
      .then(res => res.json())
      .then(data => setRequests(data.requests || []))
      .catch(() => setError("Failed to load requests"))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    const res = await fetch(`/api/admin/dependant-permission-requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.success) {
      setRequests(requests.map(r => r.id === id ? { ...r, status: action } : r));
      toast.success(`Request ${action.toLowerCase()}`);
    } else {
      toast.error(data.error || "Failed to update request");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-emerald-900 mb-4 text-center">Dependant Permission Requests</h1>
        {loading ? (
          <div className="text-center text-emerald-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-700">{error}</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-gray-500">No requests found.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {requests.map(req => (
              <div key={req.id} className="border rounded-lg p-4 flex flex-col gap-2 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-emerald-800">{req.dependant.fullName} ({req.dependant.email})</span>
                  <span className={`text-xs font-bold rounded px-2 py-1 ${req.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : req.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{req.status}</span>
                </div>
                <div className="text-xs text-gray-500">Main Resident: {req.mainResident.fullName} ({req.mainResident.email})</div>
                <div className="text-xs text-gray-400">Reason: {req.reason}</div>
                <div className="text-xs text-gray-400">Requested: {new Date(req.createdAt).toLocaleString()}</div>
                {req.status === "PENDING" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold shadow text-xs"
                      onClick={() => handleAction(req.id, "APPROVED")}
                    >
                      Approve
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 font-semibold shadow text-xs"
                      onClick={() => handleAction(req.id, "REJECTED")}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
