
"use client";
import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface AccessCode {
  id: string;
  code: string;
  purpose: string;
  guestName: string;
  inviteStart: string;
  inviteEnd: string;
  usageLimit: number;
  usageType: string;
  status: string;
  createdAt: string;
}

export default function AdminAccessCodesPage() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCodes();
    // eslint-disable-next-line
  }, [page, search]);

  async function fetchCodes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/access-codes?page=${page}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load codes");
      else {
        setCodes(data.codes);
        setTotalPages(data.totalPages);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleRevoke(id: string) {
    if (!window.confirm("Revoke this code?")) return;
    setLoading(true);
    fetch(`/api/admin/access-codes/${id}/revoke`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else fetchCodes();
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }

  // Modal state for viewing code details
  const [modalCode, setModalCode] = useState<AccessCode | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  function handleView(id: string) {
    setModalLoading(true);
    setModalError("");
    fetch(`/api/admin/access-codes/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setModalError(data.error);
        else setModalCode(data.code);
      })
      .catch(() => setModalError("Network error"))
      .finally(() => setModalLoading(false));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Access Codes</h1>
        <div className="flex gap-2 mb-4">
          <input
            className="border rounded px-3 py-2 w-full text-emerald-900 placeholder-emerald-700"
            placeholder="Search by guest, code, purpose..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-700 mb-2">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-emerald-900">
            <thead>
              <tr className="bg-emerald-100 text-emerald-900">
                <th className="p-2">Code</th>
                {/* <th className="p-2">Guest/Luggage</th>
                <th className="p-2">Purpose</th> */}
                <th className="p-2">Valid From</th>
                <th className="p-2">Valid To</th>
                <th className="p-2">Usage Limit</th>
                <th className="p-2">Usage Type</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(code => (
                <tr key={code.id} className="border-b">
                  <td className="p-2 font-mono text-emerald-900">{code.code}</td>
                  {/* <td className="p-2 text-emerald-900">{code.guestName}</td>
                  <td className="p-2 text-emerald-900">{code.purpose}</td> */}
                  <td className="p-2 text-emerald-900">{new Date(code.inviteStart).toLocaleString()}</td>
                  <td className="p-2 text-emerald-900">{new Date(code.inviteEnd).toLocaleString()}</td>
                  <td className="p-2 text-emerald-900">{code.usageLimit}</td>
                  <td className="p-2 text-emerald-900">({code.usageType.replace("_", " ")})</td>
                  <td className={`p-2 ${["USED","EXPIRED","REVOKED"].includes(code.status) ? "text-red-700" : "text-emerald-900"}`}>{code.status}</td>
                  <td className="p-2">
                    <button
                      className="text-emerald-900 underline mr-2"
                      onClick={() => handleView(code.id)}
                    >View</button>
                    {code.status === "ACTIVE" && (
                      <button
                        className="text-red-700 underline"
                        onClick={() => handleRevoke(code.id)}
                      >Revoke</button>
                    )}
                  </td>
                </tr>
              ))}
              {codes.length === 0 && !loading && (
                <tr><td colSpan={8} className="text-center p-4 text-emerald-900">No codes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Modal for code details */}
        {modalCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full relative">
              <button className="absolute top-2 right-4 text-2xl text-emerald-900" onClick={() => setModalCode(null)}>&times;</button>
              <h2 className="text-xl font-bold text-emerald-900 mb-4">Access Code Details</h2>
              <div className="mb-4 flex flex-col items-center">
                <QRCodeSVG value={modalCode.code} size={128} />
                <div className={`font-mono text-4xl mt-2 ${["USED","EXPIRED","REVOKED"].includes(modalCode.status) ? "text-red-700" : "text-emerald-900"}`}>{modalCode.code}</div>
              </div>
              <div className="flex flex-col w-full gap-2 text-sm text-emerald-900 items-center text-center">
                {/* <div><span className="font-semibold">Guest/Luggage:</span> {modalCode.guestName}</div>
                <div><span className="font-semibold">Purpose:</span> {modalCode.purpose}</div> */}
                <div><span className="font-semibold">Valid From:</span> {new Date(modalCode.inviteStart).toLocaleString()}</div>
                <div><span className="font-semibold">Valid To:</span> {new Date(modalCode.inviteEnd).toLocaleString()}</div>
                <div><span className="font-semibold">Usage Limit:</span> {modalCode.usageLimit}</div>
                <div><span className="font-semibold">Usage Type:</span> {modalCode.usageType.replace("_", " ")}</div>
                <div><span className="font-semibold">Status:</span> {modalCode.status}</div>
                <div><span className="font-semibold">Created At:</span> {new Date(modalCode.createdAt).toLocaleString()}</div>
              </div>
              {modalError && <div className="text-red-700 mt-2">{modalError}</div>}
              {modalLoading && <div className="text-emerald-900 mt-2">Loading...</div>}
            </div>
          </div>
        )}
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-3 py-1 rounded bg-emerald-200 text-emerald-900 font-bold disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >Prev</button>
          <span className="text-emerald-900">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-emerald-200 text-emerald-900 font-bold disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >Next</button>
        </div>
      </div>
    </div>
  );
}
