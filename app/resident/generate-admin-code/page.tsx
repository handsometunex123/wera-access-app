
"use client";// Format date as 'Fri Feb 20 at 8:12 AM'
function formatShortDate(dateString?: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  const day = date.toLocaleDateString(undefined, { weekday: "short" });
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const dayNum = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minStr = minute.toString().padStart(2, "0");
  return `${day} ${month} ${dayNum} at ${hour12}:${minStr} ${ampm}`;
}

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ResidentBackToDashboard from "@/components/ResidentBackToDashboard";
import { toast } from "react-hot-toast";
import { ArrowDownTrayIcon, QrCodeIcon } from "@heroicons/react/24/solid";
import { KeyIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

function useCrispyInputStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .crispy-input, .crispy-select {
        background: #ffffff;
        border: 1px solid #d1fae5;
        border-radius: 9999px;
        padding: 0.55rem 0.9rem;
        font-size: 0.78rem;
        font-weight: 500;
        color: #064e3b;
        transition: border 0.2s, box-shadow 0.2s, background 0.2s;
        box-shadow: 0 1px 2px 0 rgba(16,185,129,0.06);
      }
      .crispy-input:focus, .crispy-select:focus {
        outline: none;
        border-color: #10b981;
        box-shadow: 0 0 0 2px #a7f3d0;
        background: #f0fdf4;
      }
      .crispy-input[disabled], .crispy-select[disabled] {
        background: #f1f5f9;
        color: #94a3b8;
        border-color: #e5e7eb;
        cursor: not-allowed;
      }
      .crispy-input::-webkit-input-placeholder, .crispy-select::-webkit-input-placeholder {
        color: #94a3b8;
        opacity: 1;
      }
      .crispy-input:-ms-input-placeholder, .crispy-select:-ms-input-placeholder {
        color: #94a3b8;
        opacity: 1;
      }
      .crispy-input::placeholder, .crispy-select::placeholder {
        color: #94a3b8;
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
}


export default function GenerateAdminCodePage() {
  useCrispyInputStyles();
  const [form, setForm] = useState({
    purpose: "",
    guestName: "",
    validityMinutes: 60,
    usageType: "ENTRY_ONLY",
    usageLimit: 1,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    code: string;
    qrCodeUrl: string;
    inviteStart?: string;
    inviteEnd?: string;
    usageLimit?: number;
    usageType?: string;
    status?: string;
  } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [itemDetails, setItemDetails] = useState("");
  const [uploading, setUploading] = useState(false);
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const errors: { [key: string]: string } = {};
    if (!form.purpose) errors.purpose = "Purpose is required.";
    if (!form.guestName) errors.guestName = "Guest name is required.";
    if (!form.validityMinutes) errors.validityMinutes = "Validity is required.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setResult(null);
    setShowResultModal(false);
    try {
      const res = await fetch("/api/resident/generate-admin-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          usageType: "ENTRY_ONLY",
          usageLimit: 1,
          itemDetails,
          itemImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.reason) {
          setError(`${data.error} Reason: ${data.reason}`);
        } else {
          setError(data.error || "Failed to generate admin code");
        }
      }
      else {
        setResult(data.accessCode);
        setShowResultModal(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Failed to upload image");
      } else {
        setItemImageUrl(data.url);
      }
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <ResidentBackToDashboard />
        <p className="hidden text-[11px] text-emerald-700 md:inline">
          Generate a special admin access code for estate guards.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-emerald-100 bg-white/95 shadow-sm p-4 md:p-6 flex flex-col gap-4">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <KeyIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-semibold text-emerald-950 tracking-tight">
              Generate admin access code
            </h1>
            <p className="text-[11px] text-emerald-700">
              Create a one-time or limited-use code for deliveries and special access.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Code details</h2>
            <p className="text-[11px] text-emerald-700">
              Fill in the request details and how this admin code should behave.
            </p>
          </div>

          <form className="flex flex-col gap-3 text-[11px]" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-emerald-900">Purpose</label>
                <input
                  className="crispy-input w-full"
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  placeholder="e.g. Vendor delivery, pickup"
                  required
                />
                {fieldErrors.purpose && (
                  <div className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.purpose}</div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-emerald-900">Guest / luggage name</label>
                <input
                  className="crispy-input w-full"
                  value={form.guestName}
                  onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
                  placeholder="e.g. Rider name or package label"
                  required
                />
                {fieldErrors.guestName && (
                  <div className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.guestName}</div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-emerald-900">Code validity</label>
                <select
                  className="crispy-select w-full"
                  value={form.validityMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, validityMinutes: Number(e.target.value) }))
                  }
                  required
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={300}>5 hours</option>
                  <option value={360}>6 hours</option>
                  <option value={420}>7 hours</option>
                  <option value={480}>8 hours</option>
                  <option value={540}>9 hours</option>
                  <option value={600}>10 hours</option>
                  <option value={660}>11 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={780}>13 hours</option>
                  <option value={840}>14 hours</option>
                  <option value={900}>15 hours</option>
                  <option value={960}>16 hours</option>
                </select>
                {fieldErrors.validityMinutes && (
                  <div className="text-[11px] text-rose-600 mt-0.5">
                    {fieldErrors.validityMinutes}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1 sm:max-w-[260px]">
                <label className="text-[11px] font-medium text-emerald-900">Usage</label>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-[11px] text-emerald-900">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold text-emerald-50">
                    1x
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold">One time only</span>
                    <span className="text-[10px] text-emerald-700">Single scan • Entry only</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-emerald-900">Item details (optional)</label>
              <textarea
                className="w-full rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={itemDetails}
                onChange={(e) => setItemDetails(e.target.value)}
                placeholder="Describe the item or any extra context for guards"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-emerald-900">Item image (optional)</label>
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <p className="text-[11px] font-medium text-emerald-900">Attach a quick photo</p>
                  <p className="text-[10px] text-emerald-700">
                    Optional, but helps guards recognize the rider, package, or item faster.
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50">
                      <span>Take photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50">
                      <span>Upload from gallery</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {uploading && (
                    <div className="text-[10px] text-emerald-700 mt-0.5">Uploading image...</div>
                  )}
                </div>
                {itemImageUrl && (
                  <div className="mt-2 flex items-center justify-start sm:mt-0">
                    <Image
                      src={itemImageUrl}
                      alt="Item"
                      width={96}
                      height={96}
                      className="rounded-xl object-cover border border-emerald-100 shadow-sm bg-white"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] text-emerald-700">
                Admin codes are meant for special access and can be scanned by guards within the
                selected window.
              </p>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-[12px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate admin code"}
              </button>
            </div>
            {error && (
              <div className="mt-2 text-[10px] font-medium text-rose-700">{error}</div>
            )}
          </form>
        </div>

        {result && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Generated admin code</h2>
              <p className="text-[11px] text-emerald-700">
                Share this code or QR with estate guards for verification.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 px-3 py-3 sm:px-4">
              <div className="mb-3 flex flex-col items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Scan QR
                </span>
                {result.qrCodeUrl && (
                  <Image
                    src={result.qrCodeUrl}
                    alt="QR Code"
                    width={140}
                    height={140}
                    className="object-contain border rounded-lg bg-white"
                    priority
                    unoptimized
                  />
                )}
                <div className="rounded-full bg-white px-3 py-1 font-mono text-[13px] font-semibold text-emerald-900 border border-emerald-100 break-all text-center">
                  {result.code}
                </div>
              </div>
              <div className="mb-3 flex flex-wrap justify-center gap-2">
                <button
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                  onClick={async () => {
                    await navigator.clipboard.writeText(result.code);
                    toast.success("Code copied to clipboard!");
                  }}
                  type="button"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" /> Copy
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
                  onClick={async () => {
                    if (
                      navigator.canShare &&
                      window.Blob &&
                      result.qrCodeUrl &&
                      result.qrCodeUrl.startsWith("data:image")
                    ) {
                      try {
                        const res = await fetch(result.qrCodeUrl);
                        const blob = await res.blob();
                        const file = new File([blob], "admin-access-qr.png", { type: blob.type });
                        if (navigator.canShare({ files: [file] })) {
                          await navigator.share({ files: [file], title: "Admin Access QR Code" });
                          return;
                        }
                      } catch {}
                    }
                    const link = document.createElement("a");
                    link.href = result.qrCodeUrl;
                    link.download = `admin-access-qr.png`;
                    link.click();
                  }}
                  type="button"
                >
                  <QrCodeIcon className="w-4 h-4" /> Share QR
                </button>
              </div>
              <div className="grid gap-2 text-[11px] text-emerald-900 sm:grid-cols-2">
                <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                  <span className="font-semibold">Valid from:</span>
                  <span>{result.inviteStart ? formatShortDate(result.inviteStart) : "-"}</span>
                </div>
                <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                  <span className="font-semibold">Valid to:</span>
                  <span>{result.inviteEnd ? formatShortDate(result.inviteEnd) : "-"}</span>
                </div>
                <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                  <span className="font-semibold">Usage limit:</span>
                  <span>{result.usageLimit ?? "-"}</span>
                </div>
                <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                  <span className="font-semibold">Usage type:</span>
                  <span>{result.usageType ? result.usageType.replace("_", " ") : "-"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showResultModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-4 md:p-5 shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-sm"
              onClick={() => setShowResultModal(false)}
            >
              
            </button>

            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <KeyIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-emerald-950">Admin code generated</p>
                  <p className="text-[11px] text-slate-500">Share this with estate guards for special access.</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                Admin code
              </span>
            </div>

            <div className="mb-3 flex flex-col items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Scan QR
              </span>
              {result.qrCodeUrl && (
                <Image
                  src={result.qrCodeUrl}
                  alt="QR Code"
                  width={160}
                  height={160}
                  className="object-contain border rounded-xl bg-white shadow-sm"
                  priority
                  unoptimized
                />
              )}
              <div className="rounded-full bg-slate-900 px-3 py-1 font-mono text-[13px] font-semibold text-emerald-50 border border-emerald-500/60 break-all text-center">
                {result.code}
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                <button
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-700"
                  onClick={async () => {
                    await navigator.clipboard.writeText(result.code);
                    toast.success("Code copied to clipboard!");
                  }}
                  type="button"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" /> Copy code
                </button>
                {result.qrCodeUrl && (
                  <button
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50"
                    onClick={async () => {
                      if (
                        navigator.canShare &&
                        (window as any).Blob &&
                        result.qrCodeUrl &&
                        result.qrCodeUrl.startsWith("data:image")
                      ) {
                        try {
                          const res = await fetch(result.qrCodeUrl);
                          const blob = await res.blob();
                          const file = new File([blob], "admin-access-qr.png", { type: blob.type });
                          if (navigator.canShare({ files: [file] })) {
                            await navigator.share({ files: [file], title: "Admin Access QR Code" });
                            return;
                          }
                        } catch {}
                      }
                      const link = document.createElement("a");
                      link.href = result.qrCodeUrl;
                      link.download = `admin-access-qr.png`;
                      link.click();
                    }}
                    type="button"
                  >
                    <QrCodeIcon className="w-4 h-4" /> Share QR
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-[11px] text-emerald-900">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                  <span className="font-semibold">Valid from:</span>
                  <span>{result.inviteStart ? formatShortDate(result.inviteStart) : "-"}</span>
                </div>
                <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                  <span className="font-semibold">Valid to:</span>
                  <span>{result.inviteEnd ? formatShortDate(result.inviteEnd) : "-"}</span>
                </div>
                <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                  <span className="font-semibold">Usage limit:</span>
                  <span>{result.usageLimit ?? "-"}</span>
                </div>
                <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                  <span className="font-semibold">Usage type:</span>
                  <span>{result.usageType ? result.usageType.replace("_", " ") : "-"}</span>
                </div>
              </div>

              <div className="mt-1 grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-slate-500 mb-0.5">Purpose</p>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-800">
                    {form.purpose || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Guest / luggage</p>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-800">
                    {form.guestName || "-"}
                  </p>
                </div>
              </div>

              {itemDetails && (
                <div>
                  <p className="text-slate-500 mb-0.5">Item details</p>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-800 whitespace-pre-line">
                    {itemDetails}
                  </p>
                </div>
              )}

              {itemImageUrl && (
                <div className="mt-1">
                  <p className="text-slate-500 mb-0.5">Item image</p>
                  <div className="relative h-32 w-full max-w-xs overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/40">
                    <Image src={itemImageUrl} alt="Item" fill className="object-cover" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-800"
                onClick={() => setShowResultModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
