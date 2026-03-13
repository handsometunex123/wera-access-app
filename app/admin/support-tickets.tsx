"use client";
import React, { useEffect, useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

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
    userId: string;
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

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

  async function submitResponse(e: React.FormEvent, id?: string) {
    e.preventDefault();
    const ticketId = id || respondingId;
    if (!ticketId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/support-tickets/${ticketId}/respond`, {
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

  async function saveMessageEdit(ticketId: string, messageId: string) {
    if (!editingText.trim()) return;
    setSavingEdit(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/support-tickets/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: editingText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to edit message");
      } else if (data.ticket) {
        setTickets((prev) => prev.map((t) => (t.id === data.ticket.id ? data.ticket : t)));
        setEditingMessageId(null);
        setEditingTicketId(null);
        setEditingText("");
      }
    } catch {
      setError("Network error editing message");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">Support tickets</h1>
            <p className="text-[11px] text-emerald-700">
              Respond to residents and keep a full conversation history.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Total pages</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>{totalPages}</span>
        </div>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Inbox</h2>
            <p className="text-[11px] text-emerald-700">
              Search by subject, description, name or email.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs transition-all duration-300 ease-out sm:w-64 sm:focus-within:w-80 max-w-full">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500" />
            <input
              className="w-full rounded-full border border-emerald-100 bg-white px-7 py-1.5 pr-8 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                aria-label="Clear search"
              >
                <span className="text-[10px] font-bold">×</span>
              </button>
            )}
          </div>
        </div>
        {loading && (
          <div className="mb-3 space-y-3">
            {/* Mobile skeleton cards */}
            <div className="space-y-3 md:hidden">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm animate-pulse"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3 w-32 rounded-full bg-emerald-50" />
                      <div className="h-2.5 w-40 rounded-full bg-emerald-50" />
                      <div className="h-2.5 w-48 rounded-full bg-emerald-50" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="h-6 w-20 rounded-full bg-emerald-50" />
                      <div className="h-6 w-20 rounded-full bg-rose-50" />
                    </div>
                  </div>
                  <div className="mt-2 h-2.5 w-24 rounded-full bg-emerald-50" />
                </div>
              ))}
            </div>

            {/* Desktop skeleton rows */}
            <div className="hidden md:block">
              <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/80">
                <div className="max-h-[480px] overflow-y-auto">
                  <div className="divide-y divide-emerald-50">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-2.5 text-xs animate-pulse"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-40 rounded-full bg-emerald-50" />
                          <div className="h-2.5 w-32 rounded-full bg-emerald-50" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-6 w-16 rounded-full bg-emerald-50" />
                          <div className="h-6 w-16 rounded-full bg-rose-50" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {error && <div className="mb-2 text-[11px] font-semibold text-red-700">{error}</div>}

        {/* Mobile: stacked cards */}
        {!loading && tickets.length > 0 && (
          <div className="space-y-3 md:hidden">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13px] text-emerald-950 truncate">
                      {ticket.user.fullName}
                    </div>
                    <div className="text-[11px] text-emerald-700 truncate">{ticket.user.email}</div>
                    <div className="mt-1 text-[11px] text-emerald-900 break-words break-all whitespace-normal">
                      {ticket.subject}
                    </div>
                    <div className="mt-1 text-[10px] text-emerald-600">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[11px]">
                    <button
                      className="text-sky-700 hover:underline"
                      onClick={() =>
                        setThreadOpenId(threadOpenId === ticket.id ? null : ticket.id)
                      }
                    >
                      View thread
                    </button>
                    {ticket.status !== "CLOSED" && (
                      <button
                        className="text-rose-700 hover:underline"
                        onClick={() => handleClose(ticket.id)}
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
                {threadOpenId === ticket.id && (
                  <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                    <div className="mb-2 text-[11px] font-semibold text-emerald-900">
                      Threaded messages
                    </div>
                    <div className="mb-4 flex flex-col gap-2">
                      {ticket.messages.length === 0 && (
                        <div className="text-[11px] text-emerald-800">No messages yet.</div>
                      )}
                      {ticket.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={
                            "flex " + (msg.user.id === ticket.user.id ? "justify-start" : "justify-end")
                          }
                        >
                          <div
                            className={
                              "max-w-[80%] rounded-2xl px-3 py-2 text-[11px] " +
                              (msg.user.id === ticket.user.id
                                ? "bg-white border border-emerald-100 text-emerald-900"
                                : "bg-emerald-600 text-emerald-50")
                            }
                          >
                            <div className="mb-0.5 flex items-center justify-between gap-2">
                              <span className="font-semibold">
                                {msg.user.id === ticket.user.id ? ticket.user.fullName : "Admin"}
                              </span>
                              <span className="text-[10px] opacity-80">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            {editingMessageId === msg.id && editingTicketId === ticket.id ? (
                              <div className="mt-1 flex flex-col gap-1">
                                <textarea
                                  className="min-h-[56px] w-full rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[11px] text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                />
                                <div className="flex justify-end gap-2 text-[10px]">
                                  <button
                                    type="button"
                                    className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-800 hover:bg-slate-200"
                                    onClick={() => {
                                      setEditingMessageId(null);
                                      setEditingTicketId(null);
                                      setEditingText("");
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-full bg-emerald-700 px-2 py-1 font-semibold text-emerald-50 hover:bg-emerald-800 disabled:opacity-50"
                                    disabled={savingEdit}
                                    onClick={() => saveMessageEdit(ticket.id, msg.id)}
                                  >
                                    {savingEdit ? "Saving..." : "Save"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="mt-0.5 whitespace-pre-wrap break-words">
                                  {msg.message}
                                </div>
                                {! (msg.user.id === ticket.user.id) &&
                                  now - new Date(msg.createdAt).getTime() <= 60_000 && (
                                    <button
                                      type="button"
                                      className="mt-1 text-[10px] font-semibold underline underline-offset-2 opacity-90"
                                      onClick={() => {
                                        setEditingMessageId(msg.id);
                                        setEditingTicketId(ticket.id);
                                        setEditingText(msg.message);
                                      }}
                                    >
                                      Edit
                                    </button>
                                  )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {ticket.status !== "CLOSED" && (
                      <form
                        className="flex flex-col gap-2"
                        onSubmit={(e) => submitResponse(e, ticket.id)}
                      >
                        <textarea
                          className="h-20 w-full rounded-lg border border-emerald-200 px-3 py-2 text-[11px] text-emerald-900 placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          placeholder="Type your reply..."
                          value={respondingId === ticket.id ? response : ""}
                          onChange={(e) => {
                            setRespondingId(ticket.id);
                            setResponse(e.target.value);
                          }}
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="inline-flex items-center rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-40"
                            disabled={loading}
                          >
                            {loading ? "Sending..." : "Send reply"}
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-800 hover:bg-slate-200"
                            onClick={() => {
                              setRespondingId(null);
                              setResponse("");
                              setThreadOpenId(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                    {ticket.status === "CLOSED" && (
                      <div className="text-[11px] font-semibold text-emerald-800">
                        Ticket closed.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && tickets.length === 0 && (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
            No support tickets.
          </div>
        )}

        {/* Desktop: table with expandable thread */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/80">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="min-w-full text-xs text-emerald-950">
                <thead className="bg-emerald-50/80 text-[11px] uppercase tracking-wide text-emerald-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">User</th>
                    <th className="px-4 py-2 text-left font-semibold">Email</th>
                    <th className="px-4 py-2 text-left font-semibold">Subject</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Created</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {tickets.map((ticket) => (
                    <React.Fragment key={ticket.id}>
                      <tr className="transition hover:bg-emerald-50/60">
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex flex-col">
                            <span className="truncate text-[13px] font-semibold text-emerald-950">
                              {ticket.user.fullName}
                            </span>
                            <span className="truncate text-[11px] text-emerald-700">{ticket.user.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="truncate text-[11px] text-emerald-800">{ticket.user.email}</span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] text-emerald-900">{ticket.subject}</span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] text-emerald-800">{ticket.status}</span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] text-emerald-800">
                            {new Date(ticket.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2 text-[11px]">
                            <button
                              className="text-sky-700 hover:underline"
                              onClick={() =>
                                setThreadOpenId(
                                  threadOpenId === ticket.id ? null : ticket.id,
                                )
                              }
                            >
                              {threadOpenId === ticket.id ? "Hide thread" : "View thread"}
                            </button>
                            {ticket.status !== "CLOSED" && (
                              <button
                                className="text-rose-700 hover:underline"
                                onClick={() => handleClose(ticket.id)}
                              >
                                Close
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {threadOpenId === ticket.id && (
                        <tr>
                          <td colSpan={6} className="bg-emerald-50/40 p-4">
                            <div className="mb-2 text-[11px] font-semibold text-emerald-900">
                              Threaded messages
                            </div>
                            <div className="mb-4 flex flex-col gap-2">
                              {ticket.messages.length === 0 && (
                                <div className="text-[11px] text-emerald-800">No messages yet.</div>
                              )}
                              {ticket.messages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={
                                    "flex " + (msg.user.id === ticket.user.id ? "justify-start" : "justify-end")
                                  }
                                >
                                  <div
                                    className={
                                      "max-w-[70%] rounded-2xl px-3 py-2 text-[11px] " +
                                      (msg.user.id === ticket.user.id
                                        ? "bg-white border border-emerald-100 text-emerald-900"
                                        : "bg-emerald-600 text-emerald-50")
                                    }
                                  >
                                    <div className="mb-0.5 flex items-center justify-between gap-2">
                                      <span className="font-semibold">
                                        {msg.user.id === ticket.user.id ? ticket.user.fullName : "Admin"}
                                      </span>
                                      <span className="text-[10px] opacity-80">
                                        {new Date(msg.createdAt).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    {editingMessageId === msg.id && editingTicketId === ticket.id ? (
                                      <div className="mt-1 flex flex-col gap-1">
                                        <textarea
                                          className="min-h-[56px] w-full rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[11px] text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                          value={editingText}
                                          onChange={(e) => setEditingText(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2 text-[10px]">
                                          <button
                                            type="button"
                                            className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-800 hover:bg-slate-200"
                                            onClick={() => {
                                              setEditingMessageId(null);
                                              setEditingTicketId(null);
                                              setEditingText("");
                                            }}
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            className="rounded-full bg-emerald-700 px-2 py-1 font-semibold text-emerald-50 hover:bg-emerald-800 disabled:opacity-50"
                                            disabled={savingEdit}
                                            onClick={() => saveMessageEdit(ticket.id, msg.id)}
                                          >
                                            {savingEdit ? "Saving..." : "Save"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="mt-0.5 whitespace-pre-wrap break-words">
                                          {msg.message}
                                        </div>
                                        {! (msg.user.id === ticket.user.id) &&
                                          now - new Date(msg.createdAt).getTime() <= 60_000 && (
                                            <button
                                              type="button"
                                              className="mt-1 text-[10px] font-semibold underline underline-offset-2 opacity-90"
                                              onClick={() => {
                                                setEditingMessageId(msg.id);
                                                setEditingTicketId(ticket.id);
                                                setEditingText(msg.message);
                                              }}
                                            >
                                              Edit
                                            </button>
                                          )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {ticket.status !== "CLOSED" && (
                              <form
                                className="flex flex-col gap-2"
                                onSubmit={(e) => submitResponse(e, ticket.id)}
                              >
                                <textarea
                                  className="h-24 w-full rounded-lg border border-emerald-200 px-3 py-2 text-[11px] text-emerald-900 placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                  placeholder="Type your reply..."
                                  value={respondingId === ticket.id ? response : ""}
                                  onChange={(e) => {
                                    setRespondingId(ticket.id);
                                    setResponse(e.target.value);
                                  }}
                                  required
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    className="inline-flex items-center rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-40"
                                    disabled={loading}
                                  >
                                    {loading ? "Sending..." : "Send reply"}
                                  </button>
                                  <button
                                    type="button"
                                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-800 hover:bg-slate-200"
                                    onClick={() => {
                                      setRespondingId(null);
                                      setResponse("");
                                      setThreadOpenId(null);
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            )}
                            {ticket.status === "CLOSED" && (
                              <div className="text-[11px] font-semibold text-emerald-800">
                                Ticket closed.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {tickets.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-[11px] text-emerald-800 bg-emerald-50/40"
                      >
                        No support tickets.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col items-center justify-between gap-2 text-[11px] sm:flex-row">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-900 border border-emerald-100">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="px-2 text-[11px] font-medium text-emerald-900">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40"
            >
              Next
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
