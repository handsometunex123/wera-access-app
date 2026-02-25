"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  messages: { id: string; message: string; createdAt: string; from: string }[];
}

export default function ResidentSupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resident/support-tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  async function handleNewTicket(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/resident/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setTickets([data.ticket, ...tickets]);
        setShowNew(false);
        setSubject("");
        setMessage("");
      } else {
        setError(data.error || "Failed to create ticket");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-2">
          <Link href="/resident/dashboard" className="inline-flex items-center text-emerald-700 hover:text-emerald-900 font-semibold">
            <span className="mr-2">&#8592;</span> Back
          </Link>
        </div>
        <h1 className="text-xl font-bold text-emerald-900 mb-4 text-center">Support Tickets</h1>
        <button
          className="mb-4 bg-emerald-700 text-white font-bold py-2 px-4 rounded shadow hover:bg-emerald-900 transition"
          onClick={() => setShowNew(v => !v)}
        >
          {showNew ? "Cancel" : "+ New Ticket"}
        </button>
        {showNew && (
          <form className="flex flex-col gap-3 mb-6" onSubmit={handleNewTicket}>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full text-gray-900"
              placeholder="Subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
            <textarea
              className="border rounded px-3 py-2 w-full text-gray-900"
              placeholder="Describe your issue..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-emerald-700 text-white font-bold py-2 rounded shadow hover:bg-emerald-900 transition"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        )}
        {loading ? (
          <div className="text-center text-emerald-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-700">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="text-center text-gray-500">No tickets found.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-emerald-800">{ticket.subject}</span>
                  <span className={`text-xs font-bold rounded px-2 py-1 ${ticket.status === "OPEN" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{ticket.status}</span>
                </div>
                <div className="text-xs text-gray-400 mb-2">{new Date(ticket.createdAt).toLocaleString()}</div>
                <div className="flex flex-col gap-2">
                  {ticket.messages.map(msg => (
                    <div key={msg.id} className="text-xs text-gray-700 border-l-4 pl-2 border-emerald-200">
                      <span className="font-bold text-emerald-700">{msg.from}:</span> {msg.message}
                      <span className="block text-gray-400 text-[10px]">{new Date(msg.createdAt).toLocaleString()}</span>
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