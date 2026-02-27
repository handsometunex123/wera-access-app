"use client";
import React, { useState, useEffect, useRef } from "react";
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

  const fetchInvites = React.useCallback(async (pageOverride: number, pageSizeOverride: number) => {
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
  }, [notify]);

  useEffect(() => {
    fetchInvites(page, pageSize);
  }, [page, pageSize]);
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

  const [editInvites, setEditInvites] = useState<{ email: string; role: string; error?: string }[]>([]);
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

      const hasRoleColumn = rows.some(row => typeof row.Role !== "undefined");
      let invalid = false;
      const extracted = rows
        .filter(row => row.Email)
        .map(row => {
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
      const emailCounts = extracted.reduce((acc, curr) => {
        acc[curr.email] = (acc[curr.email] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const withDupes = extracted.map(invite => ({
        ...invite,
        error: invite.error || (emailCounts[invite.email] > 1 ? "Duplicate email" : "")
      }));
      const hasDupes = withDupes.some(invite => invite.error.includes("Duplicate email"));
      setEditInvites(withDupes);
      setHasInvalid(invalid || hasDupes);
      setHasDuplicates(hasDupes);
      setUploadedFileName(file.name);
      if (invalid || hasDupes) notify("Some emails or roles are invalid or duplicated. Please review and correct before sending.", "error");
      // Now clear file input so user can re-upload same file if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEditInvite = (index: number, field: "email" | "role", value: string) => {
    setEditInvites(prev => {
      // Update the edited field
      const updated = prev.map((invite, idx) =>
        idx === index
          ? {
              ...invite,
              [field]: field === "role" ? value.toUpperCase() : value
            }
          : invite
      );
      // Recalculate all errors for all rows
      const emails = updated.map(i => i.email);
      const emailCounts = emails.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
          const withErrors = updated.map((invite) => {
        let error = "";
        if (!validateEmail(invite.email)) error = "Invalid email";
        if (!validRoles.includes(invite.role.toUpperCase())) error = error ? error + ", Invalid role" : "Invalid role";
        if (emailCounts[invite.email] > 1) error = error ? error + ", Duplicate email" : "Duplicate email";
        return { ...invite, error };
      });
      setHasInvalid(withErrors.some(i => i.error));
      setHasDuplicates(withErrors.some(i => i.error?.includes("Duplicate email")));
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
          failList.push(`${invite.email} (${data.error || 'Failed'})`);
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
      setBulkError(`Failed to send ${failCount} invite(s):\n${failList.join(', ')}`);
    }
  };

  // Replace emails state with invitesToSend
  // legacy: invitesToSend removed

  // Filtered invites (client-side for search/filter)
  const filteredInvites = invites.filter((invite: Invite) => {
    const matchesSearch =
      !search ||
      (invite.email && invite.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || invite.status === statusFilter;
    const matchesRole = !roleFilter || invite.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="min-h-screen flex justify-center bg-gray-50">
      <div className="w-full p-4 sm:p-8 rounded-xl shadow-lg bg-white">
        {/* Upload Excel File UI - moved to top and styled */}
        <div className="mb-8 border border-emerald-200 rounded-xl bg-emerald-50 p-6 flex flex-col items-start shadow-sm">
          <h2 className="text-lg font-bold text-emerald-700 mb-2 flex items-center">
            <span className="mr-2">📄</span> Upload Excel File
          </h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="mb-3 border border-emerald-300 rounded px-3 py-2 bg-white text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition w-full"
          />
          {uploadedFileName && (
            <div className="mb-2 text-xs text-emerald-700">Selected file: <span className="font-semibold">{uploadedFileName}</span></div>
          )}
          {editInvites.length > 0 && (
            <div className="w-full mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-emerald-700 font-semibold">Invites to send (edit if needed):</div>
                <button
                  type="button"
                  onClick={() => {
                    setEditInvites([]);
                    setUploadedFileName("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-semibold"
                >
                  Clear Invites
                </button>
              </div>
              <ul className="max-h-48 overflow-y-auto bg-white border border-emerald-100 rounded p-2 text-xs text-emerald-900">
                {editInvites.map((invite, index) => (
                  <li key={index} className="py-1 border-b last:border-b-0 flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      className={`border rounded px-2 py-1 flex-1 min-w-0 ${invite.error?.includes('email') ? 'border-red-400' : 'border-emerald-200'}`}
                      value={invite.email}
                      onChange={e => handleEditInvite(index, 'email', e.target.value)}
                    />
                    <select
                      className={`border rounded px-2 py-1 w-full sm:w-40 ${invite.error?.includes('role') ? 'border-red-400' : 'border-emerald-200'}`}
                      value={invite.role}
                      onChange={e => handleEditInvite(index, 'role', e.target.value)}
                    >
                      <option value="MAIN_RESIDENT">Main Resident</option>
                      <option value="ESTATE_GUARD">Estate Guard</option>
                    </select>
                    <div className="flex items-center gap-2 sm:ml-2">
                      {invite.error && <span className="text-red-600 text-xs">{invite.error}</span>}
                      <button
                        type="button"
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-red-200 hover:text-red-700 transition font-semibold"
                        title="Remove row"
                        onClick={() => {
                          setEditInvites(prev => {
                            const updated = prev.filter((_, i) => i !== index);
                            // Recalculate errors after removal
                            const emails = updated.map(i => i.email);
                            const emailCounts = emails.reduce((acc, curr) => {
                              acc[curr] = (acc[curr] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            const withDupes = updated.map(invite => ({
                              ...invite,
                              error: invite.error?.replace(/,? ?Duplicate email/, "") || (emailCounts[invite.email] > 1 ? "Duplicate email" : "")
                            }));
                            setHasInvalid(withDupes.some(i => i.error));
                            setHasDuplicates(withDupes.some(i => i.error?.includes("Duplicate email")));
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
          <div>
          <button
            onClick={handleSendInvites}
            className="mt-2 px-4 py-2 bg-emerald-700 text-white rounded font-bold shadow hover:bg-emerald-800 transition w-full"
            disabled={bulkLoading || editInvites.length === 0 || hasInvalid || hasDuplicates}
          >
            {bulkLoading ? "Sending..." : "Send Invites"}
          </button>
          </div>
          {hasDuplicates && <div className="mt-2 text-red-700 text-sm">Remove all duplicate emails before sending.</div>}
          {bulkSuccess && <div className="mt-2 text-emerald-700 text-sm">{bulkSuccess}</div>}
          {bulkError && <div className="mt-2 text-red-700 text-sm whitespace-pre-line">{bulkError}</div>}
        </div>
        {/* Send Invite button moved outside filter bar */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-emerald-700 text-white rounded font-bold shadow hover:bg-emerald-800 transition whitespace-nowrap w-full sm:w-auto text-center"
          >
            + Send Invite
          </button>
        </div>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2">
            <div className="bg-white rounded-xl shadow-lg p-3 md:p-6 w-full max-w-sm md:max-w-md relative">
              <button className="absolute top-3 right-3 text-lg text-emerald-900" onClick={() => setShowInviteModal(false)} aria-label="Close dialog">&times;</button>
              <AdminInvitePage onInviteSent={() => { fetchInvites(page, pageSize); setShowInviteModal(false); }} />
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row flex-1 gap-2">
            <input
              className="border rounded px-2 py-1 flex-1 text-emerald-900 placeholder-emerald-700"
              placeholder="Search by email..."
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
              <option value="USED">Used</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
            </select>
            <select
              className="border rounded px-2 py-1 text-emerald-900"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="MAIN_RESIDENT">Main Resident</option>
              <option value="ESTATE_GUARD">Estate Guard</option>
            </select>
          </div>
        </div>
        {loading ? <div>Loading...</div> : null}
        {/* All errors and actions now use toast notifications; removed error variable */}
        {/* Empty state display */}
        {!loading && filteredInvites.length === 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm text-emerald-900">
              <thead>
                <tr className="bg-emerald-100 text-emerald-900">
                  <th className="px-6 py-3 text-left font-semibold text-emerald-900">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-emerald-900">Role</th>
                  <th className="px-6 py-3 text-left font-semibold text-emerald-900">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-emerald-900">Expires</th>
                  <th className="px-6 py-3 text-right font-semibold text-emerald-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center p-4 text-emerald-900">No invites found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {/* Mobile: card list (small screens) */}
        {!loading && filteredInvites.length > 0 && (
          <div className="space-y-3 md:hidden">
            {filteredInvites.map(invite => (
              <div key={invite.id} className="p-4 bg-white border rounded-lg shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-emerald-900">{invite.email}</div>
                    <div className="text-xs text-gray-500">{invite.role} • {new Date(invite.expiresAt).toLocaleString()}</div>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${invite.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : invite.status === 'USED' ? 'bg-emerald-100 text-emerald-700' : invite.status === 'EXPIRED' ? 'bg-gray-200 text-gray-600' : invite.status === 'REVOKED' ? 'bg-red-100 text-red-700' : ''}`}>{invite.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      className={`px-3 py-1 rounded ${["USED", "REVOKED"].includes(invite.status) ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-emerald-600 text-white"}`}
                      onClick={() => !["USED", "REVOKED"].includes(invite.status) && handleAction(invite.id, "resend")}
                      disabled={["USED", "REVOKED"].includes(invite.status)}
                    >Resend</button>
                    <button
                      className={`px-3 py-1 rounded ${["USED", "REVOKED"].includes(invite.status) ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-600 text-white"}`}
                      onClick={() => !["USED", "REVOKED"].includes(invite.status) && handleAction(invite.id, "revoke")}
                      disabled={["USED", "REVOKED"].includes(invite.status)}
                    >Revoke</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop: table (md+) */}
        {!loading && filteredInvites.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm border">
            <thead>
              <tr className="bg-emerald-100">
                <th className="px-6 py-3 text-left border align-middle">Email</th>
                <th className="px-6 py-3 text-left border align-middle">Role</th>
                <th className="px-6 py-3 text-left border align-middle">Status</th>
                <th className="px-6 py-3 text-left border align-middle">Expires</th>
                <th className="px-6 py-3 text-right border align-middle">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvites.map(invite => (
                <tr key={invite.id}>
                  <td className="px-6 py-3 border align-middle text-left">{invite.email}</td>
                  <td className="px-6 py-3 border align-middle text-left">{invite.role}</td>
                  <td className="px-6 py-3 border align-middle text-left">
                    <span
                      className={
                        invite.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold"
                          : invite.status === "USED"
                          ? "bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-semibold"
                          : invite.status === "EXPIRED"
                          ? "bg-gray-200 text-gray-600 px-2 py-1 rounded font-semibold"
                          : invite.status === "REVOKED"
                          ? "bg-red-100 text-red-700 px-2 py-1 rounded font-semibold"
                          : "px-2 py-1 rounded font-semibold"
                      }
                    >
                      {invite.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 border align-middle text-left">{new Date(invite.expiresAt).toLocaleString()}</td>
                  <td className="px-6 py-3 border align-middle text-right">
                    <button
                      className={`px-2 py-1 rounded mr-2 ${["USED", "REVOKED"].includes(invite.status) ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-emerald-600 text-white"}`}
                      onClick={() => !["USED", "REVOKED"].includes(invite.status) && handleAction(invite.id, "resend")}
                      disabled={["USED", "REVOKED"].includes(invite.status)}
                    >
                      Resend
                    </button>
                    <button
                      className={`px-2 py-1 rounded ${["USED", "REVOKED"].includes(invite.status) ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-600 text-white"}`}
                      onClick={() => !["USED", "REVOKED"].includes(invite.status) && handleAction(invite.id, "revoke")}
                      disabled={["USED", "REVOKED"].includes(invite.status)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
