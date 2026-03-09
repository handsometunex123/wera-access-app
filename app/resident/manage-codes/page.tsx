"use client";
import React, { useEffect, useState } from "react";
import ResidentBackToDashboard from "@/components/ResidentBackToDashboard";
import Image from "next/image";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { KeyIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface AccessCode {
  id: string;
  code: string;
  status: string;
  inviteStart: string;
  inviteEnd: string;
  usageType: string;
  usageLimit: number;
  usageCount: number;
  type?: string;
  qr?: string;
  usedAt?: string;
  createdAt: string;
}

const STATUS_ORDER = ["ACTIVE", "USED", "EXPIRED", "REVOKED", "CHECKED_OUT"] as const;

export default function ResidentManageCodesPage() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [adminCodes, setAdminCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailsCode, setDetailsCode] = useState<AccessCode | null>(null);
  const [activeTab, setActiveTab] = useState<"RESIDENT" | "ADMIN">("RESIDENT");
  const [statusFilter, setStatusFilter] = useState<"ALL" | string>("ALL");

  useEffect(() => {
    const fetchCodes = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/resident/manage-codes");
        const data = await res.json();
        if (!res.ok) setError(data.error || "Failed to load codes");
        else {
          // Separate admin codes from regular codes
          const admin = (data.codes || []).filter((c: AccessCode) => c.type === "ADMIN");
          const regular = (data.codes || []).filter((c: AccessCode) => c.type !== "ADMIN");
          setAdminCodes(admin);
          setCodes(regular);
        }
      } catch {
        setError("Failed to load codes");
      } finally {
        setLoading(false);
      }
    };
    fetchCodes();
  }, []);

  const currentList = activeTab === "ADMIN" ? adminCodes : codes;
  const filteredList = statusFilter === "ALL" ? currentList : currentList.filter((code) => code.status === statusFilter);
  const totalCount = currentList.length;
  const statusCounts = STATUS_ORDER.map((status) => [status, currentList.filter((code) => code.status === status).length] as const);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <ResidentBackToDashboard />
        <p className="hidden text-[11px] text-emerald-700 md:inline">Review, share or revoke your access codes.</p>
      </div>
      <div className="w-full rounded-2xl border border-emerald-100 bg-white/95 shadow-sm p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <KeyIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-semibold text-emerald-950 tracking-tight">Manage access codes</h1>
              <p className="text-[11px] text-emerald-700">Switch between your resident codes and any admin-issued codes.</p>
            </div>
          </div>
          <div className="flex justify-start sm:justify-end">
            <div className="flex rounded-full bg-slate-100 overflow-hidden border border-emerald-100 p-0.5">
              <button
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition focus:outline-none ${
                  activeTab === "RESIDENT"
                    ? "bg-white text-emerald-900 shadow-sm"
                    : "text-slate-500 hover:text-emerald-800"
                }`}
                onClick={() => {
                  setActiveTab("RESIDENT");
                  setStatusFilter("ALL");
                }}
                aria-label="Resident Codes Tab"
              >
                Resident codes
              </button>
              <button
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition focus:outline-none ${
                  activeTab === "ADMIN"
                    ? "bg-white text-emerald-900 shadow-sm"
                    : "text-slate-500 hover:text-emerald-800"
                }`}
                onClick={() => {
                  setActiveTab("ADMIN");
                  setStatusFilter("ALL");
                }}
                aria-label="Admin Codes Tab"
              >
                Admin codes
              </button>
            </div>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium transition " +
              (statusFilter === "ALL"
                ? "border-emerald-300 bg-emerald-700 text-emerald-50"
                : "border-emerald-100 bg-emerald-50 text-emerald-900 hover:bg-emerald-100")
            }
          >
            <span className="text-[10px] uppercase tracking-wide">All</span>
            <span className={"h-1 w-1 rounded-full " + (statusFilter === "ALL" ? "bg-emerald-100" : "bg-emerald-400")} />
            <span>{totalCount}</span>
          </button>
          {statusCounts.map(([status, count]) => (
            <button
              type="button"
              key={status}
              onClick={() => setStatusFilter((prev) => (prev === status ? "ALL" : status))}
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
        {loading ? (
          <div className="text-center text-emerald-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-700">{error}</div>
        ) : (
          <>
            {filteredList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
                {statusFilter === "ALL" ? "No codes found in this view." : "No codes match this status in this view."}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredList.map((code) => (
                  <div
                    key={code.id}
                    className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] font-semibold text-emerald-950 tracking-widest truncate">
                            {code.code}
                          </span>
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
                        <div className="mt-1 text-[11px] text-emerald-700">
                          {code.usageType.replace("_", " ")} • Limit {code.usageLimit} • Used {code.usageCount}
                        </div>
                        <div className="mt-1 text-[11px] text-emerald-800">
                          {new Date(code.inviteStart).toLocaleString()} — {new Date(code.inviteEnd).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-[11px]">
                        <button
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100"
                          onClick={async () => {
                            await navigator.clipboard.writeText(code.code);
                            toast.success("Code copied to clipboard!");
                          }}
                        >
                          <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Copy
                        </button>
                        {code.status === "ACTIVE" && (
                          <button
                            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/resident/manage-codes`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: code.id }),
                                });
                                if (res.ok) {
                                  toast.success("Code revoked successfully!");
                                  if (code.type === "ADMIN") {
                                    setAdminCodes((prev) => prev.filter((c) => c.id !== code.id));
                                  } else {
                                    setCodes((prev) => prev.filter((c) => c.id !== code.id));
                                  }
                                } else {
                                  toast.error("Failed to revoke code. Please try again.");
                                }
                              } catch {
                                toast.error("An error occurred while revoking the code.");
                              }
                            }}
                          >
                            Revoke
                          </button>
                        )}
                        <button
                          className="text-[10px] font-semibold text-sky-700 hover:underline"
                          onClick={() => setDetailsCode(code)}
                        >
                          View details
                        </button>
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
          </>
        )}
      </div>
      {/* Details Modal */}
      {detailsCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-3 md:p-6 w-full max-w-sm md:max-w-md relative flex flex-col items-center animate-fadeIn gap-3">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-emerald-700 transition"
              onClick={() => setDetailsCode(null)}
              aria-label="Close dialog"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 className="text-lg md:text-3xl font-extrabold text-emerald-900 mb-1 md:mb-2 text-center tracking-tight">
              {detailsCode.type === "ADMIN" ? "Admin Access Code Details" : "Access Code Details"}
            </h2>
            <div className="text-2xl md:text-3xl font-mono font-extrabold text-emerald-800 mb-2 tracking-wider break-all select-all text-center" style={{letterSpacing:'0.12em'}}>{detailsCode.code}</div>
            {detailsCode.qr && (
              <Image
                src={detailsCode.qr}
                alt={`QR code for ${detailsCode.code}`}
                width={140}
                height={140}
                className="object-contain border rounded-lg bg-white"
                priority
                unoptimized
              />
            )}
            <div className="w-full bg-gray-50 rounded-lg p-2 flex flex-col gap-2 text-gray-800 text-sm">
              <div className="flex justify-between"><span className="font-semibold">Status:</span> <span>{detailsCode.status}</span></div>
              <div className="flex justify-between"><span className="font-semibold">Usage Type:</span> <span>{detailsCode.usageType}</span></div>
              <div className="flex justify-between"><span className="font-semibold">Valid:</span> <span>{new Date(detailsCode.inviteStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(detailsCode.inviteEnd).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span></div>
              <div className="flex justify-between"><span className="font-semibold">Usage Limit:</span> <span>{detailsCode.usageLimit}</span></div>
              <div className="flex justify-between"><span className="font-semibold">Usage Count:</span> <span>{detailsCode.usageCount}</span></div>
              {detailsCode.usedAt && <div className="flex justify-between"><span className="font-semibold">Used At:</span> <span>{new Date(detailsCode.usedAt).toLocaleString()}</span></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
