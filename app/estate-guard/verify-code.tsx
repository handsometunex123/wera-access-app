"use client";
import React, { useState } from "react";
import Header from "./Header";
import Image from "next/image";

export default function EstateGuardVerifyCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [adminDetails, setAdminDetails] = useState<{
    code: string;
    residentName: string;
    residentAddress?: string | null;
    purpose?: string | null;
    itemDetails?: string | null;
    itemImageUrl?: string | null;
  } | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");
    setAdminDetails(null);
    try {
      const lookup = await fetch(`/api/estate-guard/lookup-code?code=${code}`);
      if (!lookup.ok) {
        const err = await lookup.json();
        setError(err.error || "Lookup failed");
        setLoading(false);
        return;
      }
      const info = await lookup.json();
      if (info.usageType === "ENTRY_AND_EXIT" && info.usageLimit && info.usageLimit > 1) {
        setPendingCode(code);
        setActionModalOpen(true);
        setLoading(false);
        return;
      }
      const res = await fetch("/api/estate-guard/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Invalid code");
      else {
        setResult(data.message || "Code verified and guest checked in!");
        if (data.isAdminCode && data.codeDetails) {
          setAdminDetails({
            code: data.codeDetails.code,
            residentName: data.codeDetails.residentName,
            residentAddress: data.codeDetails.residentAddress,
            purpose: data.codeDetails.purpose,
            itemDetails: data.codeDetails.itemDetails,
            itemImageUrl: data.codeDetails.itemImageUrl,
          });
        }
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function performActionOnPending(action: "CHECK_IN" | "CHECK_OUT") {
    if (!pendingCode) return;
    setActionModalOpen(false);
    setLoading(true);
    setResult(null);
    setError("");
    setAdminDetails(null);
    try {
      const res = await fetch("/api/estate-guard/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pendingCode, action }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Invalid code");
      else {
        setResult(data.message || "Code verified.");
        if (data.isAdminCode && data.codeDetails) {
          setAdminDetails({
            code: data.codeDetails.code,
            residentName: data.codeDetails.residentName,
            residentAddress: data.codeDetails.residentAddress,
            purpose: data.codeDetails.purpose,
            itemDetails: data.codeDetails.itemDetails,
            itemImageUrl: data.codeDetails.itemImageUrl,
          });
        }
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      setPendingCode(null);
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 pt-24">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-xl font-bold text-emerald-900 mb-4 text-center">Verify Access Code</h1>
          <form className="flex flex-col gap-4" onSubmit={handleVerify}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              minLength={6}
              className="border rounded px-4 py-3 text-center text-2xl tracking-widest font-mono text-gray-900 focus:ring-2 focus:ring-emerald-700 outline-none"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              autoFocus
            />
            <button
              type="submit"
              className="bg-emerald-700 text-white font-bold py-3 rounded-lg shadow hover:bg-emerald-900 transition text-lg"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
          {actionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/40" onClick={() => setActionModalOpen(false)} />
              <div className="bg-white rounded-xl shadow-xl p-6 z-10 w-11/12 max-w-sm">
                <h3 className="text-lg font-semibold text-emerald-900">Select action</h3>
                <p className="text-sm text-gray-600 mt-2">Is this a check-in or a check-out?</p>
                <div className="mt-4 flex gap-4">
                  <button className="flex-1 bg-emerald-600 text-white py-2 rounded-lg" onClick={() => performActionOnPending("CHECK_IN")}>Check In</button>
                  <button className="flex-1 bg-gray-100 text-emerald-800 py-2 rounded-lg" onClick={() => performActionOnPending("CHECK_OUT")}>Check Out</button>
                </div>
              </div>
            </div>
          )}
          {result && <div className="mt-4 text-green-700 text-center font-semibold">{result}</div>}
          {adminDetails && (
            <div className="mt-4 border border-red-200 bg-red-50 rounded-xl p-4 text-xs text-red-900 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px] uppercase tracking-wide">Admin Code</span>
                <span className="text-[11px] font-mono">{adminDetails.code}</span>
              </div>
              <div>
                <div className="font-semibold">Resident</div>
                <div>{adminDetails.residentName}</div>
                {adminDetails.residentAddress && <div className="text-[11px] text-red-800">{adminDetails.residentAddress}</div>}
              </div>
              {(adminDetails.purpose || adminDetails.itemDetails) && (
                <div>
                  <div className="font-semibold">Purpose / Item</div>
                  {adminDetails.purpose && <div className="text-[11px]">{adminDetails.purpose}</div>}
                  {adminDetails.itemDetails && <div className="text-[11px] text-red-800">{adminDetails.itemDetails}</div>}
                </div>
              )}
              {adminDetails.itemImageUrl && (
                <div className="mt-1 w-full max-h-40 relative">
                  <Image
                    src={adminDetails.itemImageUrl}
                    alt="Admin code item"
                    fill
                    sizes="100vw"
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
          {error && <div className="mt-4 text-red-700 text-center font-semibold">{error}</div>}
        </div>
      </div>
    </>
  );
}
