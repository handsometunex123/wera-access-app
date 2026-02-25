"use client";
import React, { useEffect, useState } from "react";

interface User {
  id: string;
  fullName: string;
  email: string;
}

export default function CreatePaymentRequestForm({ onCreated }: { onCreated: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/users?page=1")
      .then(res => res.json())
      .then(data => setUsers(data.users || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount, description }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to create request");
      else {
        setSuccess("Payment request created");
        setUserId("");
        setAmount("");
        setDescription("");
        onCreated();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mb-6 flex flex-col gap-2" onSubmit={handleSubmit}>
      <div>
        <label className="block font-medium mb-1 text-gray-900">Resident</label>
        <select className="border rounded px-3 py-2 w-full text-gray-900" value={userId} onChange={e => setUserId(e.target.value)} required>
          <option value="" className="text-gray-700">Select resident...</option>
          {users.map(u => (
            <option key={u.id} value={u.id} className="text-gray-900">{u.fullName} ({u.email})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1 text-gray-900">Amount (₦)</label>
        <input type="number" min={1} className="border rounded px-3 py-2 w-full text-gray-900" value={amount} onChange={e => setAmount(e.target.value)} required />
      </div>
      <div>
        <label className="block font-medium mb-1 text-gray-900">Description</label>
        <input className="border rounded px-3 py-2 w-full text-gray-900" value={description} onChange={e => setDescription(e.target.value)} required />
      </div>
      <button type="submit" className="bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-900 transition" disabled={loading}>
        {loading ? "Creating..." : "Create Payment Request"}
      </button>
      {error && <div className="text-red-800 text-sm mt-1">{error}</div>}
      {success && <div className="text-emerald-900 text-sm mt-1">{success}</div>}
    </form>
  );
}
