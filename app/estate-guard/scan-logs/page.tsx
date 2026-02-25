"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface ScanLog {
  id: string;
  code: string;
  status: string;
  reason: string;
  createdAt: string;
  guard?: { id: string; fullName: string } | null;
}

export default function ScanLogsPage() {
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [currentPage, setCurrentPage] = useState(1); // State for current page
  const { data: session } = useSession();
  interface SessionUser {
    id?: string;
    role?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
  const user = (session?.user ?? {}) as SessionUser;

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await fetch("/api/estate-guard/scan-stats");
        const data = await res.json();
        // Filter logs for the logged-in guard
        setScanLogs((data.stats || []).filter((log: ScanLog) => log.guard?.id === user.id));
      } catch {
        setScanLogs([]);
      }
      setLoading(false);
    }
    if (user.id) fetchLogs();
  }, [user.id]);

  const filteredLogs = scanLogs.filter((log) =>
    log.code.toLowerCase().includes(searchQuery.toLowerCase())
  ); // Filter logs based on search query
  const itemsPerPage = 10; // Number of items per page
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ); // Slice logs for current page
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage); // Calculate total pages

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-emerald-50 py-10 px-2 flex flex-col items-center md:pt-24">
        <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-emerald-100">
          <h1 className="text-2xl font-extrabold text-emerald-900 mb-6 text-center tracking-tight">Scanned Codes Log</h1>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search QR Codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-emerald-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            />
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center text-emerald-700 py-4">Loading...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No matching scans found.</div>
            ) : (
              <>
                <table className="min-w-full text-sm border border-emerald-200 rounded-xl shadow-md">
                  <thead>
                    <tr className="bg-emerald-100 text-emerald-900">
                      <th className="px-4 py-3 text-left font-semibold border-b border-emerald-300">Code</th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-emerald-300">Guard</th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-emerald-300">Status</th>
                      <th className="px-4 py-3 text-left font-semibold border-b border-emerald-300">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((scan) => {
                      function formatDate(dateStr: string) {
                        const date = new Date(dateStr);
                        const day = date.getDate();
                        const daySuffix = (d: number) =>
                          d > 3 && d < 21 ? "th" : ["th", "st", "nd", "rd", "th"][Math.min(d % 10, 4)];
                        const month = date.toLocaleString("en-US", { month: "short" });
                        const year = date.getFullYear();
                        let hour = date.getHours();
                        const min = date.getMinutes().toString().padStart(2, "0");
                        const ampm = hour >= 12 ? "PM" : "AM";
                        hour = hour % 12;
                        hour = hour ? hour : 12;
                        return `${day}${daySuffix(day)} ${month} ${year}, ${hour}:${min} ${ampm}`;
                      }
                      return (
                        <tr
                          key={scan.id}
                          className={`${
                            scan.status === "SUCCESS"
                              ? "bg-green-50 hover:bg-green-100"
                              : "bg-red-50 hover:bg-red-100"
                          } transition-colors`}
                        >
                          <td className="px-4 py-3 font-mono border-b border-emerald-300">{scan.code}</td>
                          <td className="px-4 py-3 border-b border-emerald-300">{scan.guard?.fullName || "-"}</td>
                          <td className="px-4 py-3 border-b border-emerald-300">{scan.status}</td>
                          <td className="px-4 py-3 border-b border-emerald-300">{formatDate(scan.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-emerald-200 text-emerald-900 rounded-lg shadow-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-emerald-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-emerald-200 text-emerald-900 rounded-lg shadow-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
