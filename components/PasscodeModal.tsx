"use client";
import React, { useState } from "react";

interface PasscodeModalProps {
  onSubmit: (passcode: string) => void;
  onClose: () => void;
  loading?: boolean;
  error?: string;
}

export default function PasscodeModal({ onSubmit, onClose, loading = false, error = "" }: PasscodeModalProps) {
  const [passcode, setPasscode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passcode.length === 6) {
      onSubmit(passcode);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xs w-full relative flex flex-col items-center">
        <button
          className="absolute top-2 right-4 text-2xl text-emerald-900"
          onClick={onClose}
          aria-label="Close passcode modal"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold text-emerald-900 mb-4">Enter Passcode</h2>
        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
          <input
            type="password"
            className="border rounded px-3 py-2 w-full text-gray-900 text-center text-2xl tracking-widest"
            placeholder="******"
            value={passcode}
            onChange={e => setPasscode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            minLength={6}
            maxLength={6}
            autoFocus
            required
            inputMode="numeric"
            pattern="\d{6}"
            disabled={loading}
          />
          {error && <div className="text-red-700 text-center text-sm">{error}</div>}
          <button
            type="submit"
            className="bg-emerald-700 text-white font-bold py-2 rounded-lg shadow hover:bg-emerald-900 transition text-lg"
            disabled={loading || passcode.length !== 6}
          >
            {loading ? "Verifying..." : "Confirm"}
          </button>
        </form>
      </div>
    </div>
  );
}
