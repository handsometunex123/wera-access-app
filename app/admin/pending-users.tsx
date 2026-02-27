"use client";

import React, { useEffect, useState } from "react";
import { useNotify } from "../../components/useNotify";
import Image from 'next/image';

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
    <div className="min-h-screen bg-gray-50 p-2 sm:p-8">
      <div className="bg-white rounded-2xl shadow-lg p-2 sm:p-6">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Pending Approval</h1>
        <div className="flex gap-2 mb-4">
          <input
            className="border rounded px-3 py-2 w-full text-emerald-900 placeholder-emerald-700"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="border rounded px-3 py-2 text-emerald-900"
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            <option value="MAIN_RESIDENT">Main Resident</option>
            <option value="ESTATE_GUARD">Estate Guard</option>
            <option value="DEPENDANT">Dependant</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {loading && <div>Loading...</div>}
        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {users.map(user => (
            <div key={user.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-emerald-900">{user.fullName}</div>
                  <div className="text-xs text-gray-500">{user.email} • {user.phone}</div>
                  <div className="text-xs text-gray-500 mt-1">{user.role}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button className="text-emerald-900 underline" onClick={() => handleAction(user.id, "approve")}>Approve</button>
                  <button className="text-red-700 underline" onClick={() => handleAction(user.id, "reject")}>Reject</button>
                  <button className="text-blue-700 underline" onClick={() => setModalUser(user)}>View</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border text-xs sm:text-sm text-emerald-900">
            <thead>
              <tr className="bg-emerald-100 text-emerald-900">
                <th className="p-2 whitespace-nowrap text-left">Name</th>
                <th className="p-2 whitespace-nowrap text-left">Email</th>
                <th className="p-2 whitespace-nowrap text-left">Phone</th>
                <th className="p-2 whitespace-nowrap text-left">Role</th>
                <th className="p-2 whitespace-nowrap text-left">Main Resident</th>
                <th className="p-2 whitespace-nowrap text-left">Created</th>
                <th className="p-2 w-40 min-w-[10rem] sm:w-48 sm:min-w-[12rem] whitespace-nowrap text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const isDependant = user.role === "DEPENDANT";
                const mainResident = isDependant && user.mainResident ? user.mainResident : undefined;
                return (
                  <tr key={user.id} className={isDependant ? "border-b bg-emerald-50" : "border-b"}>
                    <td className="p-2 text-emerald-900 font-semibold whitespace-nowrap max-w-[8rem] truncate align-middle">{user.fullName}</td>
                    <td className="p-2 text-emerald-900 whitespace-nowrap max-w-[10rem] truncate align-middle">{user.email}</td>
                    <td className="p-2 text-emerald-900 whitespace-nowrap max-w-[7rem] truncate align-middle">{user.phone}</td>
                    <td className="p-2 text-emerald-900 whitespace-nowrap align-middle">{user.role}</td>
                    <td className="p-2 text-emerald-900 whitespace-nowrap max-w-[8rem] truncate align-middle">
                      {isDependant && mainResident ? (
                        <button className="text-blue-700 underline" onClick={() => setModalUser(mainResident)}>
                          {mainResident.fullName}
                        </button>
                      ) : isDependant ? (
                        <span className="text-xs text-gray-500">N/A</span>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    <td className="p-2 text-emerald-900 whitespace-nowrap max-w-[8rem] truncate align-middle">{new Date(user.createdAt).toLocaleString()}</td>
                    <td className="p-2 flex flex-col sm:flex-row gap-1 w-40 min-w-[10rem] sm:w-48 sm:min-w-[12rem] align-middle">
                      <button className="text-emerald-900 underline mr-0 sm:mr-2" onClick={() => handleAction(user.id, "approve")}>Approve</button>
                      <button className="text-red-700 underline" onClick={() => handleAction(user.id, "reject")}>Reject</button>
                      <button className="text-blue-700 underline mt-1 sm:mt-0" onClick={() => setModalUser(user)}>
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && !loading && (
                <tr><td colSpan={7} className="text-center p-4 text-emerald-900">No pending approvals.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-3 py-1 rounded bg-emerald-200 text-emerald-900 font-bold disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >Prev</button>
          <span className="text-emerald-900">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-emerald-200 text-emerald-900 font-bold disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >Next</button>
        </div>
        {modalUser && (
          <UserDetailsModal
            dependant={modalUser.role === "DEPENDANT" ? modalUser : undefined}
            mainResident={modalUser.role === "DEPENDANT" && modalUser.mainResident ? modalUser.mainResident : modalUser.role !== "DEPENDANT" ? modalUser : undefined}
            onClose={() => setModalUser(null)}
          />
        )}
        <RejectionReasonModal
          isOpen={rejectionModal.isOpen}
          onClose={() => setRejectionModal({ isOpen: false, userId: null })}
          onSubmit={handleRejectionSubmit}
        />
      </div>
    </div>
  );
}
