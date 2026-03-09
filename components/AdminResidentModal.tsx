"use client";

import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  NoSymbolIcon,
  CreditCardIcon,
  FingerPrintIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import { useNotify } from "./useNotify";

export type ActivityItem = {
  id: string;
  residentId?: string | null;
  residentName: string;
  accessMethod: "ACCESS_CARD" | "FINGERPRINT" | "ACCESS_CODE";
  accessLabel: string;
  verb: string;
  createdAt: string;
};

export type ResidentAccessCard = {
  id: string;
  code: string;
  status: string;
  usageType: string;
  lastUsedAt: string;
  lastUsedBy?: { id: string; fullName: string | null };
};

export type ResidentFingerprintSummary = {
  hasActivity: boolean;
  lastUsedAt: string | null;
  totalScans: number;
};

export type ResidentDetail = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  estateUniqueId: string;
  role?:
    | "MAIN_RESIDENT"
    | "DEPENDANT"
    | "ESTATE_GUARD"
    | "ADMIN"
    | string
    | null;
  status: string;
  profileImage?: string | null;
  address: string;
  relationship?: string | null;
  createdAt: string;
  mainResident: {
    id: string;
    fullName: string;
    email: string;
    profileImage?: string | null;
    status: string;
  } | null;
  dependants: {
    id: string;
    fullName: string;
    email: string;
    profileImage?: string | null;
    status: string;
  }[];
  accessCards: ResidentAccessCard[];
  fingerprintSummary: ResidentFingerprintSummary;
  activity: ActivityItem[];
};

export type AdminResidentModalProps = {
  open: boolean;
  userId: string | null;
  onClose: () => void;
};

function maskAccessCode(code: string): string {
  if (!code) return "";
  const value = String(code);
  if (value.length <= 4) return value;
  const start = value.slice(0, 3);
  const end = value.slice(-2);
  const middle = "X".repeat(Math.max(0, value.length - 5));
  return `${start}${middle}${end}`;
}

export default function AdminResidentModal({ open, userId, onClose }: AdminResidentModalProps) {
  const notify = useNotify();
  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [residentActivityFilter, setResidentActivityFilter] = useState<"all" | "in" | "out">("all");
  const [fingerprintEnabled, setFingerprintEnabled] = useState<boolean | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disableReason, setDisableReason] = useState("");
  const [assignCardModalOpen, setAssignCardModalOpen] = useState(false);
  const [assignCardPurpose, setAssignCardPurpose] = useState("");
  const [assignCardValidity, setAssignCardValidity] = useState(60);
  const [assignCardUsageType, setAssignCardUsageType] = useState<"ENTRY_ONLY" | "ENTRY_AND_EXIT">("ENTRY_AND_EXIT");
  const [assignCardUsageLimit, setAssignCardUsageLimit] = useState(1);
  const [fingerprintDisableModalOpen, setFingerprintDisableModalOpen] = useState(false);
  const [fingerprintDisableReason, setFingerprintDisableReason] = useState("");

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    let cancelled = false;

    // Starting a fresh load for this user
    setLoading(true);
    setError(null);
    setResident(null);
    setShowSkeleton(true);

    const load = async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}/details`);
        const data = await res.json();
        if (!res.ok || !data.user) {
          if (!cancelled) {
            setError(data.error || "Unable to load resident details");
            setResident(null);
          }
          return;
        }
        if (cancelled) return;

        const u = data.user as ResidentDetail & {
          mainResident: ResidentDetail["mainResident"];
          dependants: ResidentDetail["dependants"];
        };

        const detail: ResidentDetail = {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          estateUniqueId: u.estateUniqueId,
          role: u.role,
          status: u.status,
          profileImage: u.profileImage ?? null,
          address: u.address,
          relationship: u.relationship,
          createdAt: u.createdAt,
          mainResident: u.mainResident ?? null,
          dependants: Array.isArray(u.dependants) ? u.dependants : [],
          accessCards: (data.accessCards || []) as ResidentAccessCard[],
          fingerprintSummary: (data.fingerprintSummary || {
            hasActivity: false,
            lastUsedAt: null,
            totalScans: 0,
          }) as ResidentFingerprintSummary,
          activity: (data.activity || []) as ActivityItem[],
        };

        setResident(detail);
        const profiled = detail.fingerprintSummary.hasActivity;
        setFingerprintEnabled(profiled);
        setEmailSubject("");
        setEmailBody("");
        setChatMessage("");
        setDisableReason("");
        setAssignCardPurpose("");
        setFingerprintDisableReason("");
        setResidentActivityFilter("all");
      } catch {
        if (!cancelled) {
          setError("Network error loading resident details");
          setResident(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  // Keep skeleton visible slightly longer after data loads
  useEffect(() => {
    if (!open) {
      setShowSkeleton(false);
      return;
    }

    if (loading) {
      setShowSkeleton(true);
      return;
    }

    if (!loading && error) {
      setShowSkeleton(false);
      return;
    }

    if (!loading && !error && resident) {
      const timeout = setTimeout(() => {
        setShowSkeleton(false);
      }, 250); // small delay so content swap feels smooth

      return () => clearTimeout(timeout);
    }
  }, [open, loading, error, resident]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl shadow-emerald-900/20">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow hover:bg-slate-200 hover:text-slate-700"
          aria-label="Close resident details"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
        <div className="max-h-[80vh] overflow-y-auto px-5 pb-5 pt-4 md:px-7 md:pb-6 md:pt-5">
          {showSkeleton && (
            <div className="space-y-3 text-sm text-slate-500">
              <div className="h-4 w-40 rounded-full bg-slate-100" />
              <div className="h-3 w-64 rounded-full bg-slate-100" />
              <div className="h-3 w-52 rounded-full bg-slate-100" />
              <div className="mt-4 h-24 rounded-xl bg-slate-50" />
            </div>
          )}
          {!showSkeleton && error && <div className="text-sm font-medium text-red-600">{error}</div>}
          {!showSkeleton && !error && resident && (
            <div className="grid gap-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {resident.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resident.profileImage}
                      alt={resident.fullName}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-100"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-900 ring-2 ring-emerald-200">
                      {resident.fullName
                        .split(" ")
                        .filter(Boolean)
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-emerald-950">{resident.fullName}</p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-600">
                      {resident.role === "MAIN_RESIDENT"
                        ? "Main resident"
                        : resident.role === "DEPENDANT"
                        ? "Dependant"
                        : resident.role === "ESTATE_GUARD"
                        ? "Estate guard"
                        : resident.role === "ADMIN"
                        ? "Admin"
                        : "User"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        {resident.status}
                      </span>
                      <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                        ID: {resident.estateUniqueId}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Email: </span>
                    <a href={`mailto:${resident.email}`} className="text-emerald-700 hover:text-emerald-800">
                      {resident.email}
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Phone: </span>
                    <a href={`tel:${resident.phone}`} className="text-emerald-700 hover:text-emerald-800">
                      {resident.phone}
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Address: </span>
                    <span>{resident.address}</span>
                  </p>
                </div>
                {resident.mainResident && resident.role === "DEPENDANT" && (
                  <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 px-3 py-2 text-xs text-emerald-900">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      Main resident
                    </p>
                    <p className="mt-0.5 font-medium">{resident.mainResident.fullName}</p>
                    <p className="text-[11px] text-emerald-800">{resident.mainResident.email}</p>
                  </div>
                )}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Profile actions
                  </p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50"
                      onClick={() => {
                        setEmailSubject("Message from your estate admin");
                        setEmailBody("");
                        setEmailModalOpen(true);
                      }}
                    >
                      <EnvelopeIcon className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Send Email</span>
                    </button>
                    <a
                      href={`tel:${resident.phone}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50"
                    >
                      <PhoneIcon className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Call Resident</span>
                    </a>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50"
                      onClick={() => {
                        setChatMessage("");
                        setChatModalOpen(true);
                      }}
                    >
                      <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Chat User</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-rose-700"
                      onClick={() => {
                        setDisableReason("");
                        setDisableModalOpen(true);
                      }}
                    >
                      <NoSymbolIcon className="h-3.5 w-3.5" />
                      <span>Disable user</span>
                    </button>
                  </div>
                </div>
                {resident.role === "MAIN_RESIDENT" && resident.dependants.length > 0 && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs text-slate-800">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      Household dependants
                    </p>
                    <ul className="mt-1 space-y-1.5">
                      {resident.dependants.map((d) => (
                        <li key={d.id} className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-medium text-slate-900">{d.fullName}</p>
                            <p className="truncate text-[10px] text-slate-600">{d.email}</p>
                          </div>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {d.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {resident.role !== "ESTATE_GUARD" && (
                  <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                          Access cards
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Physical-style cards linked to this household.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-700"
                        onClick={() => {
                          setAssignCardPurpose(`Physical card for ${resident.fullName}`);
                          setAssignCardValidity(1440);
                          setAssignCardUsageType("ENTRY_AND_EXIT");
                          setAssignCardUsageLimit(1);
                          setAssignCardModalOpen(true);
                        }}
                      >
                        <CreditCardIcon className="h-3.5 w-3.5" />
                        <span>Assign card</span>
                      </button>
                    </div>
                    {resident.accessCards.length === 0 ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        No access card activity recorded for this household yet.
                      </p>
                    ) : (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {resident.accessCards.slice(0, 4).map((card) => {
                          const isRevealed = false;
                          const masked = maskAccessCode(card.code);
                          return (
                            <div
                              key={card.id}
                              className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 p-3 text-xs text-emerald-50 shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                                  Access card
                                </p>
                                <span className="rounded-full bg-emerald-700/70 px-2 py-0.5 text-[10px] font-semibold">
                                  {card.status}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold tracking-wide">
                                  {isRevealed ? card.code : masked}
                                </p>
                                <button
                                  type="button"
                                  className="text-[10px] font-semibold underline underline-offset-2 text-emerald-100/90 hover:text-white"
                                  onClick={() => {
                                    // handled via masked display only for now
                                  }}
                                >
                                  {isRevealed ? "Hide" : "Show"}
                                </button>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-emerald-100/90">
                                <span>
                                  {card.usageType === "ENTRY_ONLY" ? "Entry only" : "Entry & exit"}
                                </span>
                                <span>
                                  Last used {new Date(card.lastUsedAt).toLocaleString()} by {card.lastUsedBy?.fullName ?? "resident"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {resident.role !== "ESTATE_GUARD" && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FingerPrintIcon className="h-4 w-4 text-emerald-800" />
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                            Fingerprint access
                          </p>
                          <p className="text-[11px] text-emerald-800">
                            {(() => {
                              const profiled = resident.fingerprintSummary.hasActivity;
                              const enabled = fingerprintEnabled ?? profiled;
                              if (!profiled) return "No fingerprint profiled yet.";
                              if (enabled) return "Enabled for gate verification";
                              return "Fingerprint profiled but currently disabled";
                            })()}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-pressed={(fingerprintEnabled ?? resident.fingerprintSummary.hasActivity) || false}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          (fingerprintEnabled ?? resident.fingerprintSummary.hasActivity)
                            ? "bg-emerald-600"
                            : "bg-slate-300"
                        }`}
                        onClick={() => {
                          const profiled = resident.fingerprintSummary.hasActivity;
                          const enabled = fingerprintEnabled ?? profiled;
                          if (!enabled) {
                            if (!profiled) {
                              notify(
                                "This resident does not have a fingerprint profiled yet. Please enrol their fingerprint in the fingerprint system before enabling.",
                                "error",
                              );
                              return;
                            }
                            setFingerprintEnabled(true);
                            return;
                          }
                          setFingerprintDisableReason("");
                          setFingerprintDisableModalOpen(true);
                        }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            (fingerprintEnabled ?? resident.fingerprintSummary.hasActivity)
                              ? "translate-x-4"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-800">
                      {resident.fingerprintSummary.hasActivity
                        ? `Recent fingerprint activity (${resident.fingerprintSummary.totalScans} scans)`
                        : "No fingerprint activity recorded yet."}
                    </p>
                    {resident.fingerprintSummary.lastUsedAt && (
                      <p className="text-[11px] text-emerald-800/80">
                        Last used {new Date(resident.fingerprintSummary.lastUsedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-3 md:p-4 text-xs flex flex-col max-h-[510px]">
                <h2 className="text-sm font-semibold text-emerald-950 tracking-tight mb-1">Resident activity</h2>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <p className="text-[11px] text-emerald-700">
                    {resident.role === "DEPENDANT"
                      ? "Access activity for this dependant."
                      : "Access code activity for this household."}
                  </p>
                  <div className="inline-flex rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-medium overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setResidentActivityFilter("all")}
                      className={`px-2 py-1 ${
                        residentActivityFilter === "all" ? "bg-emerald-600 text-white" : "text-emerald-700"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setResidentActivityFilter("in")}
                      className={`px-2 py-1 border-l border-emerald-100 ${
                        residentActivityFilter === "in" ? "bg-emerald-600 text:white" : "text-emerald-700"
                      }`}
                    >
                      In
                    </button>
                    <button
                      type="button"
                      onClick={() => setResidentActivityFilter("out")}
                      className={`px-2 py-1 border-l border-emerald-100 ${
                        residentActivityFilter === "out" ? "bg-emerald-600 text-white" : "text-emerald-700"
                      }`}
                    >
                      Out
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
                  {(() => {
                    const byResident =
                      resident.role === "DEPENDANT"
                        ? resident.activity.filter((item) => item.residentId === resident.id)
                        : resident.activity;

                    if (byResident.length === 0) {
                      return (
                        <div className="text-emerald-800 text-[11px]">
                          No activity recorded yet for this resident.
                        </div>
                      );
                    }

                    return byResident
                      .filter((item) => {
                        if (residentActivityFilter === "all") return true;
                        const isOut = item.verb === "checked out";
                        return residentActivityFilter === "out" ? isOut : !isOut;
                      })
                      .map((item) => {
                        const isOut = item.verb === "checked out";
                        const directionColor = isOut
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700";
                        const methodLabel =
                          item.accessMethod === "ACCESS_CARD"
                            ? "Access card"
                            : item.accessMethod === "FINGERPRINT"
                            ? "Fingerprint"
                            : "Access code";
                        return (
                          <div
                            key={item.id}
                            className="rounded-xl border border-emerald-50 bg-emerald-50/60 px-3 py-2 flex flex-col gap-1 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${directionColor}`}
                              >
                                {isOut ? (
                                  <ArrowUpRightIcon className="w-3 h-3" />
                                ) : (
                                  <ArrowDownRightIcon className="w-3 h-3" />
                                )}
                                <span className="text-[10px] font-semibold">
                                  {isOut ? "Check-out" : "Check-in"}
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-700">
                                {formatDistanceToNow(new Date(item.createdAt), {
                                  addSuffix: true,
                                }).replace("about ", "")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex flex-col max-w-[13rem]">
                                <p className="text-[11px] text-emerald-900 font-medium">{item.residentName}</p>
                                <p className="text-[10px] text-emerald-800">
                                  {isOut ? "checked out" : "checked in"} via {methodLabel.toLowerCase()} at {item.accessLabel}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900 text-emerald-50">
                                  {item.accessLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {fingerprintDisableModalOpen && resident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-3">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold text-emerald-950 mb-1">Disable fingerprint access</h3>
            <p className="text-[11px] text-slate-700 mb-3">
              This will disable the use of fingerprint for gate verification for {resident.fullName}.
              Their app access and access codes will remain unchanged.
            </p>
            <div className="mb-3">
              <textarea
                value={fingerprintDisableReason}
                onChange={(e) => setFingerprintDisableReason(e.target.value)}
                rows={3}
                placeholder="Provide a reason (for admin records)."
                className="w-full resize-none rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setFingerprintDisableModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
                onClick={() => {
                  setFingerprintEnabled(false);
                  setFingerprintDisableModalOpen(false);
                }}
              >
                Confirm disable
              </button>
            </div>
          </div>
        </div>
      )}
      {emailModalOpen && resident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-3">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold text-emerald-950 mb-1">Send email</h3>
            <p className="text-[11px] text-slate-700 mb-3">
              Write a quick message to be delivered to {resident.email}.
            </p>
            <div className="space-y-2 mb-3">
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={4}
                placeholder="Type your message..."
                className="w-full resize-none rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setEmailModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
                onClick={async () => {
                  if (!emailSubject.trim() || !emailBody.trim()) return;
                  try {
                    const res = await fetch(`/api/admin/users/${resident.id}/email`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ subject: emailSubject.trim(), text: emailBody.trim() }),
                    });
                    if (res.ok) {
                      setEmailModalOpen(false);
                    }
                  } catch {
                    // ignore
                  }
                }}
              >
                Send email
              </button>
            </div>
          </div>
        </div>
      )}
      {chatModalOpen && resident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-3">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold text-emerald-950 mb-1">Chat user</h3>
            <p className="text-[11px] text-slate-700 mb-3">
              This sends an in-app notification to {resident.fullName}.
            </p>
            <div className="mb-3">
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                rows={4}
                placeholder="Type your message..."
                className="w-full resize-none rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setChatModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
                onClick={async () => {
                  if (!chatMessage.trim()) return;
                  try {
                    const res = await fetch("/api/admin/notifications", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: resident.id, message: chatMessage.trim() }),
                    });
                    if (res.ok) {
                      setChatModalOpen(false);
                    }
                  } catch {
                    // ignore
                  }
                }}
              >
                Send message
              </button>
            </div>
          </div>
        </div>
      )}
      {disableModalOpen && resident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-3">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold text-rose-700 mb-1">Disable user</h3>
            <p className="text-[11px] text-slate-700 mb-3">
              This will disable the app, fingerprint access and access codes for {resident.fullName}.
            </p>
            <div className="mb-3">
              <textarea
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                rows={3}
                placeholder="Provide a reason (only visible to admins)."
                className="w-full resize-none rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setDisableModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-rose-50 shadow-sm hover:bg-rose-700"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/user-access", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: resident.id,
                        action: "disable",
                        reason: disableReason.trim() || undefined,
                      }),
                    });
                    if (res.ok) {
                      setResident((prev) => (prev ? { ...prev, status: "DISABLED" } : prev));
                      setFingerprintEnabled(false);
                      setDisableModalOpen(false);
                    }
                  } catch {
                    // ignore
                  }
                }}
              >
                Confirm disable
              </button>
            </div>
          </div>
        </div>
      )}
      {assignCardModalOpen && resident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-3">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold text-emerald-950 mb-1">Assign access card</h3>
            <p className="text-[11px] text-slate-700 mb-3">
              Profile a new access card for {resident.fullName}. A secure code will be generated for you.
            </p>
            <div className="space-y-2 mb-3">
              <input
                type="text"
                value={assignCardPurpose}
                onChange={(e) => setAssignCardPurpose(e.target.value)}
                placeholder="Purpose (e.g. Main gate card)"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-medium text-slate-600 mb-0.5">Validity (minutes)</label>
                  <input
                    type="number"
                    min={5}
                    value={assignCardValidity}
                    onChange={(e) => setAssignCardValidity(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-0.5">Usage limit</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={assignCardUsageLimit}
                    onChange={(e) => setAssignCardUsageLimit(Number(e.target.value) || 1)}
                    className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-600 mb-0.5">Usage type</label>
                <select
                  value={assignCardUsageType}
                  onChange={(e) => setAssignCardUsageType(e.target.value as "ENTRY_ONLY" | "ENTRY_AND_EXIT")}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ENTRY_ONLY">Entry only</option>
                  <option value="ENTRY_AND_EXIT">Entry & exit</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setAssignCardModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
                onClick={async () => {
                  if (!assignCardPurpose.trim() || !assignCardValidity || !assignCardUsageLimit) return;
                  try {
                    const res = await fetch("/api/admin/generate-code", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        createdById: resident.id,
                        purpose: assignCardPurpose.trim(),
                        guestName: resident.fullName,
                        validityMinutes: assignCardValidity,
                        usageType: assignCardUsageType,
                        usageLimit: assignCardUsageLimit,
                        itemDetails: null,
                        itemImageUrl: null,
                      }),
                    });
                    if (res.ok) {
                      setAssignCardModalOpen(false);
                    }
                  } catch {
                    // ignore
                  }
                }}
              >
                Create card code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
