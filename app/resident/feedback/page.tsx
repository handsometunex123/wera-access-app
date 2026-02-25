"use client";
import React, { useState } from "react";

export default function ResidentFeedbackPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch("/api/resident/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to send feedback");
      else setSuccess("Feedback sent! Thank you.");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-emerald-900 mb-4 text-center">Feedback</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <textarea
            className="border rounded px-3 py-2 w-full text-gray-900"
            placeholder="Your feedback..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            rows={5}
          />
          <button
            type="submit"
            className="bg-emerald-700 text-white font-bold py-3 rounded-lg shadow hover:bg-emerald-900 transition text-lg"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Feedback"}
          </button>
        </form>
        {success && <div className="mt-4 text-green-700 text-center font-semibold">{success}</div>}
        {error && <div className="mt-4 text-red-700 text-center font-semibold">{error}</div>}
      </div>
    </div>
  );
}
