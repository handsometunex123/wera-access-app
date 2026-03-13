"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  BanknotesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import CreatePaymentRequestForm from "./CreatePaymentRequestForm";

interface PaymentRequest {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  details?: string;
  rejectReason?: string;
   paymentProofUrl?: string | null;
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

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

  function openProofViewer(url: string) {
    setViewProofUrl(url);
    setShowProofModal(true);
  }

  function closeProofViewer() {
    setShowProofModal(false);
    setViewProofUrl(null);
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
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <BanknotesIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">Payment requests</h1>
            <p className="text-[11px] text-emerald-700">
              Track and mark estate payments as paid or rejected.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Pending</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>{requests.filter((r) => r.status === "PENDING").length}</span>
        </div>
      </header>

      {/* Create new request */}
      <section className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Create payment request</h2>
            <p className="text-[11px] text-emerald-700">
              Log a one-off or recurring estate fee with clear details.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 text-[11px] sm:flex-row sm:items-center sm:gap-3">
            <div className="hidden text-emerald-700 sm:block">
              <span className="font-medium text-emerald-900">
                {requests.filter((r) => r.status === "PENDING").length}
              </span>{" "}
              pending payment{requests.filter((r) => r.status === "PENDING").length === 1 ? "" : "s"}
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
            >
              + Create payment request
            </button>
          </div>
        </div>
      </section>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <button
              type="button"
              className="absolute right-3 top-3 text-lg text-emerald-900"
              onClick={() => setShowCreateModal(false)}
              aria-label="Close dialog"
            >
              &times;
            </button>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">New payment request</h2>
              <p className="text-[11px] text-emerald-700">
                Fill in the details below to log a new payment for a resident.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 px-3 py-3 sm:px-4">
              <CreatePaymentRequestForm
                onCreated={() => {
                  fetchRequests();
                  setShowCreateModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* List & search */}
      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Payment history</h2>
            <p className="text-[11px] text-emerald-700">Search by resident name or email.</p>
          </div>
          <div className="relative w-full sm:max-w-xs transition-all duration-300 ease-out sm:w-64 sm:focus-within:w-80 max-w-full">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500" />
            <input
              className="w-full rounded-full border border-emerald-100 bg-white px-7 py-1.5 pr-8 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Search by name, email..."
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
            {/* Mobile skeleton cards */}
            <div className="space-y-3 md:hidden">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm animate-pulse"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-3 w-32 rounded-full bg-emerald-50" />
                    <div className="h-2.5 w-40 rounded-full bg-emerald-50" />
                    <div className="h-2.5 w-24 rounded-full bg-emerald-50" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-5 w-20 rounded-full bg-emerald-50" />
                    <div className="h-6 w-20 rounded-full bg-emerald-50" />
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

        {/* Mobile: stacked cards */}
        {!loading && requests.length > 0 && (
          <div className="space-y-3 md:hidden">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] text-emerald-950 truncate">{req.user.fullName}</div>
                  <div className="text-[11px] text-emerald-700 truncate">{req.user.email}</div>
                  <div className="mt-1 text-[13px] font-semibold text-emerald-900">
                    ₦{req.amount.toLocaleString()}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-800 break-words whitespace-normal">
                    {req.details || "-"}
                  </div>
                  {req.paymentProofUrl && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-100">
                      <EyeIcon className="h-3 w-3" />
                      <span>Proof uploaded</span>
                    </div>
                  )}
                  <div className="mt-1 text-[10px] text-emerald-600">{new Date(req.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end gap-1 text-[11px]">
                  <span
                    className={
                      "inline-flex items-center rounded-full px-2 py-0.5 font-medium " +
                      (req.status === "PENDING"
                        ? "bg-amber-50 text-amber-800"
                        : req.status === "PAID"
                        ? "bg-emerald-600 text-emerald-50"
                        : "bg-rose-50 text-rose-700")
                    }
                  >
                    {req.status}
                  </span>
                  {req.paymentProofUrl && (
                    <button
                      type="button"
                      onClick={() => openProofViewer(req.paymentProofUrl!)}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 border border-emerald-100"
                    >
                      <EyeIcon className="h-3 w-3" />
                      View proof
                    </button>
                  )}
                  {req.status === "PENDING" && (
                    <>
                      <button
                        className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                        disabled={!req.paymentProofUrl}
                        title={
                          !req.paymentProofUrl
                            ? "Waiting for resident to upload proof"
                            : undefined
                        }
                        onClick={() => handleAction(req.id, "approve")}
                      >
                        Mark as paid
                      </button>
                      <button
                        className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
                        onClick={() => handleAction(req.id, "reject")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && requests.length === 0 && (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
            No payment requests found.
          </div>
        )}

        {/* Desktop: table */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/80">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="min-w-full text-xs text-emerald-950">
                <thead className="bg-emerald-50/80 text-[11px] uppercase tracking-wide text-emerald-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">User</th>
                    <th className="px-4 py-2 text-left font-semibold">Email</th>
                    <th className="px-4 py-2 text-left font-semibold">Amount</th>
                    <th className="px-4 py-2 text-left font-semibold">Description</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Reject reason</th>
                    <th className="px-4 py-2 text-left font-semibold">Proof</th>
                    <th className="px-4 py-2 text-left font-semibold">Created</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {requests.map((req) => (
                    <tr key={req.id} className="transition hover:bg-emerald-50/60">
                      <td className="px-4 py-2.5 align-middle">
                        <div className="flex flex-col">
                          <span className="truncate text-[13px] font-semibold text-emerald-950">{req.user.fullName}</span>
                          <span className="truncate text-[11px] text-emerald-700">{req.user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="truncate text-[11px] text-emerald-800">{req.user.email}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] font-semibold text-emerald-900">
                          ₦{req.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-800">{req.details || "-"}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                            (req.status === "PENDING"
                              ? "bg-amber-50 text-amber-800"
                              : req.status === "PAID"
                              ? "bg-emerald-600 text-emerald-50"
                              : "bg-rose-50 text-rose-700")
                          }
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-800">{req.rejectReason || "-"}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        {req.paymentProofUrl ? (
                          <button
                            type="button"
                            onClick={() => openProofViewer(req.paymentProofUrl!)}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100 border border-emerald-100"
                          >
                            <EyeIcon className="h-3 w-3" />
                            View proof
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600">No proof yet</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-800">{new Date(req.createdAt).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-right">
                        {req.status === "PENDING" && (
                          <div className="flex flex-wrap items-center justify-end gap-2 text-[11px]">
                            <button
                              className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={!req.paymentProofUrl}
                              title={
                                !req.paymentProofUrl
                                  ? "Waiting for resident to upload proof"
                                  : undefined
                              }
                              onClick={() => handleAction(req.id, "approve")}
                            >
                              Mark as paid
                            </button>
                            <button
                              className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
                              onClick={() => handleAction(req.id, "reject")}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-6 text-center text-[11px] text-emerald-800 bg-emerald-50/40"
                      >
                        No payment requests found.
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
      {showProofModal && viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:p-5">
            <button
              type="button"
              className="absolute right-3 top-3 text-lg text-emerald-900"
              onClick={closeProofViewer}
              aria-label="Close dialog"
            >
              &times;
            </button>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Resident payment proof</h2>
              <p className="text-[11px] text-emerald-700">
                Review this before confirming a payment as PAID.
              </p>
            </div>
            <div className="relative mx-auto mb-3 h-64 w-full max-w-sm">
              <Image
                src={viewProofUrl}
                alt="Resident payment proof"
                fill
                className="rounded-2xl border border-emerald-100 object-contain bg-slate-50"
                unoptimized
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <a
                href={viewProofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:text-emerald-800"
              >
                Open in new tab
              </a>
              <button
                type="button"
                onClick={closeProofViewer}
                className="rounded-full bg-emerald-700 px-4 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
