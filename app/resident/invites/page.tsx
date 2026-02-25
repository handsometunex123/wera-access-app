"use client";
import React, { useEffect, useState } from "react";

interface Invite {
  id: string;
  code: string;
  createdAt: string;
  validFrom: string;
  validTo: string;
  forWhom: string;
  numPeople: number;
  status: string;
}

export default function ResidentInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/resident/invites")
      .then(res => res.json())
      .then(data => setInvites(data.invites || []))
      .catch(() => setError("Failed to load invites"))
      .finally(() => setLoading(false));
  }, []);

  // Group invites by month/year
  const grouped = invites.reduce((acc, invite) => {
    const key = new Date(invite.createdAt).toLocaleString("default", { month: "long", year: "numeric" });
    acc[key] = acc[key] || [];
    acc[key].push(invite);
    return acc;
  }, {} as Record<string, Invite[]>);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-emerald-900 mb-4 text-center">My Invites</h1>
        {loading ? (
          <div className="text-center text-emerald-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-700">{error}</div>
        ) : invites.length === 0 ? (
          <div className="text-center text-gray-500">No invites found.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(grouped).map(([month, invites]) => (
              <div key={month}>
                <div className="font-semibold text-emerald-800 mb-2">{month}</div>
                <div className="flex flex-col gap-2">
                  {invites.map(invite => (
                    <div key={invite.id} className="border rounded-lg p-3 bg-gray-50 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-lg tracking-widest text-emerald-800">{invite.code}</span>
                        <span className={`text-xs font-bold rounded px-2 py-1 ${invite.status === "USED" ? "bg-green-100 text-green-700" : invite.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}>{invite.status}</span>
                      </div>
                      <div className="text-xs text-gray-500">Valid: {new Date(invite.validFrom).toLocaleString()} - {new Date(invite.validTo).toLocaleString()}</div>
                      <div className="text-xs text-gray-400">For: {invite.forWhom} | People: {invite.numPeople}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}