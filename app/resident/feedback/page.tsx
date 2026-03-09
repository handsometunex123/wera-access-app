"use client";
import React, { useState } from "react";
import ResidentBackToDashboard from "@/components/ResidentBackToDashboard";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

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
      if (!res.ok) {
        setError(data.error || "Failed to send feedback");
      } else {
        setSuccess("Feedback sent! Thank you.");
        setMessage("");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <ResidentBackToDashboard />
        <p className="hidden text-[11px] text-emerald-700 md:inline">
          Share quick feedback to help improve your estate.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-emerald-100 bg-white/95 shadow-sm p-4 md:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-semibold text-emerald-950 tracking-tight">Feedback</h1>
              <p className="text-[11px] text-emerald-700">
                Tell us what&apos;s working well and what could be better.
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-[11px] text-emerald-900">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-800">
            {error}
          </div>
        )}

        <form
          className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 md:p-4"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-emerald-900">Your feedback</label>
            <textarea
              className="min-h-[112px] w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Share suggestions, issues or anything on your mind..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
