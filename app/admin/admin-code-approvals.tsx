"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useNotify } from "@/components/useNotify";

interface ResidentInfo {
  id: string;
  fullName: string | null;
  email: string | null;
  address: string | null;
  phoneNumber: string | null;
}

interface AdminCode {
  id: string;
  code: string;
  purpose: string | null;
  itemDetails: string | null;
  itemImageUrl: string | null;
  inviteStart: string;
  inviteEnd: string;
  adminApprovalStatus: string;
  createdAt: string;
  createdBy: ResidentInfo | null;
}

interface ListResponse {
  codes: AdminCode[];
  total: number;
  totalPages: number;
}

export default function AdminCodeApprovalsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [search, setSearch] = useState("");
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const notify = useNotify();

  async function fetchCodes(currentPage = 1, currentStatus = statusFilter, currentSearch = search) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("status", currentStatus);
      if (currentSearch.trim()) params.set("search", currentSearch.trim());
      const res = await fetch(`/api/admin/admin-code-approvals?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load admin codes");
      }
      const data: ListResponse = await res.json();
      setCodes(data.codes || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to load admin codes";
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCodes(1, statusFilter, search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
    // fetchCodes depends on state args passed explicitly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search]);

  const openApproveModal = (codeId: string) => {
    setApproveTargetId(codeId);
    setApproveModalOpen(true);
  };

  const handleApprove = async () => {
    if (!approveTargetId) return;
    const codeId = approveTargetId;
    try {
      const res = await fetch("/api/admin/admin-code-approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId, action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve code");
      notify("Admin code approved", "success");
      setApproveModalOpen(false);
      setApproveTargetId(null);
      // remove from list if we are on pending view
      if (statusFilter === "PENDING") {
        setCodes(prev => prev.filter(c => c.id !== codeId));
      } else {
        fetchCodes(page, statusFilter, search);
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to approve code";
      notify(message, "error");
    }
  };

  const openRejectModal = (codeId: string) => {
    setRejectTargetId(codeId);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTargetId) return;
    if (!rejectReason.trim()) {
      notify("Rejection reason is required", "error");
      return;
    }
    try {
      const res = await fetch("/api/admin/admin-code-approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId: rejectTargetId, action: "reject", rejectionReason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject code");
      notify("Admin code rejected", "success");
      setRejectModalOpen(false);
      setRejectTargetId(null);
      setRejectReason("");
      if (statusFilter === "PENDING") {
        setCodes(prev => prev.filter(c => c.id !== rejectTargetId));
      } else {
        fetchCodes(page, statusFilter, search);
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to reject code";
      notify(message, "error");
    }
  };

  const openResidentDetails = (residentId?: string | null) => {
    if (!residentId) return;
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("residentId", residentId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const formatDate = (value: string) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      return d.toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">
              Admin code approvals
            </h1>
            <p className="text-[11px] text-emerald-700">
              Review resident-generated admin codes and decide if they can be used.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Filter</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span className="capitalize">{statusFilter.toLowerCase()}</span>
        </div>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Filters</h2>
            <p className="text-[11px] text-emerald-700">
              Switch status tabs and search by code, purpose or resident name.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 p-1 text-[11px] text-emerald-900 border border-emerald-100">
            {(["PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                  fetchCodes(1, status, search);
                }}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  statusFilter === status
                    ? "bg-emerald-700 text-emerald-50 shadow-sm"
                    : "bg-transparent text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-full transition-all duration-300 ease-out sm:w-72 sm:max-w-sm sm:focus-within:w-80">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, purpose, or resident name"
              className="w-full rounded-full border border-emerald-100 bg-white px-7 py-1.5 pr-8 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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

        <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/80">
          <div className="max-h-[500px] overflow-x-auto">
            <table className="min-w-full text-xs text-emerald-950">
              <thead className="bg-emerald-50/80 text-[11px] uppercase tracking-wide text-emerald-700">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Code</th>
                  <th className="px-4 py-2 text-left font-semibold">Resident</th>
                  <th className="px-4 py-2 text-left font-semibold">Purpose</th>
                  <th className="px-4 py-2 text-left font-semibold">Validity</th>
                  <th className="px-4 py-2 text-left font-semibold">Item</th>
                  <th className="px-4 py-2 text-left font-semibold">Image</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {codes.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800"
                    >
                      No admin codes found for this filter.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-[11px] text-emerald-800"
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading &&
                  codes.map((code) => (
                    <tr key={code.id} className="transition hover:bg-emerald-50/60">
                      <td className="px-4 py-2.5 align-middle">
                        <span className="font-mono text-[11px] text-emerald-950">{code.code}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => openResidentDetails(code.createdBy?.id || null)}
                            className="truncate text-left text-[11px] font-medium text-emerald-950 hover:underline hover:underline-offset-2"
                          >
                            {code.createdBy?.fullName || "-"}
                          </button>
                          <span className="text-[10px] text-emerald-700">
                            {code.createdBy?.email || ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <div
                          className="max-w-xs truncate text-[11px] text-emerald-900"
                          title={code.purpose || undefined}
                        >
                          {code.purpose || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <div className="text-[10px] text-emerald-800">
                          <div>{formatDate(code.inviteStart)}</div>
                          <div className="text-emerald-500">to</div>
                          <div>{formatDate(code.inviteEnd)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <div className="max-w-xs max-h-16 overflow-y-auto whitespace-pre-wrap break-words text-[11px] text-emerald-800">
                          {code.itemDetails || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        {code.itemImageUrl ? (
                          <div className="relative h-16 w-16 overflow-hidden rounded border border-emerald-100">
                            <Image
                              src={code.itemImageUrl}
                              alt="Item"
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-500">No image</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            code.adminApprovalStatus === "PENDING"
                              ? "bg-amber-50 text-amber-800"
                              : code.adminApprovalStatus === "APPROVED"
                              ? "bg-emerald-600 text-emerald-50"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {code.adminApprovalStatus}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-right">
                        {statusFilter === "PENDING" && (
                          <div className="flex flex-wrap items-center justify-end gap-2 text-[11px]">
                            <button
                              onClick={() => openApproveModal(code.id)}
                              className="inline-flex items-center rounded-full bg-emerald-700 px-2.5 py-1 font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(code.id)}
                              className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-2 text-[11px] text-emerald-900 sm:flex-row">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-900 border border-emerald-100">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  const nextPage = Math.max(1, page - 1);
                  setPage(nextPage);
                  fetchCodes(nextPage, statusFilter, search);
                }}
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
                onClick={() => {
                  const nextPage = Math.min(totalPages, page + 1);
                  setPage(nextPage);
                  fetchCodes(nextPage, statusFilter, search);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40"
              >
                Next
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {approveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <button
              type="button"
              className="absolute right-3 top-3 text-lg text-emerald-900"
              onClick={() => {
                setApproveModalOpen(false);
                setApproveTargetId(null);
              }}
              aria-label="Close dialog"
            >
              &times;
            </button>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Approve admin code</h2>
              <p className="text-[11px] text-emerald-700">Confirm approval to make this admin code active for resident use.</p>
            </div>
            <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 p-3 sm:p-4">
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                  onClick={() => {
                    setApproveModalOpen(false);
                    setApproveTargetId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
                  onClick={handleApprove}
                >
                  Confirm approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <button
              type="button"
              className="absolute right-3 top-3 text-lg text-emerald-900"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectTargetId(null);
                setRejectReason("");
              }}
              aria-label="Close dialog"
            >
              &times;
            </button>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Reject admin code</h2>
              <p className="text-[11px] text-emerald-700">Provide a rejection reason to send to the resident.</p>
            </div>
            <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 p-3 sm:p-4">
              <textarea
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectTargetId(null);
                    setRejectReason("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-40"
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                >
                  Submit rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
