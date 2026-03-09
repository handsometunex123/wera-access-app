"use client";
import React, { useState, useEffect, useRef } from "react";
import { UserPlusIcon, ArrowUpTrayIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useNotify } from "../../../components/useNotify";
import AdminInvitePage from "../invite/page";
import * as XLSX from "xlsx";

type Invite = {
  id: string;
  status: string;
  expiresAt: string;
  email: string;
  role: string;
};

export default function AdminInvitesPage() {
  const notify = useNotify();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [page] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [bulkError, setBulkError] = useState("");

  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  const fetchInvites = React.useCallback(
    async (pageOverride: number, pageSizeOverride: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageOverride),
          pageSize: String(pageSizeOverride),
        });
        const res = await fetch(`/api/admin/invites?${params}`);
        const data = await res.json();
        setInvites(data.invites);
      } catch {
        notify("Failed to load invites", "error");
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    fetchInvites(page, pageSize);
  }, [page, pageSize, fetchInvites]);
  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch("/api/admin/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.message || "Action successful", "success");
        fetchInvites(page, pageSize); // Pass arguments explicitly
      } else {
        notify(data.error || "Action failed", "error");
      }
    } catch {
      notify("Action failed", "error");
    }
  };

  const [editInvites, setEditInvites] = useState<{ email: string; role: string; error?: string }[]>(
    []
  );
  const [hasInvalid, setHasInvalid] = useState(false);
  const [hasDuplicates, setHasDuplicates] = useState(false);

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const validRoles = ["MAIN_RESIDENT", "ESTATE_GUARD"];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Only clear previous invites state, not file input
    setEditInvites([]);
    setHasInvalid(false);
    setHasDuplicates(false);
    setUploadedFileName("");

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<{ Email: string; Role?: string }>(sheet);

      const hasRoleColumn = rows.some((row) => typeof row.Role !== "undefined");
      let invalid = false;
      const extracted = rows
        .filter((row) => row.Email)
        .map((row) => {
          const email = row.Email.trim();
          let role = hasRoleColumn && row.Role ? row.Role.toUpperCase().trim() : "MAIN_RESIDENT";
          let error = "";
          if (!validateEmail(email)) {
            error = "Invalid email";
            invalid = true;
          }
          if (hasRoleColumn && row.Role && !validRoles.includes(role)) {
            error = error ? error + ", invalid role" : "Invalid role";
            invalid = true;
          }
          if (!role || !validRoles.includes(role)) role = "MAIN_RESIDENT";
          return { email, role, error };
        });
      // Detect duplicates
      const emailCounts = extracted.reduce(
        (acc, curr) => {
          acc[curr.email] = (acc[curr.email] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const withDupes = extracted.map((invite) => ({
        ...invite,
        error: invite.error || (emailCounts[invite.email] > 1 ? "Duplicate email" : ""),
      }));
      const hasDupes = withDupes.some((invite) => invite.error.includes("Duplicate email"));
      setEditInvites(withDupes);
      setHasInvalid(invalid || hasDupes);
      setHasDuplicates(hasDupes);
      setUploadedFileName(file.name);
      if (invalid || hasDupes)
        notify(
          "Some emails or roles are invalid or duplicated. Please review and correct before sending.",
          "error"
        );
      // Now clear file input so user can re-upload same file if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEditInvite = (index: number, field: "email" | "role", value: string) => {
    setEditInvites((prev) => {
      // Update the edited field
      const updated = prev.map((invite, idx) =>
        idx === index
          ? {
              ...invite,
              [field]: field === "role" ? value.toUpperCase() : value,
            }
          : invite
      );
      // Recalculate all errors for all rows
      const emails = updated.map((i) => i.email);
      const emailCounts = emails.reduce(
        (acc, curr) => {
          acc[curr] = (acc[curr] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const withErrors = updated.map((invite) => {
        let error = "";
        if (!validateEmail(invite.email)) error = "Invalid email";
        if (!validRoles.includes(invite.role.toUpperCase()))
          error = error ? error + ", Invalid role" : "Invalid role";
        if (emailCounts[invite.email] > 1)
          error = error ? error + ", Duplicate email" : "Duplicate email";
        return { ...invite, error };
      });
      setHasInvalid(withErrors.some((i) => i.error));
      setHasDuplicates(withErrors.some((i) => i.error?.includes("Duplicate email")));
      return withErrors;
    });
  };

  const handleSendInvites = async () => {
    // Prevent sending if there are duplicates
    if (hasDuplicates) {
      notify("Remove all duplicate emails before sending.", "error");
      return;
    }
    setBulkLoading(true);
    setBulkSuccess("");
    setBulkError("");
    let successCount = 0;
    let failCount = 0;
    const failList: string[] = [];
    for (const invite of editInvites) {
      if (invite.error) continue;
      try {
        const res = await fetch("/api/admin/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: invite.email, role: invite.role }),
        });
        const data = await res.json();
        if (!res.ok) {
          failCount++;
          failList.push(`${invite.email} (${data.error || "Failed"})`);
        } else {
          successCount++;
        }
      } catch {
        failCount++;
        failList.push(`${invite.email} (Network error)`);
      }
    }
    setBulkLoading(false);
    if (successCount > 0) {
      setBulkSuccess(`${successCount} invite(s) sent successfully!`);
      fetchInvites(page, pageSize);
      setEditInvites([]);
      setUploadedFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (failCount > 0) {
      setBulkError(`Failed to send ${failCount} invite(s):\n${failList.join(", ")}`);
    }
  };

  // Replace emails state with invitesToSend
  // legacy: invitesToSend removed

  // Filtered invites (client-side for search/filter)
  const filteredInvites = invites.filter((invite: Invite) => {
    const matchesSearch =
      !search || (invite.email && invite.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || invite.status === statusFilter;
    const matchesRole = !roleFilter || invite.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <UserPlusIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">
              Invites
            </h1>
            <p className="text-[11px] text-emerald-700">
              Send one-off or bulk invites to main residents and guards.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Pending</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>{invites.filter((i) => i.status === "PENDING").length}</span>
        </div>
      </header>

      {/* Bulk upload */}
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
              <ArrowUpTrayIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">
                Upload Excel file
              </h2>
              <p className="text-[11px] text-emerald-700">
                Use the provided template. Columns: <span className="font-semibold">Email</span> and
                optional <span className="font-semibold">Role</span>.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex w-full cursor-pointer items-center justify-between gap-3 rounded-full border border-emerald-200 bg-white/95 px-3 py-2 text-[11px] text-emerald-900 shadow-sm transition-colors hover:border-emerald-400 hover:bg-white sm:w-auto sm:min-w-[260px]">
            <span className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[13px] font-semibold">
                XLS
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">Choose Excel file</span>
                <span className="text-[10px] text-emerald-600">.xlsx or .xls, max a few MB</span>
              </span>
            </span>
            <span className="hidden text-[10px] font-semibold text-emerald-700 sm:inline">Browse</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>
        {uploadedFileName && (
          <div className="mt-2 text-[11px] text-emerald-800">
            Selected file: <span className="font-semibold">{uploadedFileName}</span>
          </div>
        )}
        {editInvites.length > 0 && (
          <div className="mt-3 w-full">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-emerald-900">
                Invites to send (edit if needed)
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditInvites([]);
                  setUploadedFileName("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-[10px] font-semibold rounded-full bg-rose-50 px-2 py-1 text-rose-700 hover:bg-rose-100"
              >
                Clear
              </button>
            </div>
            <ul className="max-h-48 overflow-y-auto rounded-xl border border-emerald-100 bg-white p-2 text-[11px] text-emerald-900">
              {editInvites.map((invite, index) => (
                <li
                  key={index}
                  className="flex flex-col gap-2 border-b border-emerald-50 py-1 last:border-b-0 sm:flex-row sm:items-center"
                >
                  <input
                    className={`min-w-0 flex-1 rounded-full border px-3 py-1 text-[11px] ${
                      invite.error?.includes("email") ? "border-rose-300" : "border-emerald-200"
                    }`}
                    value={invite.email}
                    onChange={(e) => handleEditInvite(index, "email", e.target.value)}
                  />
                  <select
                    className={`w-full rounded-full border px-3 py-1 text-[11px] sm:w-40 ${
                      invite.error?.includes("role") ? "border-rose-300" : "border-emerald-200"
                    }`}
                    value={invite.role}
                    onChange={(e) => handleEditInvite(index, "role", e.target.value)}
                  >
                    <option value="MAIN_RESIDENT">Main resident</option>
                    <option value="ESTATE_GUARD">Estate guard</option>
                  </select>
                  <div className="flex items-center gap-2 sm:ml-2">
                    {invite.error && (
                      <span className="text-[10px] font-medium text-rose-700">{invite.error}</span>
                    )}
                    <button
                      type="button"
                      className="text-[10px] font-semibold rounded-full bg-slate-100 px-2 py-1 text-slate-800 hover:bg-rose-50 hover:text-rose-700"
                      title="Remove row"
                      onClick={() => {
                        setEditInvites((prev) => {
                          const updated = prev.filter((_, i) => i !== index);
                          const emails = updated.map((i) => i.email);
                          const emailCounts = emails.reduce(
                            (acc, curr) => {
                              acc[curr] = (acc[curr] || 0) + 1;
                              return acc;
                            },
                            {} as Record<string, number>
                          );
                          const withDupes = updated.map((invite) => ({
                            ...invite,
                            error:
                              invite.error?.replace(/,? ?Duplicate email/, "") ||
                              (emailCounts[invite.email] > 1 ? "Duplicate email" : ""),
                          }));
                          setHasInvalid(withDupes.some((i) => i.error));
                          setHasDuplicates(
                            withDupes.some((i) => i.error?.includes("Duplicate email"))
                          );
                          return withDupes;
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[11px] text-emerald-800">
            {hasDuplicates && (
              <div className="font-medium text-rose-700">
                Remove all duplicate emails before sending.
              </div>
            )}
            {bulkSuccess && <div className="font-medium text-emerald-700">{bulkSuccess}</div>}
            {bulkError && (
              <div className="whitespace-pre-line text-[11px] font-medium text-rose-700">
                {bulkError}
              </div>
            )}
          </div>
          <button
            onClick={handleSendInvites}
            className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-40"
            disabled={bulkLoading || editInvites.length === 0 || hasInvalid || hasDuplicates}
          >
            {bulkLoading ? "Sending..." : "Send invites"}
          </button>
        </div>
      </section>

      {/* Invites list */}
      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">
              Invites history
            </h2>
            <p className="text-[11px] text-emerald-700">
              Search by email and filter by status or role.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
            >
              + Send invite
            </button>
          </div>
        </div>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:p-6">
              <button
                type="button"
                className="absolute right-3 top-3 text-lg text-emerald-900"
                onClick={() => setShowInviteModal(false)}
                aria-label="Close dialog"
              >
                &times;
              </button>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">New resident invite</h2>
                <p className="text-[11px] text-emerald-700">
                  Enter invite details and send securely to the selected resident.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 px-3 py-3 sm:px-4">
                <AdminInvitePage
                  onInviteSent={() => {
                    fetchInvites(page, pageSize);
                    setShowInviteModal(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-full transition-all duration-300 ease-out sm:w-64 sm:max-w-xs sm:focus-within:w-80">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500" />
            <input
              className="w-full rounded-full border border-emerald-100 bg-white px-7 py-1.5 pr-8 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Search by email..."
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
                <span className="text-[10px] font-bold">×</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <select
              className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[11px] text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="USED">Used</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
            </select>
            <select
              className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[11px] text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All roles</option>
              <option value="MAIN_RESIDENT">Main resident</option>
              <option value="ESTATE_GUARD">Estate guard</option>
            </select>
          </div>
        </div>

        {loading && <div className="text-[11px] text-emerald-800">Loading...</div>}

        {!loading && filteredInvites.length === 0 && (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-[11px] text-emerald-800">
            No invites found.
          </div>
        )}

        {/* Mobile cards */}
        {!loading && filteredInvites.length > 0 && (
          <div className="space-y-3 md:hidden">
            {filteredInvites.map((invite) => (
              <div
                key={invite.id}
                className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-emerald-950">
                      {invite.email}
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      {invite.role} • {new Date(invite.expiresAt).toLocaleString()}
                    </div>
                    <div className="mt-1">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                          (invite.status === "PENDING"
                            ? "bg-amber-50 text-amber-800"
                            : invite.status === "USED"
                              ? "bg-emerald-600 text-emerald-50"
                              : invite.status === "EXPIRED"
                                ? "bg-slate-100 text-slate-700"
                                : invite.status === "REVOKED"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-slate-100 text-slate-700")
                        }
                      >
                        {invite.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[11px]">
                    <button
                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold shadow-sm ${
                        ["USED", "REVOKED"].includes(invite.status)
                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                          : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      }`}
                      onClick={() =>
                        !["USED", "REVOKED"].includes(invite.status) &&
                        handleAction(invite.id, "resend")
                      }
                      disabled={["USED", "REVOKED"].includes(invite.status)}
                    >
                      Resend
                    </button>
                    <button
                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold shadow-sm ${
                        ["USED", "REVOKED"].includes(invite.status)
                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                      onClick={() =>
                        !["USED", "REVOKED"].includes(invite.status) &&
                        handleAction(invite.id, "revoke")
                      }
                      disabled={["USED", "REVOKED"].includes(invite.status)}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        {!loading && filteredInvites.length > 0 && (
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/80">
              <div className="max-h-[420px] overflow-y-auto">
                <table className="min-w-full text-xs text-emerald-950">
                  <thead className="bg-emerald-50/80 text-[11px] uppercase tracking-wide text-emerald-700">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Email</th>
                      <th className="px-4 py-2 text-left font-semibold">Role</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                      <th className="px-4 py-2 text-left font-semibold">Expires</th>
                      <th className="px-4 py-2 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {filteredInvites.map((invite) => (
                      <tr key={invite.id} className="transition hover:bg-emerald-50/60">
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] text-emerald-900">{invite.email}</span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] text-emerald-800">{invite.role}</span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span
                            className={
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                              (invite.status === "PENDING"
                                ? "bg-amber-50 text-amber-800"
                                : invite.status === "USED"
                                  ? "bg-emerald-600 text-emerald-50"
                                  : invite.status === "EXPIRED"
                                    ? "bg-slate-100 text-slate-700"
                                    : invite.status === "REVOKED"
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-slate-100 text-slate-700")
                            }
                          >
                            {invite.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] text-emerald-800">
                            {new Date(invite.expiresAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2 text-[11px]">
                            <button
                              className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold shadow-sm ${
                                ["USED", "REVOKED"].includes(invite.status)
                                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              }`}
                              onClick={() =>
                                !["USED", "REVOKED"].includes(invite.status) &&
                                handleAction(invite.id, "resend")
                              }
                              disabled={["USED", "REVOKED"].includes(invite.status)}
                            >
                              Resend
                            </button>
                            <button
                              className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold shadow-sm ${
                                ["USED", "REVOKED"].includes(invite.status)
                                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                              }`}
                              onClick={() =>
                                !["USED", "REVOKED"].includes(invite.status) &&
                                handleAction(invite.id, "revoke")
                              }
                              disabled={["USED", "REVOKED"].includes(invite.status)}
                            >
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
