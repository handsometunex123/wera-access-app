"use client";

import React, { useEffect, useState, useCallback } from "react";
import { UserMinusIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface Dependant {
  id: string;
  fullName: string;
  email: string;
  rejectionReason: string;
}

interface RejectedResident {
  id: string;
  fullName: string;
  email: string;
  rejectionReason: string;
  dependants: Dependant[];
}

export default function RejectedResidentsPage() {
  const [residents, setResidents] = useState<RejectedResident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchResidents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page) });
      const res = await fetch(`/api/admin/rejected-residents?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load residents");
      else {
        setResidents(data.residents || []);
        setTotalPages(Math.max(1, data.totalPages || 1));
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchResidents();
  }, [page, fetchResidents]);

  return (
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <UserMinusIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">
              Rejected residents
            </h1>
            <p className="text-[11px] text-emerald-700">
              Keep a record of applications that were not approved, including dependants.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Pages</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>{totalPages}</span>
        </div>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        {loading && <div className="text-[11px] text-emerald-800">Loading...</div>}
        {error && <div className="mb-2 text-[11px] font-semibold text-red-700">{error}</div>}

        {/* Mobile cards */}
        {!loading && residents.length > 0 && (
          <div className="space-y-3 md:hidden">
            {residents.map((resident) => (
              <div
                key={resident.id}
                className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-[13px] font-semibold text-emerald-950">
                    {resident.fullName}
                  </div>
                  <div className="text-[11px] text-emerald-700">{resident.email}</div>
                  <div className="mt-1 text-[11px] text-rose-700">
                    {resident.rejectionReason}
                  </div>
                </div>
                {resident.dependants.length > 0 && (
                  <div className="mt-2 rounded-xl bg-emerald-50/60 p-2">
                    <div className="mb-1 text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">
                      Dependants
                    </div>
                    <div className="flex flex-col gap-1">
                      {resident.dependants.map((dependant) => (
                        <div key={dependant.id} className="flex flex-col text-[11px]">
                          <span className="font-medium text-emerald-900">
                            {dependant.fullName}
                          </span>
                          <span className="text-emerald-700">{dependant.email}</span>
                          <span className="text-rose-700">{dependant.rejectionReason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && residents.length === 0 && (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
            No rejected residents found.
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/80">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="min-w-full text-xs text-emerald-950">
                <thead className="bg-emerald-50/80 text-[11px] uppercase tracking-wide text-emerald-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Email</th>
                    <th className="px-4 py-2 text-left font-semibold">Rejection reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {residents.map((resident) => (
                    <React.Fragment key={resident.id}>
                      <tr className="bg-white">
                        <td className="px-4 py-2.5 align-middle text-[13px] font-semibold text-emerald-950">
                          {resident.fullName}
                        </td>
                        <td className="px-4 py-2.5 align-middle text-[11px] text-emerald-800">
                          {resident.email}
                        </td>
                        <td className="px-4 py-2.5 align-middle text-[11px] text-rose-700">
                          {resident.rejectionReason}
                        </td>
                      </tr>
                      {resident.dependants.map((dependant) => (
                        <tr key={dependant.id} className="bg-emerald-50/40">
                          <td className="px-4 py-2.5 pl-8 align-middle text-[11px] text-emerald-800">
                            {dependant.fullName}
                          </td>
                          <td className="px-4 py-2.5 align-middle text-[11px] text-emerald-800">
                            {dependant.email}
                          </td>
                          <td className="px-4 py-2.5 align-middle text-[11px] text-rose-700">
                            {dependant.rejectionReason}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  {residents.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={3}
                        className="bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800"
                      >
                        No rejected residents found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col items-center justify-between gap-2 text-[11px] sm:flex-row">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-900 border border-emerald-100">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="px-2 text-[11px] font-medium text-emerald-900">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40"
            >
              Next
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}