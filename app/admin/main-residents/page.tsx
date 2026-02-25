"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface MainResident {
  id: string;
  fullName: string;
  email: string;
  canGenerateAdminCode: boolean;
}

export default function MainResidentsAdminPage() {
  const [residents, setResidents] = useState<MainResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/main-residents")
      .then(res => res.json())
      .then(data => setResidents(data.residents || []))
      .catch(() => setError("Failed to load residents"))
      .finally(() => setLoading(false));
  }, []);

  const toggleAdminCode = async (id: string, value: boolean) => {
    const res = await fetch(`/api/admin/main-residents/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canGenerateAdminCode: value }),
    });
    const data = await res.json();
    if (data.success) {
      setResidents(residents.map(r => r.id === id ? { ...r, canGenerateAdminCode: value } : r));
      toast.success(`Updated rights for ${data.fullName}`);
    } else {
      toast.error(data.error || "Failed to update rights");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-emerald-900 mb-4 text-center">Main Residents - Admin Code Rights</h1>
        {loading ? (
          <div className="text-center text-emerald-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-700">{error}</div>
        ) : residents.length === 0 ? (
          <div className="text-center text-gray-500">No main residents found.</div>
        ) : (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-center">Can Generate Admin Code</th>
              </tr>
            </thead>
            <tbody>
              {residents.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.fullName}</td>
                  <td className="p-2">{r.email}</td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={r.canGenerateAdminCode}
                      onChange={e => toggleAdminCode(r.id, e.target.checked)}
                      className="w-5 h-5 accent-emerald-600"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
