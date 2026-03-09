"use client";
import React, { useEffect, useState } from "react";
import { UserIcon } from "@heroicons/react/24/outline";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string; // Added role property
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
      .then(data => {
        const mainResidents = (data.users || []).filter((user: User) => user.role === "MAIN_RESIDENT");
        setUsers(mainResidents);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const numericAmount = amount ? parseInt(amount.replace(/[^0-9]/g, ""), 10) : 0;
    if (!numericAmount || numericAmount < 1) {
      setError("Enter a valid amount.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: numericAmount, description }),
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
    <form className="flex flex-col gap-3 text-[11px]" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-emerald-900">Resident</label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
            <select
              className="w-full appearance-none rounded-full border border-emerald-200 bg-emerald-50/70 pl-9 pr-8 py-1.5 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              required
            >
              <option value="" disabled hidden className="text-emerald-500">
                Select resident...
              </option>
              {users.map(u => (
                <option
                  key={u.id}
                  value={u.id}
                  className="bg-white text-emerald-900 hover:bg-emerald-50"
                >
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-3 h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-emerald-500" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-emerald-900">Amount (₦)</label>
          <input
            type="number"
            step="1"
            min="1"
            className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 25000"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-emerald-900">Description</label>
          <input
            className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Estate service charge for March"
            required
          />
        </div>
      </div>

      <div className="mt-1 flex flex-col gap-6">
        <p className="text-[10px] text-emerald-700">
          These details will show on the resident&apos;s app and in payment history.
        </p>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-[12px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create payment request"}
        </button>
      </div>

      {error && <div className="mt-1 text-[10px] font-medium text-rose-700">{error}</div>}
      {success && <div className="mt-1 text-[10px] font-medium text-emerald-700">{success}</div>}
    </form>
  );
}
