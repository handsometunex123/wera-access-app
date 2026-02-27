
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
import { toast } from "react-hot-toast";
import { ArrowDownTrayIcon, QrCodeIcon, XMarkIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

function useCrispyInputStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .crispy-input, .crispy-select {
        background: #f8fafc;
        border: 1.5px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 0.85rem 1.1rem;
        font-size: 1.08rem;
        font-weight: 500;
        color: #1e293b;
        transition: border 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 2px 0 rgba(16,185,129,0.04);
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
    usageType: "ENTRY_AND_EXIT",
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
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const errors: { [key: string]: string } = {};
    if (!form.purpose) errors.purpose = "Purpose is required.";
    if (!form.guestName) errors.guestName = "Guest name is required.";
    if (!form.validityMinutes) errors.validityMinutes = "Validity is required.";
    if (!form.usageType) errors.usageType = "Usage type is required.";
    if (!form.usageLimit || form.usageLimit < 1) errors.usageLimit = "Usage limit must be at least 1.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/resident/generate-admin-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to generate admin code");
      else {
        setResult(data.accessCode);
        setShowDialog(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-3 md:p-6">
      <div className="w-full max-w-md mx-auto flex items-center mb-4">
        <Link href="/resident/dashboard" className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-medium text-base">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-4 md:p-6 flex flex-col gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-emerald-900 mb-2 text-center tracking-tight">Generate Admin Access Code</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="block font-medium text-gray-900">Purpose</label>
          <input
            className="crispy-input w-full"
            value={form.purpose}
            onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
            placeholder="Purpose (e.g. Guest Visit, Delivery)"
            required
          />
          {fieldErrors.purpose && <div className="text-red-600 text-sm mt-1">{fieldErrors.purpose}</div>}
          <label className="block font-medium text-gray-900">Guest/Luggage Name</label>
          <input
            className="crispy-input w-full"
            value={form.guestName}
            onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
            placeholder="Guest Name"
            required
          />
          {fieldErrors.guestName && <div className="text-red-600 text-sm mt-1">{fieldErrors.guestName}</div>}
          <label className="block font-medium text-gray-900">Code Validity</label>
          <div className="w-full min-w-0">
            <select
              className="crispy-select w-full min-w-0"
              value={form.validityMinutes}
              onChange={e => setForm(f => ({ ...f, validityMinutes: Number(e.target.value) }))}
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
          </div>
          {fieldErrors.validityMinutes && <div className="text-red-600 text-sm mt-1">{fieldErrors.validityMinutes}</div>}
          <label className="block font-medium text-gray-900">Usage Type</label>
          <div className="flex gap-4 mb-2">
            <label
              className={
                "flex items-center cursor-pointer px-3 py-2 rounded-lg border transition font-medium text-base shadow-sm " +
                (form.usageType === "ENTRY_AND_EXIT"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200"
                  : "border-gray-200 bg-gray-50 text-gray-700")
              }
            >
              <input
                type="radio"
                name="usageType"
                value="ENTRY_AND_EXIT"
                checked={form.usageType === "ENTRY_AND_EXIT"}
                onChange={() => setForm(f => ({ ...f, usageType: "ENTRY_AND_EXIT" }))}
                className="accent-emerald-600 mr-2"
              />
              Entry & Exit
            </label>
            <label
              className={
                "flex items-center cursor-pointer px-3 py-2 rounded-lg border transition font-medium text-base shadow-sm " +
                (form.usageType === "ENTRY_ONLY"
                  ? "border-blue-400 bg-blue-50 text-blue-900 ring-2 ring-blue-200"
                  : "border-gray-200 bg-gray-50 text-gray-700")
              }
            >
              <input
                type="radio"
                name="usageType"
                value="ENTRY_ONLY"
                checked={form.usageType === "ENTRY_ONLY"}
                onChange={() => setForm(f => ({ ...f, usageType: "ENTRY_ONLY" }))}
                className="accent-blue-600 mr-2"
              />
              One Time
            </label>
          </div>
          {fieldErrors.usageType && <div className="text-red-600 text-sm mt-1">{fieldErrors.usageType}</div>}
          <label className="block font-medium text-gray-900">Usage Limit</label>
          <input
            type="number"
            min={1}
            max={4}
            className="crispy-input w-full"
            value={form.usageLimit}
            onChange={e => setForm(f => ({ ...f, usageLimit: Math.max(1, Math.min(4, Number(e.target.value))) }))}
            required
          />
          {fieldErrors.usageLimit && <div className="text-red-600 text-sm mt-1">{fieldErrors.usageLimit}</div>}
          <button
            type="submit"
            className="bg-emerald-700 text-white font-bold py-3 rounded-lg shadow hover:bg-emerald-900 transition text-lg"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Admin Code"}
          </button>
        </form>
        {showDialog && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2">
            <div className="bg-white rounded-xl shadow-2xl p-3 md:p-6 w-full max-w-sm md:max-w-md relative flex flex-col items-center animate-fadeIn gap-3">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-emerald-700 transition"
                onClick={() => setShowDialog(false)}
                aria-label="Close dialog"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-lg md:text-xl font-extrabold text-emerald-900 mb-1 md:mb-2 text-center tracking-tight">Admin Code Generated</h2>
              <div className="w-40 h-40 mx-auto border-2 border-emerald-100 rounded-lg bg-white flex items-center justify-center overflow-hidden mb-2">
                {result.qrCodeUrl && (
                  <Image src={result.qrCodeUrl} alt="QR Code" width={160} height={160} className="object-contain" priority unoptimized />
                )}
              </div>
              <div className="text-lg md:text-4xl font-mono font-extrabold text-emerald-800 mb-3 tracking-widest break-all select-all text-center" style={{letterSpacing:'0.12em'}}>{result.code}</div>
              <div className="w-full bg-gray-50 rounded-2xl p-3 flex flex-col gap-2 text-gray-800 text-base">
                <div className="flex justify-between"><span className="font-semibold">Valid From:</span> <span>{formatShortDate(result.inviteStart)}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Expires On:</span> <span>{formatShortDate(result.inviteEnd)}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Usage Limit:</span> <span>{result.usageLimit ?? '-'}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Usage Type:</span> <span>{result.usageType?.replace("_", " ") ?? '-'}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Status:</span> <span>{result.status ?? '-'}</span></div>
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold shadow text-base"
                  onClick={async () => {
                    await navigator.clipboard.writeText(result.code);
                    toast.success("Code copied to clipboard!");
                  }}
                  type="button"
                >
                  <ArrowDownTrayIcon className="w-6 h-6" /> Copy
                </button>
                <button
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold shadow text-base"
                  onClick={async () => {
                    if (navigator.canShare && window.Blob && result.qrCodeUrl && result.qrCodeUrl.startsWith('data:image')) {
                      try {
                        const res = await fetch(result.qrCodeUrl);
                        const blob = await res.blob();
                        const file = new File([blob], 'admin-access-qr.png', { type: blob.type });
                        if (navigator.canShare({ files: [file] })) {
                          await navigator.share({ files: [file], title: 'Admin Access QR Code' });
                          return;
                        }
                      } catch {}
                    }
                    // fallback: download
                    const link = document.createElement('a');
                    link.href = result.qrCodeUrl;
                    link.download = `admin-access-qr.png`;
                    link.click();
                  }}
                  type="button"
                >
                  <QrCodeIcon className="w-6 h-6" /> Share QR
                </button>
              </div>
            </div>
          </div>
        )}
        {error && <div className="mt-4 text-red-700 text-center font-semibold">{error}</div>}
      </div>
    </div>
  );
}
