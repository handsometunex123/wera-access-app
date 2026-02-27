
"use client";
import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSession } from "next-auth/react";


export default function AdminGenerateCodePage() {
  const [purpose, setPurpose] = useState("");
  const [guestName, setGuestName] = useState("");
  const [validityMinutes, setValidityMinutes] = useState(60);
  const [usageType, setUsageType] = useState("ENTRY_AND_EXIT");
  const [usageLimit, setUsageLimit] = useState(1);
  type AccessCodeResult = {
    code: string;
    inviteStart: string;
    inviteEnd: string;
    usageLimit: number;
    usageType: string;
  } | null;
  const [result, setResult] = useState<AccessCodeResult>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Get the logged-in admin user ID from next-auth session
  const { data: session } = useSession();
  type SessionUser = { id?: string; role?: string; name?: string | null; email?: string | null; image?: string | null };
  const createdById = (session?.user as SessionUser | undefined)?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createdById, purpose, guestName, validityMinutes, usageType, usageLimit }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to generate code");
      else setResult(data.accessCode);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center bg-gray-50">
      <div className="w-full max-w-2xl p-8 rounded-2xl shadow-lg bg-white">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Generate Admin Access Code</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-emerald-900 font-semibold mb-1">Purpose</label>
            <input className="w-full border rounded px-3 py-2 text-emerald-900 placeholder-emerald-700" value={purpose} onChange={e => setPurpose(e.target.value)} required />
          </div>
          <div>
            <label className="block text-emerald-900 font-semibold mb-1">Guest/Luggage Name</label>
            <input className="w-full border rounded px-3 py-2 text-emerald-900 placeholder-emerald-700" value={guestName} onChange={e => setGuestName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-emerald-900 font-semibold mb-1">Validity (minutes)</label>
            <input type="number" min={30} max={960} className="w-full border rounded px-3 py-2 text-emerald-900 placeholder-emerald-700" value={validityMinutes} onChange={e => setValidityMinutes(Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-emerald-900 font-semibold mb-1">Usage Type</label>
            <select className="w-full border rounded px-3 py-2 text-emerald-900" value={usageType} onChange={e => setUsageType(e.target.value)}>
              <option value="ENTRY_ONLY">Entry Only</option>
              <option value="ENTRY_AND_EXIT">Entry and Exit</option>
            </select>
          </div>
          <div>
            <label className="block text-emerald-900 font-semibold mb-1">Usage Limit</label>
            <input
              type="number"
              min={1}
              max={4}
              className="w-full border rounded px-3 py-2 text-emerald-900 placeholder-emerald-700"
              value={usageLimit}
              onChange={e => setUsageLimit(Math.max(1, Math.min(4, Number(e.target.value))))}
              required
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-semibold py-2 rounded-lg shadow hover:bg-emerald-700 transition" disabled={loading}>
            {loading ? "Generating..." : "Generate Code"}
          </button>
        </form>
        {error && <div className="mt-4 text-red-700 text-sm">{error}</div>}
        {result && (
          <div className="mt-6 p-4 border rounded bg-emerald-50">
            <div className="mt-4 flex flex-col items-center">
              <span className="text-xs text-emerald-900 font-semibold mb-1">Scan QR for code</span>
              <QRCodeSVG value={result.code} size={128} />
            </div>
            <div className="font-bold text-lg text-emerald-900">Code: {result.code}</div>
            <div className="text-emerald-900">Valid From: {new Date(result.inviteStart).toLocaleString()}</div>
            <div className="text-emerald-900">Valid To: {new Date(result.inviteEnd).toLocaleString()}</div>
            <div className="text-emerald-900">Usage Limit: {result.usageLimit}</div>
            <div className="text-emerald-900">Usage Type: {result.usageType.replace("_", " ")}</div>
          </div>
        )}
      </div>
    </div>
  );
}
