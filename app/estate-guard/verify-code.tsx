"use client";
import React, { useState } from "react";
import Header from "./Header";

export default function EstateGuardVerifyCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");
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
      else setResult(data.message || "Code verified and guest checked in!");
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
    try {
      const res = await fetch("/api/estate-guard/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pendingCode, action }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Invalid code");
      else setResult(data.message || "Code verified.");
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
          {error && <div className="mt-4 text-red-700 text-center font-semibold">{error}</div>}
        </div>
      </div>
    </>
  );
}
