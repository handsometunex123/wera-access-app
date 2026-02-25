"use client";
import React, { useEffect, useState } from "react";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  messages: Array<{
    id: string;
    message: string;
    createdAt: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [response, setResponse] = useState("");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [threadOpenId, setThreadOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line
  }, [page, search]);

  async function fetchTickets() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/support-tickets?page=${page}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load tickets");
      else {
        setTickets(data.tickets);
        setTotalPages(Math.max(1, data.totalPages));
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleClose(id: string) {
    if (!window.confirm("Close this ticket?")) return;
    setLoading(true);
    fetch(`/api/admin/support-tickets/${id}/close`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else fetchTickets();
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }

  function handleRespond(id: string) {
    setRespondingId(id);
    setResponse("");
  }

  async function submitResponse(e: React.FormEvent) {
    e.preventDefault();
    if (!respondingId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/support-tickets/${respondingId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to respond");
      else {
        setRespondingId(null);
        setResponse("");
        fetchTickets();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Support Tickets</h1>
        <div className="flex gap-2 mb-4">
          <input
            className="border rounded px-3 py-2 w-full text-gray-900 placeholder-gray-700"
            placeholder="Search by subject, description, name, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-800 mb-2">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-gray-900">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">User</th>
                <th className="p-2">Email</th>
                <th className="p-2">Subject</th>
                <th className="p-2">Status</th>
                <th className="p-2">Created</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <React.Fragment key={ticket.id}>
                  <tr className="border-b">
                    <td className="p-2 text-gray-900">{ticket.user.fullName}</td>
                    <td className="p-2 text-gray-900">{ticket.user.email}</td>
                    <td className="p-2 text-gray-900">{ticket.subject}</td>
                    <td className="p-2 text-gray-900">{ticket.status}</td>
                    <td className="p-2 text-gray-900">{new Date(ticket.createdAt).toLocaleString()}</td>
                    <td className="p-2">
                      <button
                        className="text-emerald-900 underline font-semibold mr-2"
                        onClick={() => setThreadOpenId(threadOpenId === ticket.id ? null : ticket.id)}
                      >View Thread</button>
                      {ticket.status !== "CLOSED" && (
                        <button
                          className="text-red-800 underline font-semibold"
                          onClick={() => handleClose(ticket.id)}
                        >Close</button>
                      )}
                    </td>
                  </tr>
                  {threadOpenId === ticket.id && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 p-4">
                        <div className="mb-2 font-bold text-emerald-900">Threaded Messages</div>
                        <div className="flex flex-col gap-3 mb-4">
                          {ticket.messages.length === 0 && <div className="text-gray-700">No messages yet.</div>}
                          {ticket.messages.map(msg => (
                            <div key={msg.id} className="rounded-lg border bg-white p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-emerald-900">{msg.user.fullName}</span>
                                <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="text-gray-900">{msg.message}</div>
                            </div>
                          ))}
                        </div>
                        {ticket.status !== "CLOSED" && (
                          <form className="flex flex-col gap-2" onSubmit={e => {
                            e.preventDefault();
                            setRespondingId(ticket.id);
                          }}>
                            <textarea
                              className="border rounded px-3 py-2 w-full text-gray-900 placeholder-gray-700"
                              placeholder="Type your reply..."
                              value={respondingId === ticket.id ? response : ""}
                              onChange={e => {
                                setRespondingId(ticket.id);
                                setResponse(e.target.value);
                              }}
                              required
                            />
                            <div className="flex gap-2">
                              <button type="submit" className="bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-900 transition" disabled={loading}>
                                {loading ? "Sending..." : "Send Reply"}
                              </button>
                              <button type="button" className="bg-gray-300 text-gray-900 px-4 py-2 rounded font-semibold" onClick={() => { setRespondingId(null); setResponse(""); }}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                        {ticket.status === "CLOSED" && <div className="text-gray-700 font-semibold">Ticket closed.</div>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {tickets.length === 0 && !loading && (
                <tr><td colSpan={6} className="text-center p-4 text-gray-700">No support tickets.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-3 py-1 rounded bg-emerald-300 text-emerald-900 font-bold disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >Prev</button>
          <span className="text-gray-900 font-bold">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-emerald-300 text-emerald-900 font-bold disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >Next</button>
        </div>
      </div>
    </div>
  );
}
