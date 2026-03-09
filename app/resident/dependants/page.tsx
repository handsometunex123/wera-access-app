"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import ResidentBackToDashboard from "@/components/ResidentBackToDashboard";
import { XMarkIcon } from "@heroicons/react/24/solid";

import { toast } from "react-hot-toast";

interface PermissionRequest {
  dependantId: string;
  dependantName: string;
}

interface Dependant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  relationship?: string;
  profileImage?: string;
  canManageCodes?: boolean;
}

export default function DependantsPage() {
  // Permission request modal state (must be inside component)
  const [requesting, setRequesting] = useState<PermissionRequest | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRequestPermission = (dep: Dependant) => {
    setRequesting({ dependantId: dep.id, dependantName: dep.fullName });
    setReason("");
  };

  const submitPermissionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesting) return;
    setSubmitting(true);
    const res = await fetch("/api/resident/dependants/request-code-permission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependantId: requesting.dependantId, reason }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) {
      toast.success("Request sent for admin approval");
      setRequesting(null);
    } else {
      toast.error(data.error || "Failed to send request");
    }
  };
  const [dependants, setDependants] = useState<Dependant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/resident/dependants")
      .then(res => res.json())
      .then(data => setDependants(data.dependants || []))
      .catch(() => setError("Failed to load dependants"))
      .finally(() => setLoading(false));
  }, []);

  const removeDependant = async (id: string) => {
    if (!confirm("Remove this dependant? They will lose access to the app.")) return;
    const res = await fetch("/api/resident/dependants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) {
      setDependants(dependants.filter(d => d.id !== id));
      toast.success("Dependant removed");
    } else {
      toast.error(data.error || "Failed to remove dependant");
    }
  };


  // Add dependant modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    relationship: "",
    photo: undefined as File | undefined,
    photoPreview: "",
  });
  const [adding, setAdding] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "photo" && files && files[0]) {
      const file = files[0];
      setForm(f => ({ ...f, photo: file }));
      const reader = new FileReader();
      reader.onload = ev => setForm(f => ({ ...f, photoPreview: ev.target?.result as string }));
      reader.readAsDataURL(file);
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleAddDependant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const formData = new FormData();
    formData.append("fullName", form.fullName);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("relationship", form.relationship);
    if (form.photo) formData.append("photo", form.photo);
    const res = await fetch("/api/resident/dependants", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setAdding(false);
    if (data.success) {
      setDependants([data.dependant, ...dependants]);
      setForm({ fullName: "", email: "", phone: "", relationship: "", photo: undefined, photoPreview: "" });
      setShowAddModal(false);
      toast.success("Dependant added (pending admin approval)");
    } else {
      toast.error(data.error || "Failed to add dependant");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <ResidentBackToDashboard />
        <p className="hidden text-[11px] text-emerald-700 md:inline">Manage access for your family and dependants.</p>
      </div>
      <div className="w-full rounded-2xl border border-emerald-100 bg-white/95 shadow-sm p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">Dependants</p>
          <h1 className="text-lg md:text-xl font-semibold text-emerald-950 tracking-tight">My dependants</h1>
          <p className="text-[12px] text-slate-500">Add or remove people who can use the estate app on your behalf.</p>
        </div>
        <div className="mb-4">
          <button
            className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 shadow-sm transition text-sm"
            onClick={() => setShowAddModal(true)}
          >
            + Add dependant
          </button>
        </div>
        {loading ? (
          <div className="text-center text-emerald-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-700">{error}</div>
        ) : dependants.length === 0 ? (
          <div className="text-center text-gray-500">No dependants found.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {dependants.map(dep => (
              <div key={dep.id} className="border border-emerald-100 rounded-xl p-4 flex flex-col gap-2 bg-emerald-50/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-emerald-800">{dep.fullName}</span>
                  <span className={`text-xs font-bold rounded px-2 py-1 ${dep.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : dep.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-gray-200 text-gray-500"}`}>{dep.status}</span>
                </div>
                <div className="text-xs text-slate-600">{dep.email} | {dep.phone}</div>
                {dep.relationship && <div className="text-xs text-slate-500">Relationship: {dep.relationship}</div>}
                <div className="flex gap-2 mt-2">
                  <button
                    className="px-3 py-1.5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold shadow text-xs"
                    onClick={() => handleRequestPermission(dep)}
                  >
                    Request code access
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-900 font-semibold shadow text-xs"
                    onClick={() => removeDependant(dep.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2">
            <div className="bg-white rounded-xl shadow-2xl p-3 md:p-6 w-full max-w-sm md:max-w-md relative flex flex-col items-center animate-fadeIn gap-3">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-emerald-700 transition"
                onClick={() => setShowAddModal(false)}
                aria-label="Close dialog"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold text-emerald-900 mb-2 text-center">Add New Dependant</h2>
              <form className="w-full flex flex-col gap-3" onSubmit={handleAddDependant}>
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-200 bg-gray-100 flex items-center justify-center">
                    {form.photoPreview ? (
                      <Image
                        src={form.photoPreview}
                        alt="Dependant avatar"
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-5xl">+</span>
                    )}
                  </div>
                  <label className="block w-full cursor-pointer mt-2">
                    <div className="border-2 border-dashed border-emerald-300 rounded-xl p-3 text-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition">
                      {form.photo ? form.photo.name : "Click or drag to upload photo"}
                      <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFormChange}
                      />
                    </div>
                  </label>
                </div>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  className="border rounded px-3 py-2 text-sm"
                  value={form.fullName}
                  onChange={handleFormChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="border rounded px-3 py-2 text-sm"
                  value={form.email}
                  onChange={handleFormChange}
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  className="border rounded px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={handleFormChange}
                  required
                />
                <input
                  type="text"
                  name="relationship"
                  placeholder="Relationship (e.g. Son, Spouse)"
                  className="border rounded px-3 py-2 text-sm"
                  value={form.relationship}
                  onChange={handleFormChange}
                />
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded px-4 py-2 mt-2 disabled:opacity-60"
                  disabled={adding}
                >
                  {adding ? "Adding..." : "Add Dependant"}
                </button>
              </form>
            </div>
          </div>
        )}
        {/* Permission request modal */}
        {requesting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2">
            <div className="bg-white rounded-xl shadow-2xl p-3 md:p-6 w-full max-w-sm md:max-w-md relative flex flex-col items-center animate-fadeIn gap-3">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-emerald-700 transition"
                onClick={() => setRequesting(null)}
                aria-label="Close dialog"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold text-emerald-900 mb-2 text-center">Request Code Module Access</h2>
              <div className="text-center text-gray-700 mb-2">
                You are requesting permission for <span className="font-semibold">{requesting.dependantName}</span> to access code modules.<br />
                Please provide a reason for admin approval.
              </div>
              <form className="w-full flex flex-col gap-3" onSubmit={submitPermissionRequest}>
                <textarea
                  className="border rounded px-3 py-2 text-sm w-full"
                  placeholder="Reason for granting code access..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  rows={3}
                />
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded px-4 py-2 mt-2 disabled:opacity-60"
                  disabled={submitting || !reason.trim()}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
