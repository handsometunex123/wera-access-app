"use client";
// Added for Next.js App Router Client Component support
import React, { useEffect, useState, useRef } from "react";
import { useNotify } from "../../components/useNotify";
import dynamic from "next/dynamic";
const PasscodeModal = dynamic(() => import("../../components/PasscodeModal"), { ssr: false });
import { useSession } from "next-auth/react";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  mainResidentId?: string;
  awaitingSetup?: boolean; // Only for dependants
};


export default function AdminUsersPage() {
  const { data: session } = useSession();
  // Extend the session user type to include id and role
  type SessionUser = { id?: string; role?: string; email?: string | null; name?: string | null; image?: string | null };
  const loggedInUserId = (session?.user as SessionUser)?.id;
  const [users, setUsers] = useState<User[]>([]);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ userId: string; action: string } | null>(null);
  const [passcodeLoading, setPasscodeLoading] = useState(false);
  const [passcodeError, setPasscodeError] = useState(""); // Only for modal field
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  // Remove local error/actionMsg state, use toast instead
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("APPROVED");
  const [roleFilter, setRoleFilter] = useState("MAIN_RESIDENT");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const notify = useNotify();

  const fetchUsers = React.useCallback(async (pageOverride: number, pageSizeOverride: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageOverride),
        pageSize: String(pageSizeOverride),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (Array.isArray(data.users)) {
        setUsers(data.users);
        setTotal(data.total);
      } else {
        setUsers([]);
        setTotal(0);
        notify(data.error || "Failed to load users", "error");
      }
    } catch {
      notify("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  // Debounced effect for search, statusFilter, and roleFilter, page, pageSize
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      fetchUsers(page, pageSize);
    }, 1000);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [search, statusFilter, roleFilter, page, pageSize]);

  const handleAction = (userId: string, action: string) => {
    setPendingAction({ userId, action });
    setShowPasscodeModal(true);
    setPasscodeError("");
  };

  const handlePasscodeSubmit = async (passcode: string) => {
    if (!pendingAction) return;
    setPasscodeLoading(true);
    setPasscodeError("");
    try {
      const res = await fetch("/api/admin/user-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingAction.userId, action: pendingAction.action, passcode }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.message || "Action successful", "success");
        setShowPasscodeModal(false);
        setPendingAction(null);
        fetchUsers(page, pageSize);
      } else {
        setPasscodeError(data.error || "Incorrect passcode");
        notify(data.error || "Incorrect passcode", "error");
      }
    } catch {
      setPasscodeError("Action failed");
      notify("Action failed", "error");
    } finally {
      setPasscodeLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      !search ||
      (user.email && user.email.toLowerCase().includes(search.toLowerCase())) ||
      (user.fullName && user.fullName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || user.status === statusFilter;
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setPage(1);
  };

  return (
    <div className="min-h-screen flex justify-center bg-emerald-50">
      <div className="w-full p-8 rounded-2xl shadow-lg bg-white">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Approved Users</h1>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            className="border rounded px-2 py-1 flex-1 text-emerald-900 placeholder-emerald-700"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="border rounded px-2 py-1 text-emerald-900"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="DISABLED">Disabled</option>
            <option value="REVOKED">Revoked</option>
          </select>
          <select
            className="border rounded px-2 py-1 text-emerald-900"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="MAIN_RESIDENT">Main Resident</option>
            <option value="DEPENDANT">Dependant</option>
            <option value="ESTATE_GUARD">Estate Guard</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {loading ? <div>Loading...</div> : null}
        {/* All errors and actions now use toast notifications */}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-emerald-900">
            <thead>
              <tr className="bg-emerald-100 text-emerald-900">
                <th className="px-6 py-3 text-left font-semibold text-emerald-900">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-emerald-900">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-emerald-900">Role</th>
                <th className="px-6 py-3 text-left font-semibold text-emerald-900">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-emerald-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b">
                  <td className="px-6 py-3 text-emerald-900 font-semibold text-left">{user.fullName}</td>
                  <td className="px-6 py-3 text-emerald-900 font-semibold text-left">{user.email}</td>
                  <td className="px-6 py-3 text-emerald-900 font-semibold text-left">{user.role}</td>
                  <td className="px-6 py-3 text-emerald-900 font-semibold text-left">
                    {user.status}
                    {user.role === "DEPENDANT" && user.awaitingSetup && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Awaiting Setup</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-left">
                    <button
                      className="text-yellow-700 underline mr-2 font-semibold disabled:opacity-50"
                      onClick={() => handleAction(user.id, 'disable')}
                      disabled={user.id === loggedInUserId}
                    >Disable</button>
                    <button
                      className="text-red-700 underline font-semibold disabled:opacity-50"
                      onClick={() => handleAction(user.id, 'revoke')}
                      disabled={user.id === loggedInUserId}
                    >Revoke</button>
                    {user.role === "DEPENDANT" && user.awaitingSetup && (
                      <button
                        className="ml-2 text-blue-700 underline font-semibold"
                        onClick={async () => {
                          const res = await fetch(`/api/admin/dependants/${user.id}/resend-password-setup`, { method: "POST" });
                          const data = await res.json();
                          if (data.success) notify("Password setup email resent.", "success");
                          else notify(data.error || "Failed to resend email.", "error");
                        }}
                      >Resend Setup Email</button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && !loading && (
                <tr><td colSpan={5} className="text-center p-4 text-emerald-900">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div>
            <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)} className="px-3 py-1 rounded bg-emerald-200 text-emerald-900 font-bold disabled:opacity-50 mr-2">Prev</button>
            <span className="text-emerald-900 font-semibold">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} className="px-3 py-1 rounded bg-emerald-200 text-emerald-900 font-bold disabled:opacity-50 ml-2">Next</button>
          </div>
          <div>
            <label className="mr-1 text-emerald-900 font-semibold">Page size:</label>
            <select value={pageSize} onChange={handlePageSizeChange} className="border rounded px-2 py-1 text-emerald-900">
              {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
        </div>
      </div>
    {/* Passcode Modal for sensitive actions */}
    {showPasscodeModal && (
      <PasscodeModal
        onSubmit={handlePasscodeSubmit}
        onClose={() => { setShowPasscodeModal(false); setPendingAction(null); }}
        loading={passcodeLoading}
        error={passcodeError}
      />
    )}
  </div>
  );
}
