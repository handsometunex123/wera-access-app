"use client";
import React, { useEffect, useState } from "react";
import ResidentBackToDashboard from "@/components/ResidentBackToDashboard";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

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
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [now, setNow] = useState<number>(Date.now());

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
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
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

  async function handleReply(e: React.FormEvent, ticketId: string) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/resident/support-tickets/${ticketId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setTickets(prev => prev.map(t => (t.id === data.ticket.id ? data.ticket : t)));
        setReply("");
        setReplyingId(null);
      } else {
        setError(data.error || "Failed to send reply");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditMessage(ticketId: string, messageId: string) {
    if (!editingText.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/resident/support-tickets/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: editingText }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setTickets(prev => prev.map(t => (t.id === data.ticket.id ? data.ticket : t)));
        setEditingMessageId(null);
        setEditingText("");
      } else {
        setError(data.error || "Failed to edit message");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <ResidentBackToDashboard />
        <p className="hidden text-[11px] text-emerald-700 md:inline">Reach your estate admins whenever you need help.</p>
      </div>
      <div className="w-full rounded-2xl border border-emerald-100 bg-white/95 shadow-sm p-4 md:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-semibold text-emerald-950 tracking-tight">Support tickets</h1>
              <p className="text-[11px] text-emerald-700">Open a ticket and keep the full conversation in one place.</p>
            </div>
          </div>
          <button
            className="rounded-full bg-emerald-700 px-4 py-2 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
            onClick={() => setShowNew(v => !v)}
          >
            {showNew ? "Cancel" : "+ New ticket"}
          </button>
        </div>

        {showNew && (
          <form className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 md:p-4" onSubmit={handleNewTicket}>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-emerald-900">Subject</label>
              <input
                type="text"
                className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Briefly describe your issue"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-emerald-900">Details</label>
              <textarea
                className="min-h-[96px] w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Share as much detail as possible..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit ticket"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-[11px] text-emerald-800">Loading...</div>
        ) : error ? (
          <div className="text-[11px] font-semibold text-red-700">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
            No support tickets yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map(ticket => (
              <div key={ticket.id} className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="truncate text-[13px] font-semibold text-emerald-900">{ticket.subject}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      ticket.status === "OPEN"
                        ? "bg-amber-50 text-amber-800"
                        : "bg-emerald-600 text-emerald-50"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-600 mb-2">
                  {new Date(ticket.createdAt).toLocaleString()}
                </div>
                <div className="flex flex-col gap-2">
                  {ticket.messages.map(msg => {
                    const isMine = msg.from === "You";
                    const canEdit =
                      isMine && now - new Date(msg.createdAt).getTime() <= 60_000;
                    const isEditing = editingMessageId === msg.id;
                    return (
                      <div
                        key={msg.id}
                        className={"flex " + (isMine ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={
                            "max-w-[80%] rounded-2xl px-3 py-2 text-[11px] " +
                            (isMine
                              ? "bg-emerald-600 text-emerald-50"
                              : "bg-emerald-50/80 border border-emerald-100 text-emerald-900")
                          }
                        >
                          <div className="mb-0.5 flex items-center justify-between gap-2">
                            <span className="font-semibold">{msg.from}</span>
                            <span className="text-[10px] opacity-80">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {isEditing ? (
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
                                    setEditingText("");
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="rounded-full bg-emerald-700 px-2 py-1 font-semibold text-emerald-50 hover:bg-emerald-800 disabled:opacity-50"
                                  disabled={submitting}
                                  onClick={() => handleEditMessage(ticket.id, msg.id)}
                                >
                                  {submitting ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="mt-0.5 whitespace-pre-wrap break-words">{msg.message}</div>
                              {canEdit && (
                                <button
                                  type="button"
                                  className="mt-1 text-[10px] font-semibold underline underline-offset-2 opacity-90"
                                  onClick={() => {
                                    setEditingMessageId(msg.id);
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
                    );
                  })}
                </div>
                {ticket.status === "OPEN" && (
                  <form
                    className="mt-3 flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3"
                    onSubmit={(e) => handleReply(e, ticket.id)}
                  >
                    <label className="text-[11px] font-medium text-emerald-900">Reply to estate admins</label>
                    <textarea
                      className="min-h-[72px] w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="Type your reply..."
                      value={replyingId === ticket.id ? reply : ""}
                      onChange={(e) => {
                        setReplyingId(ticket.id);
                        setReply(e.target.value);
                      }}
                      required
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-800 hover:bg-slate-200"
                        onClick={() => {
                          setReplyingId(null);
                          setReply("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-50"
                        disabled={submitting && replyingId === ticket.id}
                      >
                        {submitting && replyingId === ticket.id ? "Sending..." : "Send reply"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}