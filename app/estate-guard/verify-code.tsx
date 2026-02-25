"use client";
import React, { useState } from "react";
import Header from "./Header";

export default function EstateGuardVerifyCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/estate-guard/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
      } else {
        setResult(data.message || "Code verified and guest checked in!");
      }
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
          {result && <div className="mt-4 text-green-700 text-center font-semibold">{result}</div>}
          {error && <div className="mt-4 text-red-700 text-center font-semibold">{error}</div>}
        </div>
      </div>
    </>
  );
}
