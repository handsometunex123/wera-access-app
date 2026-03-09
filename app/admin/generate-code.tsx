
"use client";
import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSession } from "next-auth/react";
import { KeyIcon } from "@heroicons/react/24/outline";


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
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <KeyIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">Generate admin code</h1>
            <p className="text-[11px] text-emerald-700">
              Create one-time or limited-use access codes for visitors and deliveries.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Usage cap</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>1 - 4 scans</span>
        </div>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Code details</h2>
          <p className="text-[11px] text-emerald-700">Fill all fields to generate a new admin code.</p>
        </div>

        <form className="flex flex-col gap-3 text-[11px]" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-emerald-900">Purpose</label>
              <input
                className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g. Delivery drop-off"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-emerald-900">Guest / luggage name</label>
              <input
                className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="e.g. Bolt Driver / Box 1"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-emerald-900">Validity (minutes)</label>
              <input
                type="number"
                min={30}
                max={960}
                className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={validityMinutes}
                onChange={e => setValidityMinutes(Number(e.target.value))}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-emerald-900">Usage type</label>
              <div className="inline-flex rounded-full bg-emerald-50/60 p-1 text-[11px] text-emerald-900 border border-emerald-100 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => setUsageType("ENTRY_AND_EXIT")}
                  className={
                    "flex-1 rounded-full px-3 py-1 font-semibold transition " +
                    (usageType === "ENTRY_AND_EXIT"
                      ? "bg-emerald-700 text-emerald-50 shadow-sm"
                      : "bg-transparent text-emerald-800 hover:bg-emerald-100")
                  }
                >
                  Entry & exit
                </button>
                <button
                  type="button"
                  onClick={() => setUsageType("ENTRY_ONLY")}
                  className={
                    "flex-1 rounded-full px-3 py-1 font-semibold transition " +
                    (usageType === "ENTRY_ONLY"
                      ? "bg-emerald-700 text-emerald-50 shadow-sm"
                      : "bg-transparent text-emerald-800 hover:bg-emerald-100")
                  }
                >
                  Entry only
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1 sm:max-w-[220px]">
              <label className="text-[11px] font-medium text-emerald-900">Usage limit</label>
              <div className="inline-flex items-center justify-between rounded-full border border-emerald-200 bg-white px-2 py-1 shadow-sm text-[11px] text-emerald-900">
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-semibold"
                  onClick={() => setUsageLimit(prev => Math.max(1, prev - 1))}
                >
                  -
                </button>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[12px] font-semibold">{usageLimit} scan{usageLimit > 1 ? "s" : ""}</span>
                  <span className="text-[10px] text-emerald-700">Min 1 • Max 4</span>
                </div>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-emerald-50 hover:bg-emerald-800 text-sm font-semibold"
                  onClick={() => setUsageLimit(prev => Math.min(4, prev + 1))}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-emerald-700">Generated codes can be scanned by guards within the validity period.</p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-[12px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate code"}
            </button>
          </div>
        </form>

        {error && <div className="mt-3 text-[10px] font-medium text-rose-700">{error}</div>}
      </section>

      {result && (
        <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Generated code</h2>
            <p className="text-[11px] text-emerald-700">Share this code or QR with estate guards for verification.</p>
          </div>

          <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 px-3 py-3 sm:px-4">
            <div className="mb-3 flex flex-col items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Scan QR</span>
              <QRCodeSVG value={result.code} size={128} />
              <div className="rounded-full bg-white px-3 py-1 font-mono text-[13px] font-semibold text-emerald-900 border border-emerald-100">
                {result.code}
              </div>
            </div>

            <div className="grid gap-2 text-[11px] text-emerald-900 sm:grid-cols-2">
              <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100">
                <span className="font-semibold">Valid from:</span> {new Date(result.inviteStart).toLocaleString()}
              </div>
              <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100">
                <span className="font-semibold">Valid to:</span> {new Date(result.inviteEnd).toLocaleString()}
              </div>
              <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100">
                <span className="font-semibold">Usage limit:</span> {result.usageLimit}
              </div>
              <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100">
                <span className="font-semibold">Usage type:</span> {result.usageType.replace("_", " ")}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
