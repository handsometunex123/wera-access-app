"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  UsersIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNotify } from "../../components/useNotify";

const PasscodeModal = dynamic(() => import("../../components/PasscodeModal"), { ssr: false });

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  profileImage?: string | null;
  rejectionReason?: string | null;
  mainResidentId?: string;
  awaitingSetup?: boolean; // Only for dependants
  canGenerateAdminCode?: boolean | null;
};

type PaymentSummary = {
  id: string;
  amount: number;
  status: string;
  details?: string | null;
  createdAt: string;
  updatedAt: string;
};


export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [paymentUser, setPaymentUser] = useState<User | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentSummary[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [enablingAdminCode, setEnablingAdminCode] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const notify = useNotify();

  const fetchUsers = React.useCallback(
    async (pageOverride: number, pageSizeOverride: number) => {
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
    },
    [notify],
  );

  // Debounced effect for pagination; fetchUsers is stable via useCallback
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      fetchUsers(page, pageSize);
    }, 1000);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [page, pageSize]);

  useEffect(() => {
    const rawStatus = (searchParams?.get("status") || "").toUpperCase();
    const allowedStatuses = new Set(["PENDING", "APPROVED", "DISABLED", "REVOKED", "BLOCKED"]);
    const rawRole = (searchParams?.get("role") || "").toUpperCase();
    const allowedRoles = new Set(["MAIN_RESIDENT", "DEPENDANT", "ESTATE_GUARD", "ADMIN"]);

    if (rawStatus && allowedStatuses.has(rawStatus)) {
      setStatusFilter(rawStatus);
      setPage(1);
    } else if (!rawStatus) {
      setStatusFilter("");
    }

    if (rawRole && allowedRoles.has(rawRole)) {
      setRoleFilter(rawRole);
      setPage(1);
    } else if (!rawRole) {
      setRoleFilter("");
    }
  }, [searchParams]);

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

  const handleApprovePending = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pending-users/${userId}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) notify(data.error || "Failed to approve user", "error");
      else {
        notify("User approved successfully", "success");
        setApprovingUserId(null);
        fetchUsers(page, pageSize);
      }
    } catch {
      notify("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = async (user: User) => {
    setPaymentUser(user);
    setPaymentHistory([]);
    setPaymentError(null);
    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/payment-history`);
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Failed to load payment history", "error");
        setPaymentError(data.error || "Failed to load payment history");
        return;
      }
      setPaymentHistory(Array.isArray(data.requests) ? data.requests : []);
    } catch {
      const msg = "Failed to load payment history";
      setPaymentError(msg);
      notify(msg, "error");
    } finally {
      setPaymentLoading(false);
    }
  };

  const closePaymentModal = () => {
    setPaymentUser(null);
    setPaymentHistory([]);
    setPaymentError(null);
    setEnablingAdminCode(false);
  };

  const handleEnableAdminCode = async () => {
    if (!paymentUser) return;
    setEnablingAdminCode(true);
    try {
      const res = await fetch(`/api/admin/main-residents/${paymentUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canGenerateAdminCode: true, adminCodeDisabledReason: null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(data.error || "Failed to enable admin code rights", "error");
        return;
      }
      notify(`Admin code rights enabled for ${data.fullName || paymentUser.fullName}`, "success");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === paymentUser.id ? { ...u, canGenerateAdminCode: true } : u,
        ),
      );
      closePaymentModal();
    } catch {
      notify("Failed to enable admin code rights", "error");
    } finally {
      setEnablingAdminCode(false);
    }
  };

  const handleDisableAdminCode = async (user: User) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Are you sure you want to revoke admin code rights for ${user.fullName || "this resident"}?`,
      );
      if (!confirmed) return;
    }

    try {
      const res = await fetch(`/api/admin/main-residents/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canGenerateAdminCode: false, adminCodeDisabledReason: null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(data.error || "Failed to revoke admin code rights", "error");
        return;
      }
      notify(
        `Admin code rights revoked for ${data.fullName || user.fullName || "resident"}`,
        "success",
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, canGenerateAdminCode: false } : u,
        ),
      );
    } catch {
      notify("Failed to revoke admin code rights", "error");
    }
  };

  const handleRejectPending = async () => {
    if (!rejectingUserId) return;
    if (!rejectionReason.trim()) {
      notify("Rejection reason is required", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/profile-update-requests/${rejectingUserId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) notify(data.error || "Failed to reject user", "error");
      else {
        notify("User rejected successfully", "success");
        setRejectingUserId(null);
        setRejectionReason("");
        setShowRejectModal(false);
        fetchUsers(page, pageSize);
      }
    } catch {
      notify("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const [showRejectModal, setShowRejectModal] = useState(false);

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
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <UsersIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">Users directory</h1>
            <p className="text-[11px] text-emerald-700">
              Manage pending, approved, disabled and rejected users in one flow.
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
            {filteredUsers.length} of {total} users
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs transition-all duration-300 ease-out sm:w-64 sm:focus-within:w-80 max-w-full">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500" />
            <input
              className="w-full rounded-full border border-emerald-100 bg-white px-7 py-1.5 pr-8 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DISABLED">Disabled</option>
              <option value="REVOKED">Rejected</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            <select
              className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All roles</option>
              <option value="MAIN_RESIDENT">Main residents</option>
              <option value="DEPENDANT">Dependants</option>
              <option value="ESTATE_GUARD">Estate guards</option>
              <option value="ADMIN">Admins</option>
            </select>
            <div className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 border border-emerald-100">
              <span className="text-[10px] uppercase tracking-wide text-emerald-700">Page size</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="bg-transparent text-[11px] focus:outline-none"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size} className="text-emerald-900">
                    {size}
                  </option>
                ))}
              </select>
            </div>
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
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Users</h2>
            <p className="text-[11px] text-emerald-700">
              Unified list of pending, approved, disabled and rejected users.
            </p>
          </div>
          <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-900 border border-emerald-100 sm:inline-flex">
            Showing {filteredUsers.length} of {total}
          </span>
        </div>

        {/* Mobile: cards */}
        <div className="space-y-3 md:hidden">
          {loading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm animate-pulse"
                >
                  <div className="h-9 w-9 rounded-full bg-emerald-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded-full bg-emerald-50" />
                    <div className="h-2.5 w-40 rounded-full bg-emerald-50" />
                    <div className="flex gap-2 pt-1">
                      <div className="h-4 w-16 rounded-full bg-emerald-50" />
                      <div className="h-4 w-20 rounded-full bg-emerald-50" />
                    </div>
                  </div>
                </div>
              ))
            : filteredUsers.map((user) => {
            const initials =
              (user.fullName
                ?.split(" ")
                .filter(Boolean)
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "U");

            const profileImageSrc = (user.profileImage || "").trim();
            const hasValidProfileImage =
              !!profileImageSrc &&
              (profileImageSrc.startsWith("http://") ||
                profileImageSrc.startsWith("https://") ||
                profileImageSrc.startsWith("/"));

            const isSelf = user.id === loggedInUserId;
            const isDependantAwaiting = user.role === "DEPENDANT" && user.awaitingSetup;
            const isRejected = user.status === "REVOKED" || user.status === "BLOCKED";

            return (
              <div
                key={user.id}
                className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-900">
                  {hasValidProfileImage ? (
                    <Image
                      src={profileImageSrc}
                      alt={user.fullName || "User profile"}
                      width={36}
                      height={36}
                      className="h-9 w-9 object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/users?residentId=${user.id}`)}
                        className="truncate text-[13px] font-semibold text-emerald-950 hover:underline hover:underline-offset-2"
                      >
                        {user.fullName}
                      </button>
                      <p className="truncate text-[11px] text-emerald-700">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-[10px]">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2 py-0.5 font-medium ring-1 ring-inset " +
                          (user.role === "ESTATE_GUARD"
                            ? "bg-sky-50 text-sky-800 ring-sky-200"
                            : user.role === "DEPENDANT"
                            ? "bg-amber-50 text-amber-800 ring-amber-200"
                            : user.role === "ADMIN"
                            ? "bg-slate-100 text-slate-800 ring-slate-300"
                            : "bg-emerald-50 text-emerald-800 ring-emerald-200")
                        }
                      >
                        {user.role === "ESTATE_GUARD"
                          ? "Estate guard"
                          : user.role === "DEPENDANT"
                          ? "Dependant"
                          : user.role === "ADMIN"
                          ? "Admin"
                          : "Main resident"}
                      </span>
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2 py-0.5 font-medium " +
                          (user.status === "APPROVED"
                            ? "bg-emerald-600 text-emerald-50"
                            : user.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : user.status === "DISABLED"
                            ? "bg-rose-100 text-rose-800"
                            : user.status === "REVOKED"
                            ? "bg-rose-100 text-rose-800"
                            : user.status === "BLOCKED"
                            ? "bg-slate-200 text-slate-800"
                            : "bg-slate-100 text-slate-800")
                        }
                      >
                        {user.status === "REVOKED" ? "REJECTED" : user.status}
                      </span>
                    </div>
                  </div>
                  {isRejected && user.rejectionReason && (
                    <p className="text-[10px] text-rose-700">Reason: {user.rejectionReason}</p>
                  )}
                  {isDependantAwaiting && (
                    <p className="text-[11px] text-amber-700">
                      Awaiting password setup – you can resend from desktop view.
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    {user.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                          onClick={() => setApprovingUserId(user.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
                          onClick={() => {
                            setRejectingUserId(user.id);
                            setRejectionReason("");
                          }}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <>
                        {(user.status === "APPROVED" && (user.role === "MAIN_RESIDENT" || user.role === "DEPENDANT" || user.role === "ESTATE_GUARD")) && (
                          <button
                            type="button"
                            className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-40"
                            onClick={() => handleAction(user.id, "disable")}
                            disabled={isSelf || isRejected}
                          >
                            Disable
                          </button>
                        )}
                        {user.role === "MAIN_RESIDENT" && user.status === "APPROVED" && (
                          user.canGenerateAdminCode ? (
                            <>
                              <button
                                type="button"
                                className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                                onClick={() => handleDisableAdminCode(user)}
                              >
                                Revoke admin codes
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                              onClick={() => openPaymentModal(user)}
                            >
                              Allow admin codes
                            </button>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredUsers.length === 0 && !loading && (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
              No users match your current filters.
            </div>
          )}
        </div>

        {/* Desktop: modern table */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/80">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="min-w-full text-xs text-emerald-950">
                <thead className="bg-emerald-50/80 text-[11px] uppercase tracking-wide text-emerald-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Email</th>
                    <th className="px-4 py-2 text-left font-semibold">Role</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {loading
                    ? Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="px-4 py-2.5 align-middle">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-emerald-100" />
                              <div className="space-y-1">
                                <div className="h-3 w-32 rounded-full bg-emerald-50" />
                                <div className="h-2.5 w-40 rounded-full bg-emerald-50" />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 align-middle">
                            <div className="h-3 w-24 rounded-full bg-emerald-50" />
                          </td>
                          <td className="px-4 py-2.5 align-middle">
                            <div className="h-4 w-24 rounded-full bg-emerald-50" />
                          </td>
                          <td className="px-4 py-2.5 align-middle">
                            <div className="space-y-1">
                              <div className="h-4 w-20 rounded-full bg-emerald-50" />
                              <div className="h-3 w-40 rounded-full bg-emerald-50" />
                            </div>
                          </td>
                          <td className="px-4 py-2.5 align-middle text-right">
                            <div className="flex justify-end gap-2">
                              <div className="h-6 w-16 rounded-full bg-emerald-50" />
                              <div className="h-6 w-16 rounded-full bg-emerald-50" />
                            </div>
                          </td>
                        </tr>
                      ))
                    : filteredUsers.map((user) => {
                    const isSelf = user.id === loggedInUserId;
                    const isDependantAwaiting = user.role === "DEPENDANT" && user.awaitingSetup;
                    const isRejected = user.status === "REVOKED" || user.status === "BLOCKED";

                    const initials =
                      (user.fullName
                        ?.split(" ")
                        .filter(Boolean)
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "U");

                    const profileImageSrc = (user.profileImage || "").trim();
                    const hasValidProfileImage =
                      !!profileImageSrc &&
                      (profileImageSrc.startsWith("http://") ||
                        profileImageSrc.startsWith("https://") ||
                        profileImageSrc.startsWith("/"));

                    return (
                      <tr key={user.id} className="transition hover:bg-emerald-50/60">
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-900">
                              {hasValidProfileImage ? (
                                <Image
                                  src={profileImageSrc}
                                  alt={user.fullName || "User profile"}
                                  width={28}
                                  height={28}
                                  className="h-7 w-7 object-cover"
                                />
                              ) : (
                                initials
                              )}
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => router.push(`/admin/users?residentId=${user.id}`)}
                                className="truncate text-[13px] font-semibold text-emerald-950 hover:underline hover:underline-offset-2 text-left"
                              >
                                {user.fullName}
                              </button>
                              <p className="truncate text-[11px] text-emerald-700">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="truncate text-[11px] text-emerald-800">{user.email}</span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span
                            className={
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset " +
                              (user.role === "ESTATE_GUARD"
                                ? "bg-sky-50 text-sky-800 ring-sky-200"
                                : user.role === "DEPENDANT"
                                ? "bg-amber-50 text-amber-800 ring-amber-200"
                                : user.role === "ADMIN"
                                ? "bg-slate-100 text-slate-800 ring-slate-300"
                                : "bg-emerald-50 text-emerald-800 ring-emerald-200")
                            }
                          >
                            {user.role === "ESTATE_GUARD"
                              ? "Estate guard"
                              : user.role === "DEPENDANT"
                              ? "Dependant"
                              : user.role === "ADMIN"
                              ? "Admin"
                              : "Main resident"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex flex-col items-start gap-1 text-[10px]">
                            <span
                              className={
                                "inline-flex items-center rounded-full px-2 py-0.5 font-medium " +
                                (user.status === "APPROVED"
                                  ? "bg-emerald-600 text-emerald-50"
                                  : user.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : user.status === "DISABLED"
                                  ? "bg-rose-100 text-rose-800"
                                  : user.status === "REVOKED"
                                  ? "bg-rose-100 text-rose-800"
                                  : user.status === "BLOCKED"
                                  ? "bg-slate-200 text-slate-800"
                                  : "bg-slate-100 text-slate-800")
                              }
                            >
                              {user.status === "REVOKED" ? "REJECTED" : user.status}
                            </span>
                            {isRejected && user.rejectionReason && (
                              <span className="max-w-[220px] truncate rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-rose-200" title={user.rejectionReason}>
                                Reason: {user.rejectionReason}
                              </span>
                            )}
                            {isDependantAwaiting && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200">
                                Awaiting setup
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2 text-[11px]">
                            {user.status === "PENDING" ? (
                              <>
                                <button
                                  type="button"
                                  className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                                  onClick={() => setApprovingUserId(user.id)}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
                                  onClick={() => {
                                    setRejectingUserId(user.id);
                                    setRejectionReason("");
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <>
                                {(user.status === "APPROVED" && (user.role === "MAIN_RESIDENT" || user.role === "DEPENDANT" || user.role === "ESTATE_GUARD")) && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-40"
                                    onClick={() => handleAction(user.id, "disable")}
                                    disabled={isSelf || isRejected}
                                  >
                                    Disable
                                  </button>
                                )}
                              </>
                            )}
                            {user.role === "MAIN_RESIDENT" && user.status === "APPROVED" && (
                              user.canGenerateAdminCode ? (
                                <>
                                  <button
                                    type="button"
                                    className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                                    onClick={() => handleDisableAdminCode(user)}
                                  >
                                    Revoke admin codes
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                                  onClick={() => openPaymentModal(user)}
                                >
                                  Allow admin codes
                                </button>
                              )
                            )}
                            {isDependantAwaiting && (
                              <button
                                type="button"
                                className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-800 shadow-sm hover:bg-sky-100"
                                onClick={async () => {
                                  const res = await fetch(
                                    `/api/admin/dependants/${user.id}/resend-password-setup`,
                                    { method: "POST" },
                                  );
                                  const data = await res.json();
                                  if (data.success) notify("Password setup email resent.", "success");
                                  else notify(data.error || "Failed to resend email.", "error");
                                }}
                              >
                                Resend setup email
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-[11px] text-emerald-800 bg-emerald-50/40"
                      >
                        No users match your current filters.
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
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
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
              onClick={() => handlePageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40"
            >
              Next
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-900 border border-emerald-100 sm:hidden">
            <span className="text-[10px] uppercase tracking-wide text-emerald-700">Page size</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="bg-transparent text-[11px] focus:outline-none"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size} className="text-emerald-900">
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Passcode Modal for sensitive actions */}
      {showPasscodeModal && (
        <PasscodeModal
          onSubmit={handlePasscodeSubmit}
          onClose={() => {
            setShowPasscodeModal(false);
            setPendingAction(null);
          }}
          loading={passcodeLoading}
          error={passcodeError}
        />
      )}

      {rejectingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <button
              type="button"
              className="absolute right-3 top-3 text-lg text-emerald-900"
              onClick={() => {
                setRejectingUserId(null);
                setRejectionReason("");
              }}
              aria-label="Close dialog"
            >
              &times;
            </button>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Reject pending user</h2>
              <p className="text-[11px] text-emerald-700">Provide a clear reason that will be saved and communicated.</p>
            </div>
            <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 p-3 sm:p-4">
              <textarea
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                  onClick={() => {
                    setRejectingUserId(null);
                    setRejectionReason("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-rose-700"
                  onClick={handleRejectPending}
                  disabled={!rejectionReason.trim()}
                >
                  Submit rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {approvingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <button
              type="button"
              className="absolute right-3 top-3 text-lg text-emerald-900"
              onClick={() => setApprovingUserId(null)}
              aria-label="Close dialog"
            >
              &times;
            </button>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Approve pending user</h2>
              <p className="text-[11px] text-emerald-700">Confirm approval to activate this user account.</p>
            </div>
            <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 p-3 sm:p-4">
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                  onClick={() => setApprovingUserId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
                  onClick={() => handleApprovePending(approvingUserId)}
                >
                  Confirm approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <button
              type="button"
              className="absolute right-3 top-3 text-lg text-emerald-900"
              onClick={closePaymentModal}
              aria-label="Close payment history dialog"
            >
              &times;
            </button>
            <div className="mb-3 flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">
                Admin code eligibility
              </h2>
              <p className="text-[11px] text-emerald-700">
                Review {paymentUser.fullName}&apos;s payment history before allowing them to generate admin codes.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 p-3 sm:p-4 max-h-80 overflow-y-auto">
              {paymentLoading && (
                <div className="space-y-2 text-[11px] text-emerald-800">
                  <div className="h-2.5 w-40 rounded-full bg-emerald-100/70" />
                  <div className="h-2.5 w-32 rounded-full bg-emerald-100/70" />
                  <div className="h-2.5 w-52 rounded-full bg-emerald-100/70" />
                </div>
              )}
              {!paymentLoading && paymentError && (
                <div className="text-[11px] font-medium text-rose-700">{paymentError}</div>
              )}
              {!paymentLoading && !paymentError && paymentHistory.length === 0 && (
                <div className="text-[11px] text-emerald-800">
                  No payment requests found for this resident. They have no recorded debts.
                </div>
              )}
              {!paymentLoading && !paymentError && paymentHistory.length > 0 && (
                <ul className="space-y-2 text-[11px] text-emerald-900">
                  {paymentHistory.map((req) => {
                    const created = new Date(req.createdAt);
                    const amountNaira = `₦${Number(req.amount || 0).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`;
                    const isPending = req.status === "PENDING";
                    const isPaid = req.status === "PAID";
                    const isRejected = req.status === "REJECTED";
                    return (
                      <li
                        key={req.id}
                        className="flex flex-col gap-1 rounded-lg border border-emerald-100 bg-white px-2.5 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-emerald-950">{amountNaira}</span>
                          <span
                            className={
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                              (isPaid
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : isPending
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : isRejected
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-slate-50 text-slate-700 border border-slate-200")
                            }
                          >
                            {isPaid ? "Paid" : isPending ? "Pending" : isRejected ? "Rejected" : req.status}
                          </span>
                        </div>
                        {req.details && (
                          <p className="text-[10px] text-emerald-800 line-clamp-2" title={req.details || undefined}>
                            {req.details}
                          </p>
                        )}
                        <p className="text-[10px] text-emerald-700/80">
                          {created.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at {created.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {(() => {
              const hasPending = paymentHistory.some((r) => r.status === "PENDING");
              const totalPending = paymentHistory
                .filter((r) => r.status === "PENDING")
                .reduce((sum, r) => sum + Number(r.amount || 0), 0);
              const pendingLabel = `₦${totalPending.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
              const canEnable = !paymentLoading && !hasPending;
              return (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="text-[10px] text-emerald-800">
                    {hasPending ? (
                      <span>
                        This resident still has outstanding requests totalling <span className="font-semibold">{pendingLabel}</span>. They must settle all pending payments before admin code access can be granted.
                      </span>
                    ) : (
                      <span>
                        All recorded payment requests are settled. You can safely allow this resident to generate admin codes.
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                      onClick={closePaymentModal}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-40"
                      onClick={handleEnableAdminCode}
                      disabled={!canEnable || enablingAdminCode}
                    >
                      {enablingAdminCode ? "Enabling..." : "Allow admin codes"}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
