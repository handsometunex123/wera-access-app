"use client";

import React, { useEffect, useState } from "react";
import { useNotify } from "../../components/useNotify";
import Image from "next/image";
import {
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  mainResidentId?: string | null;
  createdAt: string;
  mainResident?: User; // for dependants, populated by backend
  profilePicture?: string; // Add optional profile picture field
  dependants?: User[]; // Add dependants field to fix type errors
}

interface UserDetailsModalProps {
  dependant?: User;
  mainResident?: User;
  onClose: () => void;
}

import { UserIcon, UsersIcon, XMarkIcon } from "@heroicons/react/24/solid";

function UserDetailsModal({ dependant, mainResident, onClose }: UserDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm md:max-w-2xl relative animate-fadeIn p-3 md:p-6">
        <button
          className="absolute top-3 right-4 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-emerald-50 hover:border-emerald-400 transition flex items-center justify-center z-20"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6 text-gray-500 hover:text-emerald-700" />
        </button>
        <div className="flex flex-col gap-4 p-6">
          {/* Profile Picture */}
          {dependant?.profilePicture && (
            <Image
              src={dependant.profilePicture}
              alt="Profile"
              width={128}
              height={128}
              className="w-32 h-32 rounded-full mx-auto border-2 border-blue-400"
            />
          )}
          {mainResident?.profilePicture && (
            <Image
              src={mainResident.profilePicture}
              alt="Profile"
              width={128}
              height={128}
              className="w-32 h-32 rounded-full mx-auto border-2 border-emerald-400"
            />
          )}

          {/* Dependant Details */}
          {dependant && (
            <div className="rounded-2xl border-2 border-blue-400 bg-blue-50 p-5 flex flex-col items-start shadow-lg scale-105 z-10">
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="w-6 h-6 text-blue-700" />
                <span className="uppercase text-sm font-bold tracking-wider text-blue-900">Dependant</span>
              </div>
              <div className="font-extrabold text-xl text-blue-900 mb-1">{dependant.fullName}</div>
              <div className="text-base text-blue-800 mb-2">{dependant.email}</div>
              <div className="text-xs text-blue-700 mb-1">Phone: {dependant.phone}</div>
              <div className="text-xs text-blue-700 mb-1">Created: {new Date(dependant.createdAt).toLocaleString()}</div>
            </div>
          )}

          {/* Main Resident Details */}
          {mainResident && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 flex flex-col items-start shadow-sm opacity-90 mt-1">
              <div className="flex items-center gap-2 mb-2">
                <UsersIcon className="w-5 h-5 text-emerald-600" />
                <span className="uppercase text-xs font-bold tracking-wider text-emerald-800">Main Resident</span>
              </div>
              <div className="font-bold text-lg text-emerald-900 mb-1">{mainResident.fullName}</div>
              <div className="text-sm text-emerald-800 mb-2">{mainResident.email}</div>
              <div className="text-xs text-emerald-700 mb-1">Phone: {mainResident.phone}</div>
              <div className="text-xs text-emerald-700 mb-1">Created: {new Date(mainResident.createdAt).toLocaleString()}</div>

              {/* Dependants List */}
              {mainResident.dependants && mainResident.dependants.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-emerald-800 mb-2">Dependants:</h3>
                  <ul className="list-disc pl-5">
                    {mainResident.dependants.map((dep: User) => (
                      <li key={dep.id} className="text-xs text-emerald-700">
                        {dep.fullName} ({dep.email})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RejectionReasonModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm md:max-w-md p-3 md:p-6 relative">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Rejection Reason</h2>
        <textarea
          className="w-full border rounded p-2 text-gray-800"
          rows={4}
          placeholder="Enter the reason for rejection..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={() => {
              if (reason.trim()) {
                onSubmit(reason);
              }
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PendingApprovalPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; userId: string | null }>({ isOpen: false, userId: null });

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [page, search, roleFilter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pending-users?page=${page}&search=${encodeURIComponent(search)}&role=${encodeURIComponent(roleFilter)}`);
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Failed to load users", "error");
      } else {
        setUsers(data.users);
        setTotalPages(data.totalPages);
      }
    } catch {
      notify("Network error", "error");
    } finally {
      setLoading(false);
    }
  }

  const notify = useNotify();

  function handleAction(id: string, action: "approve" | "reject") {
    if (action === "reject") {
      setRejectionModal({ isOpen: true, userId: id });
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} this registration?`)) return;
    setLoading(true);
    fetch(`/api/admin/pending-users/${id}/${action}`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.error) notify(data.error, "error");
        else {
          notify(`User ${action}d successfully`, "success");
          fetchUsers();
        }
      })
      .catch(() => notify("Network error", "error"))
      .finally(() => setLoading(false));
  }

  function handleRejectionSubmit(reason: string) {
    if (!rejectionModal.userId) return;

    setLoading(true);
    fetch(`/api/admin/pending-users/${rejectionModal.userId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionReason: reason }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) notify(data.error, "error");
        else {
          notify("User rejected successfully", "success");
          fetchUsers();
        }
      })
      .catch(() => notify("Network error", "error"))
      .finally(() => {
        setLoading(false);
        setRejectionModal({ isOpen: false, userId: null });
      });
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <ClockIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">Pending approvals</h1>
            <p className="text-[11px] text-emerald-700">
              Review and approve new residents, dependants and estate guards.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1">
            <FunnelIcon className="h-3.5 w-3.5 text-emerald-600" />
            Filters applied
          </span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>
            {users.length} pending user{users.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs transition-all duration-300 ease-out sm:w-64 sm:focus-within:w-80 max-w-full">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500" />
            <input
              className="w-full rounded-full border border-emerald-100 bg-white px-7 py-1.5 pr-8 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Search by name, email, phone..."
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
                <XMarkIcon className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <select
              className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All roles</option>
              <option value="MAIN_RESIDENT">Main residents</option>
              <option value="ESTATE_GUARD">Estate guards</option>
              <option value="DEPENDANT">Dependants</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>
        {loading && (
          <div className="mt-3 space-y-2 text-[11px] text-emerald-700">
            <div className="h-2.5 w-40 rounded-full bg-emerald-50" />
            <div className="h-2.5 w-32 rounded-full bg-emerald-50" />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Pending users</h2>
            <p className="text-[11px] text-emerald-700">Approve or reject new registrations.</p>
          </div>
          <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-900 border border-emerald-100 sm:inline-flex">
            {users.length} awaiting decision
          </span>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-emerald-950 truncate">{user.fullName}</div>
                <div className="mt-0.5 text-[11px] text-emerald-700 truncate">
                  {user.email} 
                  <span className="text-emerald-400"> • </span>
                  {user.phone}
                </div>
                <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                    {user.role}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                    {new Date(user.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-[11px]">
                <button
                  className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                  onClick={() => handleAction(user.id, "approve")}
                >
                  Approve
                </button>
                <button
                  className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
                  onClick={() => handleAction(user.id, "reject")}
                >
                  Reject
                </button>
                <button
                  className="text-[11px] font-medium text-sky-700 hover:underline"
                  onClick={() => setModalUser(user)}
                >
                  View details
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && !loading && (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
              No pending approvals match your current filters.
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/80">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="min-w-full text-xs text-emerald-950">
                <thead className="bg-emerald-50/80 text-[11px] uppercase tracking-wide text-emerald-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Email</th>
                    <th className="px-4 py-2 text-left font-semibold">Phone</th>
                    <th className="px-4 py-2 text-left font-semibold">Role</th>
                    <th className="px-4 py-2 text-left font-semibold">Main resident</th>
                    <th className="px-4 py-2 text-left font-semibold">Created</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {users.map((user) => {
                    const isDependant = user.role === "DEPENDANT";
                    const mainResident = isDependant && user.mainResident ? user.mainResident : undefined;

                    return (
                      <tr key={user.id} className="transition hover:bg-emerald-50/60">
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex flex-col">
                            <span className="truncate text-[13px] font-semibold text-emerald-950">{user.fullName}</span>
                            <span className="truncate text-[11px] text-emerald-700">{user.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="truncate text-[11px] text-emerald-800">{user.email}</span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="truncate text-[11px] text-emerald-800">{user.phone}</span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          {isDependant && mainResident ? (
                            <button
                              type="button"
                              className="text-[11px] font-medium text-sky-700 hover:underline"
                              onClick={() => setModalUser(mainResident)}
                            >
                              {mainResident.fullName}
                            </button>
                          ) : isDependant ? (
                            <span className="text-[11px] text-slate-500">N/A</span>
                          ) : (
                            <span className="text-[11px] text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="truncate text-[11px] text-emerald-800">{new Date(user.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2 text-[11px]">
                            <button
                              type="button"
                              className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                              onClick={() => handleAction(user.id, "approve")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
                              onClick={() => handleAction(user.id, "reject")}
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              className="text-[11px] font-medium text-sky-700 hover:underline"
                              onClick={() => setModalUser(user)}
                            >
                              View details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-[11px] text-emerald-800 bg-emerald-50/40"
                      >
                        No pending approvals match your current filters.
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
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40"
            >
              Next
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {modalUser && (
          <UserDetailsModal
            dependant={modalUser.role === "DEPENDANT" ? modalUser : undefined}
            mainResident={
              modalUser.role === "DEPENDANT" && modalUser.mainResident
                ? modalUser.mainResident
                : modalUser.role !== "DEPENDANT"
                ? modalUser
                : undefined
            }
            onClose={() => setModalUser(null)}
          />
        )}
        <RejectionReasonModal
          isOpen={rejectionModal.isOpen}
          onClose={() => setRejectionModal({ isOpen: false, userId: null })}
          onSubmit={handleRejectionSubmit}
        />
      </section>
    </div>
  );
}
