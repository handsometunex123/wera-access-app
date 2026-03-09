"use client";
import React, { useState } from "react";
import QrScanner from "./QrScanner";
import Header from "./Header";
import Image from "next/image";

export default function EstateGuardScanQRPage() {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminDetails, setAdminDetails] = useState<{
    code: string;
    residentName: string;
    residentAddress?: string | null;
    purpose?: string | null;
    itemDetails?: string | null;
    itemImageUrl?: string | null;
  } | null>(null);

  async function handleVerify(scannedCode: string) {
    setLoading(true);
    setError("");
    setSuccess("");
    setAdminDetails(null);
    setCode(scannedCode);
    try {
      const lookup = await fetch(`/api/estate-guard/lookup-code?code=${scannedCode}`);
      if (!lookup.ok) {
        const err = await lookup.json();
        setError(err.error || "Lookup failed");
        setLoading(false);
        return;
      }
      const info = await lookup.json();
      if (info.usageType === "ENTRY_AND_EXIT" && info.usageLimit && info.usageLimit > 1) {
        setPendingCode(scannedCode);
        setActionModalOpen(true);
        setLoading(false);
        return;
      }
      const res = await fetch("/api/estate-guard/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: scannedCode }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Invalid code");
      else {
        setSuccess(data.message || `Code ${scannedCode} verified and guest checked in!`);
        if (data.isAdminCode && data.codeDetails) {
          setAdminDetails({
            code: data.codeDetails.code,
            residentName: data.codeDetails.residentName,
            residentAddress: data.codeDetails.residentAddress,
            purpose: data.codeDetails.purpose,
            itemDetails: data.codeDetails.itemDetails,
            itemImageUrl: data.codeDetails.itemImageUrl,
          });
          setAdminModalOpen(true);
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
    setError("");
    setSuccess("");
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
        setSuccess(data.message || `Code ${pendingCode} verified.`);
        if (data.isAdminCode && data.codeDetails) {
          setAdminDetails({
            code: data.codeDetails.code,
            residentName: data.codeDetails.residentName,
            residentAddress: data.codeDetails.residentAddress,
            purpose: data.codeDetails.purpose,
            itemDetails: data.codeDetails.itemDetails,
            itemImageUrl: data.codeDetails.itemImageUrl,
          });
          setAdminModalOpen(true);
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
        <h1 className="text-xl font-bold text-emerald-900 mb-4 text-center">Scan QR Code</h1>
        <QrScanner
          onScan={handleVerify}
          onError={() => setError("QR scan error. Please try again.")}
        />
        {loading && <div className="mt-4 text-emerald-700 text-center font-semibold">Verifying...</div>}
        {success && <div className="mt-4 text-green-700 text-center font-semibold">{success}</div>}
        {error && <div className="mt-4 text-red-700 text-center font-semibold">{error}</div>}
        {code && !loading && !success && !error && (
          <div className="mt-4 text-lg font-mono text-emerald-800 text-center">Code: {code}</div>
        )}
        {/* Action modal for check-in / check-out choice */}
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
        {/* Admin code details modal (single card with image at bottom) */}
        {adminModalOpen && adminDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setAdminModalOpen(false)}
            />
            <div className="relative z-10 w-11/12 max-w-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-5 border border-red-200 max-h-[80vh] overflow-y-auto flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-red-700">Admin Code</div>
                    <div className="text-xs font-mono text-gray-700">{adminDetails.code}</div>
                  </div>
                  <button
                    type="button"
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={() => setAdminModalOpen(false)}
                    aria-label="Close admin code details"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3 text-xs text-gray-900">
                  <div>
                    <div className="font-semibold text-gray-800">Resident</div>
                    <div>{adminDetails.residentName}</div>
                    {adminDetails.residentAddress && (
                      <div className="text-[11px] text-gray-600">{adminDetails.residentAddress}</div>
                    )}
                  </div>

                  {(adminDetails.purpose || adminDetails.itemDetails) && (
                    <div>
                      <div className="font-semibold text-gray-800">Purpose / Item</div>
                      {adminDetails.purpose && (
                        <div className="text-[11px] text-gray-700">{adminDetails.purpose}</div>
                      )}
                      {adminDetails.itemDetails && (
                        <div className="text-[11px] text-gray-600">{adminDetails.itemDetails}</div>
                      )}
                    </div>
                  )}

                  {adminDetails.itemImageUrl && (
                    <div className="pt-1">
                      <div className="text-xs font-semibold text-gray-800 mb-2">Attached Image</div>
                      <div className="w-full max-h-56 relative rounded-xl overflow-hidden border border-gray-200">
                        <Image
                          src={adminDetails.itemImageUrl}
                          alt="Admin code item"
                          fill
                          sizes="100vw"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
