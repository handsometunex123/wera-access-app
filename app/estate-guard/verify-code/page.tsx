"use client";

import { useState } from "react";
import Image from "next/image";
import OtpInput from "react-otp-input";

interface AdminCodeDetails {
  code: string;
  type: string;
  qrCodeUrl: string | null;
  purpose: string | null;
  itemDetails: string | null;
  itemImageUrl: string | null;
  residentName: string;
  residentAddress: string | null;
}

export default function VerifyCodePage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdminCode, setIsAdminCode] = useState<boolean | null>(null);
  const [adminDetails, setAdminDetails] = useState<AdminCodeDetails | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const runVerification = async (value: string) => {
    if (!value || value.length !== 6) return;
    setLoading(true);
    setMessage("");
    setError("");
    setIsAdminCode(null);
    setAdminDetails(null);
    setShowAdminModal(false);

    try {
      const res = await fetch("/api/estate-guard/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setIsAdminCode(Boolean(data.isAdminCode));
        setCode("");

        if (data.isAdminCode && data.codeDetails) {
          setAdminDetails({
            code: data.codeDetails.code,
            type: data.codeDetails.type,
            qrCodeUrl: data.codeDetails.qrCodeUrl ?? null,
            purpose: data.codeDetails.purpose ?? null,
            itemDetails: data.codeDetails.itemDetails ?? null,
            itemImageUrl: data.codeDetails.itemImageUrl ?? null,
            residentName: data.codeDetails.residentName,
            residentAddress: data.codeDetails.residentAddress ?? null,
          });
          setShowAdminModal(true);
        }
      } else {
        setError(data.error || "An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runVerification(code);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="w-full rounded-2xl border border-emerald-100 bg-white/95 shadow-sm p-4 md:p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path d="M7 7h2v2H7V7zm8 0h2v2h-2V7zm-8 8h2v2H7v-2zm8 0h2v2h-2v-2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-semibold text-emerald-950 tracking-tight">Verify access code</h1>
              <p className="text-[11px] text-emerald-700">
                Type in a guest&apos;s 6-digit code to confirm if it is valid.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <OtpInput
            value={code}
            onChange={(value: string) => {
              setCode(value);
              if (value.length === 6 && !loading) {
                void runVerification(value);
              }
            }}
            numInputs={6}
            inputType="number"
            shouldAutoFocus
            containerStyle={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}
            inputStyle={{
              width: "3rem",
              height: "3.5rem",
              fontSize: "1.5rem",
              borderRadius: "0.5rem",
              border: "2px solid #10B981",
              color: "#065F46",
              background: "#F0FDF4",
              textAlign: "center",
              fontWeight: "bold",
              outline: "none",
              boxShadow: "0 2px 12px #10B98122",
            }}
            renderInput={(props) => <input {...props} />}
          />
          <div className="flex gap-3 justify-center mt-2">
            <button
              type="submit"
              className="bg-emerald-700 text-white font-bold py-2 rounded-lg shadow hover:bg-emerald-900 transition px-4"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCode("");
                setMessage("");
                setError("");
                setIsAdminCode(null);
                setAdminDetails(null);
                setShowAdminModal(false);
              }}
              className="bg-white border border-gray-200 text-gray-700 font-semibold py-2 rounded-lg shadow hover:bg-gray-50 transition px-4"
            >
              Reset
            </button>
          </div>
        </form>
        {message && (
          <div className="mt-2 text-center">
            <p className="text-emerald-700 font-semibold text-sm md:text-base">{message}</p>
            {isAdminCode !== null && (
              <p
                className={`mt-2 inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-semibold border ${
                  isAdminCode
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                {isAdminCode ? "Admin code" : "Resident code"}
              </p>
            )}
          </div>
        )}
        {error && <p className="text-red-700 mt-2 text-center text-sm md:text-base">{error}</p>}
      </div>

      {showAdminModal && adminDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-4 md:p-5 shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-sm"
              onClick={() => setShowAdminModal(false)}
            >
              
            </button>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  ADM
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-emerald-950">Admin code details</p>
                  <p className="text-[11px] text-slate-500">Review what this admin code allows and who raised it.</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                Admin code
              </span>
            </div>

            {adminDetails.itemImageUrl && (
              <div className="mb-3 flex items-center justify-center">
                <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/40">
                  <Image src={adminDetails.itemImageUrl} alt="Admin item" fill className="object-cover" />
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Code</span>
                <span className="rounded-full bg-slate-900 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-50">
                  {adminDetails.code}
                </span>
              </div>
              {adminDetails.purpose && (
                <div>
                  <p className="text-slate-500 mb-0.5">Purpose</p>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-800">
                    {adminDetails.purpose}
                  </p>
                </div>
              )}
              {adminDetails.itemDetails && (
                <div>
                  <p className="text-slate-500 mb-0.5">Item details</p>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-800 whitespace-pre-line">
                    {adminDetails.itemDetails}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 mt-1">
                <div>
                  <p className="text-slate-500 mb-0.5">Resident</p>
                  <p className="rounded-xl border border-emerald-50 bg-emerald-50/70 px-2 py-1 text-[11px] font-semibold text-emerald-900">
                    {adminDetails.residentName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Address</p>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-800 line-clamp-2">
                    {adminDetails.residentAddress || "-"}
                  </p>
                </div>
              </div>
              {adminDetails.itemImageUrl && (
                <div className="mt-3">
                  <p className="text-slate-500 mb-1 text-xs">Uploaded image</p>
                  <div className="w-full max-h-56 relative rounded-xl overflow-hidden border border-slate-200">
                    <Image
                      src={adminDetails.itemImageUrl}
                      alt="Uploaded item"
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                onClick={() => setShowAdminModal(false)}
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