"use client";
import BackButton from "@/components/BackButton";
import React, { useEffect, useState } from "react";

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
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 mt-4">
        <BackButton/>
        <h1 className="text-xl pt-4 font-bold text-emerald-900 mb-4 text-center">Estate Admin Contacts</h1>
        {loading ? (
          <div className="text-center text-emerald-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-700">{error}</div>
        ) : contacts.length === 0 ? (
          <div className="text-center text-gray-500">No admin contacts found.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {contacts.map(contact => (
              <div key={contact.id} className="border rounded-lg p-4 flex items-center gap-4 bg-gray-50">
                {/* Profile image removed as requested */}
                <div className="flex flex-col">
                  <span className="font-bold text-emerald-900 text-lg">{contact.fullName}</span>
                  <span className="text-xs text-gray-500">{contact.email}</span>
                  <span className="text-xs text-gray-500">{contact.phone}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
