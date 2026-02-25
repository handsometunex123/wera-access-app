"use client";
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserGroupIcon,
  EnvelopeOpenIcon,
  KeyIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

type DashboardUser = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
};

type DashboardAuditLog = {
  id: string;
  action: string;
  createdAt: string;
  user?: {
    fullName?: string;
  } | null;
};

type DashboardData = {
  residentCount: number;
  pendingInvites: number;
  activeCodes: number;
  pendingPayments: number;
  recentLogs: DashboardAuditLog[];
  recentUsers: DashboardUser[];
  pendingApproval: number;
  };

  export function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    // Removed unused loading and error state
    const [today, setToday] = useState<string>("");

    useEffect(() => {
      fetchDashboard();
      setToday(
        new Date().toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    }, []);

    async function fetchDashboard() {
      // loading and error state removed
      try {
        const res = await fetch("/api/admin/dashboard");
        const d = await res.json();
        if (res.ok) setData(d);
      } catch {
        // error state removed
      } finally {
        // loading state removed
      }
    }

    // ...existing code...

    return (
      <div className="w-full flex flex-col gap-8 p-0 md:p-10">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="w-7 h-7 text-emerald-900" />
              <h1 className="text-xl font-semibold text-emerald-950 tracking-tight">Admin Dashboard</h1>
            </div>
            <div className="text-xs text-emerald-950 font-bold">{today}</div>
          </header>
          {data && (
            <>
              {/* Crisp Numbers Row */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Link href="/admin/users" className="rounded-2xl shadow-md p-6 flex flex-col items-center border border-gray-200 bg-white transition-all hover:scale-[1.01] hover:shadow-lg duration-200 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <UserGroupIcon className="w-5 h-5 text-emerald-900" />
                    <span className="text-base font-semibold text-emerald-950 tracking-tight">Approved Users</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-950 mb-1 tracking-tight">{data.residentCount}</div>
                  <span className="text-xs text-emerald-700 underline mt-1">View Approved Users</span>
                </Link>
                <Link href="/admin/invites" className="rounded-2xl shadow-md p-6 flex flex-col items-center border border-gray-200 bg-white transition-all hover:scale-[1.01] hover:shadow-lg duration-200 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <EnvelopeOpenIcon className="w-5 h-5 text-emerald-900" />
                    <span className="text-base font-semibold text-emerald-950 tracking-tight">Pending Invites</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-950 mb-1 tracking-tight">{data.pendingInvites}</div>
                  <span className="text-xs text-emerald-700 underline mt-1">View Invites</span>
                </Link>
                <Link href="/admin/users" className="rounded-2xl shadow-md p-6 flex flex-col items-center border border-gray-200 bg-white transition-all hover:scale-[1.01] hover:shadow-lg duration-200 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyIcon className="w-5 h-5 text-emerald-900" />
                    <span className="text-base font-semibold text-emerald-950 tracking-tight">Active Codes</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-950 mb-1 tracking-tight">{data.activeCodes}</div>
                  <span className="text-xs text-emerald-700 underline mt-1">View Codes</span>
                </Link>
                <Link href="/admin/pending-users" className="rounded-2xl shadow-md p-6 flex flex-col items-center border border-gray-200 bg-white transition-all hover:scale-[1.01] hover:shadow-lg duration-200 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="w-5 h-5 text-emerald-900" />
                    <span className="text-base font-semibold text-emerald-950 tracking-tight">Pending Approval</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-950 mb-1 tracking-tight">{data.pendingApproval ?? 0}</div>
                  <span className="text-xs text-emerald-700 underline mt-1">View Pending</span>
                </Link>
              </section>
              {/* ...existing code for recent activity and registrations... */}

              {/* Recent Activity */}
              <section>
                <h2 className="text-base font-semibold mb-2 text-emerald-950 tracking-tight">Recent Activity</h2>
                <div className="overflow-x-auto rounded-xl shadow border border-emerald-100 bg-white/80">
                  <table className="min-w-full border text-xs bg-transparent text-emerald-950">
                    <thead>
                      <tr className="bg-emerald-100/60 text-emerald-950">
                        <th className="px-6 py-3 text-left font-semibold text-emerald-950">User</th>
                        <th className="px-6 py-3 text-left font-semibold text-emerald-950">Action</th>
                        <th className="px-6 py-3 text-left font-semibold text-emerald-950">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentLogs.map((log, idx) => (
                        <tr key={log.id} className={`border-b transition-all ${idx % 2 === 0 ? "bg-white/60" : "bg-emerald-50/40"} hover:bg-emerald-100/60`}>
                          <td className="px-6 py-3 text-emerald-950 whitespace-nowrap text-left">{log.user?.fullName || "-"}</td>
                          <td className="px-6 py-3 text-emerald-950 whitespace-nowrap text-left">{log.action}</td>
                          <td className="px-6 py-3 text-emerald-950 whitespace-nowrap text-left">{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {data.recentLogs.length === 0 && (
                        <tr><td colSpan={3} className="text-center p-4 text-emerald-950">No recent activity.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Recent Registrations */}
              <section className="pb-6">
                <h2 className="text-base font-semibold mb-2 text-blue-950 tracking-tight">Recent Registrations</h2>
                <div className="overflow-x-auto rounded-xl shadow border border-blue-100 bg-white/80">
                  <table className="min-w-full border text-xs bg-transparent text-blue-950">
                    <thead>
                      <tr className="bg-blue-100/60 text-blue-950">
                        <th className="px-6 py-3 text-left font-semibold text-blue-950">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-blue-950">Email</th>
                        <th className="px-6 py-3 text-left font-semibold text-blue-950">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentUsers.map((u, idx) => (
                        <tr key={u.id} className={`border-b transition-all ${idx % 2 === 0 ? "bg-white/60" : "bg-blue-50/40"} hover:bg-blue-100/60`}>
                          <td className="px-6 py-3 text-blue-950 whitespace-nowrap text-left">{u.fullName}</td>
                          <td className="px-6 py-3 text-blue-950 whitespace-nowrap text-left">{u.email}</td>
                          <td className="px-6 py-3 text-blue-950 whitespace-nowrap text-left">{new Date(u.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {data.recentUsers.length === 0 && (
                        <tr><td colSpan={3} className="text-center p-4 text-blue-950">No recent registrations.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
    );
  }

