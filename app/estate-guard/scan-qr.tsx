"use client";
import React, { useState } from "react";
import QrScanner from "./QrScanner";
import Header from "./Header";

export default function EstateGuardScanQRPage() {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleVerify(scannedCode: string) {
    setLoading(true);
    setError("");
    setSuccess("");
    setCode(scannedCode);
    try {
      const res = await fetch("/api/estate-guard/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: scannedCode }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Invalid code");
      else setSuccess(`Code ${scannedCode} verified and guest checked in!`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
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
        </div>
      </div>
    </>
  );
}
