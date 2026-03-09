"use client";
import React, { useEffect, useState } from "react";
import { PhoneIcon } from "@heroicons/react/24/outline";
import ResidentBackToDashboard from "@/components/ResidentBackToDashboard";

interface AdminContact {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string;
}

export default function ResidentEstateContactsPage() {
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/resident/estate-contacts")
      .then(res => res.json())
      .then(data => setContacts(data.contacts || []))
      .catch(() => setError("Failed to load contacts"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <ResidentBackToDashboard />
        <p className="hidden text-[11px] text-emerald-700 md:inline">Quickly reach estate admins when you need assistance.</p>
      </div>
      <div className="w-full rounded-2xl border border-emerald-100 bg-white/95 shadow-sm p-4 md:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <PhoneIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-semibold text-emerald-950 tracking-tight">Estate contacts</h1>
            <p className="text-[11px] text-emerald-700">Key people in your estate you can call or email.</p>
          </div>
        </div>
        {loading ? (
          <div className="text-[11px] text-emerald-800">Loading...</div>
        ) : error ? (
          <div className="text-[11px] font-semibold text-red-700">{error}</div>
        ) : contacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
            No admin contacts found.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {contacts.map(contact => (
              <div key={contact.id} className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-emerald-50 text-sm font-semibold">
                  {contact.fullName ? contact.fullName.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-emerald-950">{contact.fullName}</span>
                  <span className="text-[11px] text-emerald-700">{contact.email}</span>
                  <span className="text-[11px] text-emerald-700">{contact.phone}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
