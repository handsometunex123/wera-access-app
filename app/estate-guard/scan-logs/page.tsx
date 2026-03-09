"use client";
import React, { useEffect, useState } from "react";

type ScanStat = {
  id: string;
  status: string;
  createdAt: string;
  code: string | null;
  codeType: string | null;
  generatedBy: {
    id: string;
    fullName: string | null;
    address: string | null;
  } | null;
};

export default function ScanLogsPage() {
  const [logs, setLogs] = useState<ScanStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/estate-guard/scan-stats");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Unable to load scan logs.");
          setLogs([]);
          return;
        }
        const all = (data.stats || []) as ScanStat[];
        setLogs(all.slice(0, 5));
      } catch {
        setError("Network error while loading scan logs.");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }

    void loadStats();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-6 md:p-8 border border-emerald-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-900 tracking-tight">
              Scan history
            </h1>
            <p className="text-xs md:text-sm text-emerald-700 mt-1">
              Recent codes scanned at the gate, with their residents and addresses.
            </p>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 text-center text-sm text-emerald-700">
            Loading scan logs...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/40 p-6 text-center text-sm text-emerald-700">
            No scan logs yet. As you verify codes, they will appear here.
          </div>
        )}

        {!loading && !error && logs.length > 0 && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Latest scans
              </p>
              <p className="text-[11px] text-slate-500">Showing last {logs.length} of 5</p>
            </div>
            <ul className="divide-y divide-emerald-100 rounded-xl border border-emerald-100 bg-white">
              {logs.map((log) => {
                const when = new Date(log.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const residentName = log.generatedBy?.fullName || "–";
                const address = log.generatedBy?.address || "–";

                return (
                  <li
                    key={log.id}
                    className="px-3 py-2.5 flex flex-col gap-1 hover:bg-emerald-50/60 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-xs md:text-sm font-semibold text-emerald-900 border border-emerald-100">
                        {log.code || "Unknown"}
                      </span>
                      <span className="text-[10px] md:text-[11px] text-slate-500 whitespace-nowrap">
                        {when}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 text-[11px] md:text-xs text-emerald-900">
                      <span className="font-medium">{residentName}</span>
                      <span className="md:border-l md:border-emerald-100 md:pl-2 text-emerald-800/80 truncate">
                        {address}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
