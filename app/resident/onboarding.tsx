"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function ResidentOnboardingPage() {
  const [form, setForm] = useState({
    fullName: "",
    address: "",
    password: "",
    phone: "",
    email: "",
    profileImage: "",
  });
  const [dependants, setDependants] = useState([
    { fullName: "", email: "", phone: "", profileImage: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch("/api/resident/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dependants }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to onboard");
      else setSuccess("Onboarding successful! Awaiting admin approval.");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-2">
          <Link href="/resident/dashboard" className="inline-flex items-center text-emerald-700 hover:text-emerald-900 font-semibold">
            <span className="mr-2">&#8592;</span> Back
          </Link>
        </div>
        <h1 className="text-xl font-bold text-emerald-900 mb-4 text-center">Resident Onboarding</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full text-gray-900"
            placeholder="Full Name"
            value={form.fullName}
            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            required
          />
          <input
            type="text"
            className="border rounded px-3 py-2 w-full text-gray-900"
            placeholder="Address"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            required
          />
          <input
            type="email"
            className="border rounded px-3 py-2 w-full text-gray-900"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            type="tel"
            className="border rounded px-3 py-2 w-full text-gray-900"
            placeholder="Phone Number"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            required
          />
          <input
            type="password"
            className="border rounded px-3 py-2 w-full text-gray-900"
            placeholder="6-digit Passcode"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value.replace(/\D/g, "").slice(0,6) }))}
            minLength={6}
            maxLength={6}
            required
          />
          <input
            type="text"
            className="border rounded px-3 py-2 w-full text-gray-900"
            placeholder="Profile Image URL (or upload)"
            value={form.profileImage}
            onChange={e => setForm(f => ({ ...f, profileImage: e.target.value }))}
            required
          />
          <div className="mt-4">
            <div className="font-semibold text-emerald-900 mb-2">Dependants (optional)</div>
            {dependants.map((dep, idx) => (
              <div key={idx} className="mb-4 border rounded p-3 bg-gray-50 flex flex-col gap-2">
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full text-gray-900"
                  placeholder="Dependant Full Name"
                  value={dep.fullName}
                  onChange={e => setDependants(ds => ds.map((d, i) => i === idx ? { ...d, fullName: e.target.value } : d))}
                />
                <input
                  type="email"
                  className="border rounded px-3 py-2 w-full text-gray-900"
                  placeholder="Dependant Email"
                  value={dep.email}
                  onChange={e => setDependants(ds => ds.map((d, i) => i === idx ? { ...d, email: e.target.value } : d))}
                />
                <input
                  type="tel"
                  className="border rounded px-3 py-2 w-full text-gray-900"
                  placeholder="Dependant Phone"
                  value={dep.phone}
                  onChange={e => setDependants(ds => ds.map((d, i) => i === idx ? { ...d, phone: e.target.value } : d))}
                />
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full text-gray-900"
                  placeholder="Dependant Profile Image URL"
                  value={dep.profileImage}
                  onChange={e => setDependants(ds => ds.map((d, i) => i === idx ? { ...d, profileImage: e.target.value } : d))}
                />
                <button
                  type="button"
                  className="text-xs text-red-700 font-semibold hover:underline self-end"
                  onClick={() => setDependants(ds => ds.length > 1 ? ds.filter((_, i) => i !== idx) : ds)}
                  disabled={dependants.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="bg-emerald-100 text-emerald-900 font-bold py-2 px-4 rounded shadow hover:bg-emerald-200 transition text-sm"
              onClick={() => setDependants(ds => [...ds, { fullName: "", email: "", phone: "", profileImage: "" }])}
            >
              + Add Dependant
            </button>
          </div>
          <button
            type="submit"
            className="bg-emerald-700 text-white font-bold py-3 rounded-lg shadow hover:bg-emerald-900 transition text-lg"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
        {success && <div className="mt-4 text-green-700 text-center font-semibold">{success}</div>}
        {error && <div className="mt-4 text-red-700 text-center font-semibold">{error}</div>}
      </div>
    </div>
  );
}
