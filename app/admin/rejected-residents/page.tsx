"use client";

import React, { useEffect, useState, useCallback } from "react";

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
    <div className="min-h-screen flex justify-center bg-emerald-50">
      <div className="w-full p-8 rounded-2xl shadow-lg bg-white">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Rejected Residents</h1>
        {loading ? <div>Loading...</div> : null}
        {error && <div className="text-red-800 mb-2">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-emerald-900">
            <thead>
              <tr className="bg-emerald-100 text-emerald-900">
                <th className="px-6 py-3 text-left font-semibold text-emerald-900">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-emerald-900">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-emerald-900">Rejection Reason</th>
              </tr>
            </thead>
            <tbody>
              {residents.map(resident => (
                <React.Fragment key={resident.id}>
                  <tr className="border-b">
                    <td className="px-6 py-3 text-emerald-900 font-semibold text-left">{resident.fullName}</td>
                    <td className="px-6 py-3 text-emerald-900 font-semibold text-left">{resident.email}</td>
                    <td className="px-6 py-3 text-emerald-900 font-semibold text-left">{resident.rejectionReason}</td>
                  </tr>
                  {resident.dependants.map(dependant => (
                    <tr key={dependant.id} className="border-b bg-gray-50">
                      <td className="px-6 py-3 pl-12 text-emerald-700 text-left">{dependant.fullName}</td>
                      <td className="px-6 py-3 text-emerald-700 text-left">{dependant.email}</td>
                      <td className="px-6 py-3 text-emerald-700 text-left">{dependant.rejectionReason}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {residents.length === 0 && !loading && (
                <tr><td colSpan={3} className="text-center p-4 text-emerald-900">No rejected residents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded bg-emerald-200 text-emerald-900 font-bold disabled:opacity-50 mr-2">Prev</button>
            <span className="text-emerald-900 font-semibold">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded bg-emerald-200 text-emerald-900 font-bold disabled:opacity-50 ml-2">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}