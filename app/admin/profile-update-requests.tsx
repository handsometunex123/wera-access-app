"use client";
import React, { useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

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
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <IdentificationIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">
              Profile update requests
            </h1>
            <p className="text-[11px] text-emerald-700">
              Review and approve changes to resident details.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Total pages</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>{totalPages}</span>
        </div>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Incoming requests</h2>
            <p className="text-[11px] text-emerald-700">Search by type, name or email.</p>
          </div>
          <div className="relative w-full sm:max-w-xs transition-all duration-300 ease-out sm:w-64 sm:focus-within:w-80 max-w-full">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500" />
            <input
              className="w-full rounded-full border border-emerald-100 bg-white px-7 py-1.5 pr-8 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Search by type, name, email..."
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
        {loading && <div className="text-[11px] text-emerald-800">Loading...</div>}
        {error && <div className="mb-2 text-[11px] font-semibold text-red-700">{error}</div>}

        {/* Mobile: stacked cards */}
        {!loading && requests.length > 0 && (
          <div className="space-y-3 md:hidden">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[13px] text-emerald-950 truncate">{req.user.fullName}</div>
                  <div className="text-[11px] text-emerald-700 truncate">{req.user.email}</div>
                  <div className="mt-1 text-[11px] text-emerald-900 break-words whitespace-normal">
                    {req.updateType}
                  </div>
                  <div className="mt-1 text-[10px] text-emerald-600">
                    {new Date(req.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-[11px]">
                  <button
                    className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                    onClick={() => handleAction(req.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
                    onClick={() => handleAction(req.id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && requests.length === 0 && (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
            No pending profile update requests.
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
                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                    <th className="px-4 py-2 text-left font-semibold">Created</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {requests.map((req) => (
                    <tr key={req.id} className="transition hover:bg-emerald-50/60">
                      <td className="px-4 py-2.5 align-middle">
                        <div className="flex flex-col">
                          <span className="truncate text-[13px] font-semibold text-emerald-950">
                            {req.user.fullName}
                          </span>
                          <span className="truncate text-[11px] text-emerald-700">{req.user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="truncate text-[11px] text-emerald-800">{req.user.email}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-800">{req.updateType}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-800">
                          {new Date(req.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2 text-[11px]">
                          <button
                            className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                            onClick={() => handleAction(req.id, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
                            onClick={() => handleAction(req.id, "reject")}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-[11px] text-emerald-800 bg-emerald-50/40"
                      >
                        No pending profile update requests.
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
