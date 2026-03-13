"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import SkeletonLoader from "@/components/SkeletonLoader";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KeyIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { QRCodeSVG } from "qrcode.react";

interface AccessCode {
  id: string;
  code: string;
  purpose: string;
  guestName: string;
  inviteStart: string;
  inviteEnd: string;
  usageLimit: number;
  usageType: string;
  status: string;
  createdAt: string;
  type?: string;
  adminApprovalStatus?: string;
  itemDetails?: string | null;
  qrCodeUrl?: string | null;
  itemImageUrl?: string | null;
  createdBy?: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
}

const STATUS_ORDER = ["ACTIVE", "USED", "EXPIRED", "REVOKED", "CHECKED_OUT"] as const;

function AdminAccessCodesPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [codeTypeFilter, setCodeTypeFilter] = useState<"ALL" | "ADMIN" | "RESIDENT">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | string>("ALL");
  const [statusSummary, setStatusSummary] = useState<Record<string, number>>(() =>
    STATUS_ORDER.reduce<Record<string, number>>((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {})
  );
  const [totalUnfiltered, setTotalUnfiltered] = useState(0);

  const statusCounts = useMemo(() => {
    return STATUS_ORDER.map((status) => [status, statusSummary[status] || 0] as const);
  }, [statusSummary]);

  useEffect(() => {
    fetchCodes();
    // eslint-disable-next-line
  }, [page, search, codeTypeFilter, statusFilter]);

  async function fetchCodes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/access-codes?page=${page}&search=${encodeURIComponent(search)}&codeType=${codeTypeFilter}&status=${statusFilter}`
      );
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load codes");
      else {
        setCodes(data.codes);
        setTotalPages(data.totalPages);
        setStatusSummary(data.statusCounts || {});
        setTotalUnfiltered(data.totalUnfiltered || 0);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleRevoke(id: string) {
    if (!window.confirm("Revoke this code?")) return;
    setLoading(true);
    fetch(`/api/admin/access-codes/${id}/revoke`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else fetchCodes();
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }

  // Modal state for viewing code details
  const [modalCode, setModalCode] = useState<AccessCode | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  function handleView(id: string) {
    setModalLoading(true);
    setModalError("");
    fetch(`/api/admin/access-codes/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setModalError(data.error);
        else setModalCode(data.code);
      })
      .catch(() => setModalError("Network error"))
      .finally(() => setModalLoading(false));
  }

  function openResidentDetails(residentId?: string | null) {
    if (!residentId) return;
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("residentId", residentId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <KeyIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl sm:block hidden">Estate Control Center</h1>
            <p className="text-[11px] text-emerald-700">
              Manage guest and delivery codes and revoke them when needed.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:justify-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ALL");
              setPage(1);
            }}
            className={
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium transition " +
              (statusFilter === "ALL"
                ? "border-emerald-300 bg-emerald-700 text-emerald-50"
                : "border-emerald-100 bg-emerald-50 text-emerald-900 hover:bg-emerald-100")
            }
          >
            <span className="text-[10px] uppercase tracking-wide">All</span>
            <span className={"h-1 w-1 rounded-full " + (statusFilter === "ALL" ? "bg-emerald-100" : "bg-emerald-400")} />
            <span>{totalUnfiltered}</span>
          </button>

          {statusCounts.map(([status, count]) => (
            <button
              type="button"
              key={status}
              onClick={() => {
                setStatusFilter((prev) => (prev === status ? "ALL" : status));
                setPage(1);
              }}
              className={
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium transition " +
                (statusFilter === status
                  ? "border-emerald-300 bg-emerald-700 text-emerald-50"
                  : "border-emerald-100 bg-emerald-50 text-emerald-900 hover:bg-emerald-100")
              }
            >
              <span className="text-[10px] uppercase tracking-wide">{status}</span>
              <span className={"h-1 w-1 rounded-full " + (statusFilter === status ? "bg-emerald-100" : "bg-emerald-400")} />
              <span>{count}</span>
            </button>
          ))}
        </div>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Code history</h2>
            <p className="text-[11px] text-emerald-700">Search by guest, code, purpose, or resident.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <select
              value={codeTypeFilter}
              onChange={(e) => {
                setCodeTypeFilter(e.target.value as "ALL" | "ADMIN" | "RESIDENT");
                setPage(1);
              }}
              className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[11px] text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="ALL">All code types</option>
              <option value="ADMIN">Admin codes</option>
              <option value="RESIDENT">Resident access codes</option>
            </select>
            <div className="relative w-full max-w-full transition-all duration-300 ease-out sm:w-64 sm:max-w-xs sm:focus-within:w-80">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500" />
              <input
                className="w-full rounded-full border border-emerald-100 bg-white px-7 py-1.5 pr-8 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Search by guest, code, purpose..."
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
        </div>

        {loading && (
          <div className="mb-3">
            <div className="md:hidden">
              <SkeletonLoader className="w-full" count={3} variant="card" />
            </div>
            <div className="hidden md:block">
              <SkeletonLoader className="w-full" count={6} variant="card" />
            </div>
          </div>
        )}
        {error && <div className="mb-2 text-[11px] font-semibold text-red-700">{error}</div>}

        {/* Mobile cards */}
        {!loading && codes.length > 0 && (
          <div className="space-y-3 md:hidden">
            {codes.map((code) => (
              <div
                key={code.id}
                className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-[13px] font-semibold text-emerald-950 truncate">
                        {code.code}
                      </div>
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                          (code.type === "ADMIN"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-sky-50 text-sky-700")
                        }
                      >
                        {code.type === "ADMIN" ? "Admin" : "Resident"}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      {code.usageType.replace("_", " ")} • Limit {code.usageLimit}
                    </div>
                    <div className="mt-1 text-[11px] text-emerald-800">
                      {new Date(code.inviteStart).toLocaleString()} —
                      {" "}
                      {new Date(code.inviteEnd).toLocaleString()}
                    </div>
                    <div className="mt-1 text-[10px] text-emerald-700">
                      Resident:{" "}
                      {code.createdBy?.id ? (
                        <button
                          type="button"
                          onClick={() => openResidentDetails(code.createdBy?.id)}
                          className="font-semibold text-emerald-900 hover:underline hover:underline-offset-2"
                        >
                          {code.createdBy?.fullName || code.createdBy?.email || "-"}
                        </button>
                      ) : (
                        <span className="text-emerald-600">-</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[11px]">
                    <button
                      className="text-sky-700 hover:underline"
                      onClick={() => handleView(code.id)}
                    >
                      View
                    </button>
                    {code.status === "ACTIVE" && (
                      <button
                        className="text-rose-700 hover:underline"
                        onClick={() => handleRevoke(code.id)}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <span
                    className={
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                      (["USED", "EXPIRED", "REVOKED"].includes(code.status)
                        ? "bg-rose-50 text-rose-700"
                        : code.status === "ACTIVE"
                        ? "bg-emerald-600 text-emerald-50"
                        : "bg-slate-100 text-slate-700")
                    }
                  >
                    {code.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && codes.length === 0 && (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
            No codes found.
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/80">
            <div className="max-h-[460px] overflow-y-auto">
              <table className="min-w-full text-xs text-emerald-950">
                <thead className="bg-emerald-50/80 text-[11px] uppercase tracking-wide text-emerald-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Code</th>
                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                    <th className="px-4 py-2 text-left font-semibold">Resident</th>
                    <th className="px-4 py-2 text-left font-semibold">Valid from</th>
                    <th className="px-4 py-2 text-left font-semibold">Valid to</th>
                    <th className="px-4 py-2 text-left font-semibold">Usage limit</th>
                    <th className="px-4 py-2 text-left font-semibold">Usage type</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-center font-semibold">Image</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {codes.map((code) => (
                    <tr key={code.id} className="transition hover:bg-emerald-50/60">
                      <td className="px-4 py-2.5 align-middle">
                        <span className="font-mono text-[13px] font-semibold text-emerald-950">
                          {code.code}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                            (code.type === "ADMIN"
                              ? "bg-violet-50 text-violet-700"
                              : "bg-sky-50 text-sky-700")
                          }
                        >
                          {code.type === "ADMIN" ? "Admin code" : "Resident code"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        {code.createdBy?.id ? (
                          <button
                            type="button"
                            onClick={() => openResidentDetails(code.createdBy?.id)}
                            className="max-w-[180px] truncate text-left text-[11px] font-medium text-emerald-900 hover:underline hover:underline-offset-2"
                            title={code.createdBy?.fullName || code.createdBy?.email || undefined}
                          >
                            {code.createdBy?.fullName || code.createdBy?.email || "-"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-800">
                          {new Date(code.inviteStart).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-800">
                          {new Date(code.inviteEnd).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-800">{code.usageLimit}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className="text-[11px] text-emerald-800">
                          {code.usageType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                            (["USED", "EXPIRED", "REVOKED"].includes(code.status)
                              ? "bg-rose-50 text-rose-700"
                              : code.status === "ACTIVE"
                              ? "bg-emerald-600 text-emerald-50"
                              : "bg-slate-100 text-slate-700")
                          }
                        >
                          {code.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-center">
                        {code.itemImageUrl ? (
                          <button
                            type="button"
                            onClick={() => setImageModalUrl(code.itemImageUrl || null)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            title="View image"
                          >
                            <PhotoIcon className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-500"></span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-middle text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2 text-[11px]">
                          <button
                            className="text-sky-700 hover:underline"
                            onClick={() => handleView(code.id)}
                          >
                            View
                          </button>
                          {code.status === "ACTIVE" && (
                            <button
                              className="text-rose-700 hover:underline"
                              onClick={() => handleRevoke(code.id)}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {codes.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={10}
                        className="bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800"
                      >
                        No codes found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal for code details */}
        {modalCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:max-w-lg sm:p-6">
              <button
                type="button"
                className="absolute right-3 top-3 text-lg text-emerald-900"
                onClick={() => setModalCode(null)}
                aria-label="Close dialog"
              >
                &times;
              </button>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Access code details</h2>
                <p className="text-[11px] text-emerald-700">
                  Review validity, usage limits, and status for this generated code.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 flex flex-col max-h-[80vh]">
                <div className="px-3 py-3 sm:px-4 flex-1 overflow-y-auto">
                  <div className="mb-3 flex flex-col items-center">
                    <QRCodeSVG value={modalCode.code} size={112} />
                    <div
                      className={`mt-2 font-mono text-2xl md:text-3xl ${
                        ["USED", "EXPIRED", "REVOKED"].includes(modalCode.status)
                          ? "text-rose-700"
                          : "text-emerald-900"
                      }`}
                    >
                      {modalCode.code}
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 text-[11px] text-emerald-900 md:text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold">Valid from:</span>
                      <span>{new Date(modalCode.inviteStart).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold">Valid to:</span>
                      <span>{new Date(modalCode.inviteEnd).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold">Usage limit:</span>
                      <span>{modalCode.usageLimit}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold">Usage type:</span>
                      <span>{modalCode.usageType.replace("_", " ")}</span>
                    </div>
                    {modalCode.type && (
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">Code type:</span>
                        <span>{modalCode.type === "ADMIN" ? "Admin code" : "Resident code"}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold">Status:</span>
                      <span>{modalCode.status}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold">Created at:</span>
                      <span>{new Date(modalCode.createdAt).toLocaleString()}</span>
                    </div>
                    {modalCode.guestName && (
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">Guest:</span>
                        <span>{modalCode.guestName}</span>
                      </div>
                    )}
                    {modalCode.type === "ADMIN" && modalCode.adminApprovalStatus && (
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">Admin approval:</span>
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                            (modalCode.adminApprovalStatus === "APPROVED"
                              ? "bg-emerald-600 text-emerald-50"
                              : modalCode.adminApprovalStatus === "PENDING"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-rose-50 text-rose-700")
                          }
                        >
                          {modalCode.adminApprovalStatus}
                        </span>
                      </div>
                    )}
                    {modalCode.itemDetails && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-emerald-100 mt-1">
                        <span className="font-semibold">Attached details:</span>
                        <span className="text-[11px] md:text-[12px] whitespace-pre-wrap break-words">
                          {modalCode.itemDetails}
                        </span>
                      </div>
                    )}
                    {modalCode.itemImageUrl && (
                      <div className="mt-2 flex flex-col gap-1">
                        <span className="font-semibold text-[11px] md:text-[12px]">Attached image</span>
                        <div className="relative mt-1 h-40 w-full max-w-xs mx-auto overflow-hidden rounded-lg border border-emerald-100 bg-white">
                          <Image
                            src={modalCode.itemImageUrl}
                            alt="Attached item"
                            fill
                            sizes="(min-width: 640px) 384px, 100vw"
                            className="object-contain"
                          />
                        </div>
                      </div>
                    )}
                    {modalError && (
                      <div className="mt-2 text-[11px] font-semibold text-red-700">{modalError}</div>
                    )}
                    {modalLoading && <div className="mt-2 text-[11px] text-emerald-800">Loading...</div>}
                  </div>
                </div>
                <div className="border-t border-emerald-100 px-3 py-2 sm:px-4 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
                    onClick={() => setModalCode(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for attached image only */}
        {imageModalUrl ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg">
              <button
                type="button"
                className="absolute right-3 top-3 text-lg text-emerald-900"
                onClick={() => setImageModalUrl(null)}
                aria-label="Close image"
              >
                &times;
              </button>
              <div className="mt-4 flex flex-col items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-900">Attached image</span>
                <div className="relative mt-1 h-56 w-full overflow-hidden rounded-lg border border-emerald-100 bg-white">
                  <Image
                    src={imageModalUrl}
                    alt="Attached item"
                    fill
                    sizes="(min-width: 640px) 384px, 100vw"
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
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
              disabled={page === totalPages}
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

export default function AdminAccessCodesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-emerald-800">Loading access codes...</div>}>
      <AdminAccessCodesPageInner />
    </Suspense>
  );
}
