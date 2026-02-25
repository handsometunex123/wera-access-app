"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/solid";
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

export default function ResidentManageCodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [adminCodes, setAdminCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailsCode, setDetailsCode] = useState<AccessCode | null>(null);
  const [activeTab, setActiveTab] = useState<"RESIDENT" | "ADMIN">("RESIDENT");

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

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <button
          className="mb-3 flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-semibold text-sm focus:outline-none"
          onClick={() => router.back()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="text-xl font-bold text-emerald-900 mb-4 text-center">Manage Access Codes</h1>
        {loading ? (
          <div className="text-center text-emerald-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-700">{error}</div>
        ) : (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex rounded-xl bg-gray-100 overflow-hidden border border-gray-200">
                <button
                  className={`px-6 py-2 font-semibold text-base transition focus:outline-none ${activeTab === "RESIDENT" ? "bg-white text-emerald-900 border-b-2 border-emerald-600" : "text-gray-500"}`}
                  onClick={() => setActiveTab("RESIDENT")}
                  aria-label="Resident Codes Tab"
                >
                  Resident Codes
                </button>
                <button
                  className={`px-6 py-2 font-semibold text-base transition focus:outline-none ${activeTab === "ADMIN" ? "bg-white text-emerald-900 border-b-2 border-emerald-600" : "text-gray-500"}`}
                  onClick={() => setActiveTab("ADMIN")}
                  aria-label="Admin Codes Tab"
                >
                  Admin Codes
                </button>
              </div>
            </div>
            {activeTab === "ADMIN" ? (
              adminCodes.length === 0 ? (
                <div className="text-center text-gray-500">No admin codes found.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {adminCodes.map(code => (
                    <div key={code.id} className="border rounded-lg p-4 flex flex-col gap-2 bg-gray-50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-lg tracking-widest text-emerald-800">{code.code}</span>
                        <span
                          className={`text-xs font-bold rounded px-2 py-1 ${
                            code.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : code.status === "USED"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {code.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold shadow text-xs"
                          onClick={async () => {
                            await navigator.clipboard.writeText(code.code);
                            toast.success("Code copied to clipboard!");
                          }}
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" /> Copy
                        </button>
                        {code.status === "ACTIVE" && (
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 font-semibold shadow text-xs"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/resident/manage-codes`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: code.id }),
                                });
                                if (res.ok) {
                                  toast.success("Code revoked successfully!");
                                  setCodes((prev) => prev.filter((c) => c.id !== code.id));
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
                          className="text-xs text-blue-700 font-semibold hover:underline"
                          onClick={() => setDetailsCode(code)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              codes.length === 0 ? (
                <div className="text-center text-gray-500">No resident codes found.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {codes.map(code => (
                    <div key={code.id} className="border rounded-lg p-4 flex flex-col gap-2 bg-gray-50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-lg tracking-widest text-emerald-800">{code.code}</span>
                        <span
                          className={`text-xs font-bold rounded px-2 py-1 ${
                            code.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : code.status === "USED"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {code.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold shadow text-xs"
                          onClick={async () => {
                            await navigator.clipboard.writeText(code.code);
                            toast.success("Code copied to clipboard!");
                          }}
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" /> Copy
                        </button>
                        {code.status === "ACTIVE" && (
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 font-semibold shadow text-xs"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/resident/manage-codes`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: code.id }),
                                });
                                if (res.ok) {
                                  toast.success("Code revoked successfully!");
                                  setCodes((prev) => prev.filter((c) => c.id !== code.id));
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
                          className="text-xs text-blue-700 font-semibold hover:underline"
                          onClick={() => setDetailsCode(code)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
      {/* Details Modal */}
      {detailsCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-6 max-w-md w-full relative flex flex-col items-center animate-fadeIn gap-4">
            <button
              className="absolute top-4 right-5 text-gray-400 hover:text-emerald-700 transition"
              onClick={() => setDetailsCode(null)}
              aria-label="Close dialog"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
            <h2 className="text-2xl md:text-3xl font-extrabold text-emerald-900 mb-2 text-center tracking-tight">
              {detailsCode.type === "ADMIN" ? "Admin Access Code Details" : "Access Code Details"}
            </h2>
            <div className="text-3xl font-mono font-extrabold text-emerald-800 mb-2 tracking-widest break-all select-all text-center" style={{letterSpacing:'0.15em'}}>{detailsCode.code}</div>
            {detailsCode.qr && (
              <Image
                src={detailsCode.qr}
                alt={`QR code for ${detailsCode.code}`}
                width={160}
                height={160}
                className="object-contain border rounded-xl bg-white"
                priority
                unoptimized
              />
            )}
            <div className="w-full bg-gray-50 rounded-2xl p-3 flex flex-col gap-2 text-gray-800 text-base">
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
