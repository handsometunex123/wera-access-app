"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserGroupIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  type TooltipItem,
} from "chart.js";
import { supabaseClient } from "@/lib/supabaseClient";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, ChartTooltip, ChartLegend);

/* eslint-disable @typescript-eslint/no-explicit-any */
const LineChart = dynamic(() => import("react-chartjs-2").then((m) => m.Line as any), { ssr: false }) as any;
const DoughnutChart = dynamic(() => import("react-chartjs-2").then((m) => m.Doughnut as any), { ssr: false }) as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type DashboardUser = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  role?: "MAIN_RESIDENT" | "DEPENDANT" | "ESTATE_GUARD" | "ADMIN" | string;
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
  approvedUsersCount: number;
  rejectedUsersCount: number;
  disabledUsersCount: number;
  blockedUsersCount: number;
   mainResidentCount: number;
   dependantCount: number;
   estateGuardCount: number;
};

type ScanStat = {
  id: string;
  createdAt: string;
  status: string;
  message?: string | null;
  accessMethod: "ACCESS_CARD" | "FINGERPRINT" | "ACCESS_CODE";
};

type ActivityItem = {
  id: string;
  residentId?: string | null;
  residentName: string;
  accessMethod: "ACCESS_CARD" | "FINGERPRINT" | "ACCESS_CODE";
  accessLabel: string;
  verb: string;
  createdAt: string;
};

type ViewMode = "day" | "week";

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 lg:gap-8 items-start animate-pulse">
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`stat-skeleton-${i}`} className="rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
              <div className="h-3 w-24 rounded bg-emerald-100 mb-3" />
              <div className="h-6 w-14 rounded bg-emerald-200" />
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-5 items-stretch">
          <div className="rounded-2xl shadow-md border border-emerald-100 bg-white p-4">
            <div className="h-4 w-40 rounded bg-emerald-100 mb-3" />
            <div className="h-[220px] rounded-xl bg-emerald-50" />
          </div>
          <div className="rounded-2xl shadow-md border border-emerald-100 bg-white p-4">
            <div className="h-4 w-28 rounded bg-emerald-100 mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-emerald-100" />
              <div className="h-3 w-24 rounded bg-emerald-100" />
              <div className="h-3 w-16 rounded bg-emerald-100" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow">
          <div className="h-4 w-40 rounded bg-emerald-100 mb-4" />
          <div className="h-56 rounded-xl bg-emerald-50" />
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow">
          <div className="h-4 w-44 rounded bg-emerald-100 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`pending-skeleton-${i}`} className="h-10 rounded-lg bg-emerald-50" />
            ))}
          </div>
        </section>
      </div>

      <aside className="mt-4 space-y-3 lg:mt-0">
        <div className="rounded-2xl shadow-md border border-emerald-100 bg-white p-4 h-full">
          <div className="h-4 w-32 rounded bg-emerald-100 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`activity-skeleton-${i}`} className="h-14 rounded-xl bg-emerald-50" />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [today, setToday] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [scanStats, setScanStats] = useState<ScanStat[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityFilter, setActivityFilter] = useState<"all" | "in" | "out">("all");
  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      if (!cancelled) {
        setDashboardLoading(true);
      }

      const dashboardPromise = (async () => {
        try {
          const res = await fetch("/api/admin/dashboard");
          const d = await res.json();
          if (res.ok && !cancelled) {
            setData(d);
          }
        } catch {
          // silent fail on dashboard load
        }
      })();

      const scanStatsPromise = (async () => {
        try {
          const res = await fetch("/api/admin/scan-stats?range=week");
          const d = await res.json();
          if (res.ok && Array.isArray(d.scans) && !cancelled) {
            setScanStats(
              d.scans.map((s: { id: string; createdAt: string; status: string; message?: string | null; accessMethod?: string | null }) => ({
                id: s.id,
                createdAt: s.createdAt,
                status: s.status,
                message: s.message,
                accessMethod: ((s.accessMethod as ScanStat["accessMethod"]) || "ACCESS_CODE") as ScanStat["accessMethod"],
              }))
            );
          }
        } catch {
          // ignore metrics errors
        }
      })();

      const activityPromise = (async () => {
        try {
          const res = await fetch("/api/admin/recent-activity");
          const d = await res.json();
          if (res.ok && Array.isArray(d.activity) && !cancelled) {
            setActivity(d.activity);
          }
        } catch {
          // ignore
        }
      })();

      await Promise.allSettled([dashboardPromise, scanStatsPromise, activityPromise]);

      if (!cancelled) {
        const todayString = new Date().toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        setToday(todayString);
        setDashboardLoading(false);
      }
    };

    void loadAll();

    // Subscribe to Supabase Realtime for new scan logs
    let channel: ReturnType<NonNullable<typeof supabaseClient>["channel"]> | null = null;
    if (supabaseClient) {
      channel = supabaseClient
        .channel("scan-logs")
        .on("broadcast", { event: "scan_created" }, (event: { payload?: unknown }) => {
          const payload = event.payload as ActivityItem | undefined;
          if (cancelled || !payload) return;
          setActivity((prev) => {
            const next = [payload, ...prev];
            return next.slice(0, 50);
          });
        });

      void channel.subscribe();
    }

    return () => {
      cancelled = true;
      if (channel) {
        void channel.unsubscribe();
      }
    };
  }, []);

  const mainResidentCount = data?.mainResidentCount ?? 0;
  const dependantCount = data?.dependantCount ?? 0;
  const estateGuardCount = data?.estateGuardCount ?? 0;
  const approvedUsersCount = data?.approvedUsersCount ?? 0;
  const pendingUsersCount = data?.pendingApproval ?? 0;
  const rejectedUsersCount = data?.rejectedUsersCount ?? 0;
  const disabledUsersCount = data?.disabledUsersCount ?? 0;
  const blockedUsersCount = data?.blockedUsersCount ?? 0;
  const totalUsers = mainResidentCount + dependantCount + estateGuardCount;
  const mainResidentShare = totalUsers ? Math.round((mainResidentCount / totalUsers) * 100) : 0;
  const dependantShare = totalUsers ? Math.round((dependantCount / totalUsers) * 100) : 0;
  const estateGuardShare = totalUsers ? Math.round((estateGuardCount / totalUsers) * 100) : 0;

  const chartData = useMemo(() => {
    const now = new Date();

    if (viewMode === "day") {
      const buckets = new Map<string, { label: string; accessCard: number; fingerprint: number; accessCode: number }>();

      scanStats.forEach((s) => {
        const date = new Date(s.createdAt);
        const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 7) return;

        const key = date.toISOString().slice(0, 10);
        const existing = buckets.get(key) || {
          label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          accessCard: 0,
          fingerprint: 0,
          accessCode: 0,
        };
        if (s.accessMethod === "ACCESS_CARD") existing.accessCard += 1;
        else if (s.accessMethod === "FINGERPRINT") existing.fingerprint += 1;
        else existing.accessCode += 1;
        buckets.set(key, existing);
      });

      // ensure we always show the last 7 days, even with no data
      if (buckets.size === 0) {
        for (let i = 6; i >= 0; i -= 1) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          const key = date.toISOString().slice(0, 10);
          buckets.set(key, {
            label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            accessCard: 0,
            fingerprint: 0,
            accessCode: 0,
          });
        }
      }

      return Array.from(buckets.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([, value]) => value);
    }

    // Week view: always 4 buckets (this week and previous 3 weeks)
    const weekBuckets: { label: string; accessCard: number; fingerprint: number; accessCode: number }[] = [
      { label: "This wk", accessCard: 0, fingerprint: 0, accessCode: 0 },
      { label: "Last wk", accessCard: 0, fingerprint: 0, accessCode: 0 },
      { label: "2 wks ago", accessCard: 0, fingerprint: 0, accessCode: 0 },
      { label: "3 wks ago", accessCard: 0, fingerprint: 0, accessCode: 0 },
    ];

    scanStats.forEach((s) => {
      const date = new Date(s.createdAt);
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 0 || diffDays > 28) return;

      const weekIndex = Math.floor(diffDays / 7); // 0..3
      if (weekIndex < 0 || weekIndex > 3) return;

      if (s.accessMethod === "ACCESS_CARD") weekBuckets[weekIndex].accessCard += 1;
      else if (s.accessMethod === "FINGERPRINT") weekBuckets[weekIndex].fingerprint += 1;
      else weekBuckets[weekIndex].accessCode += 1;
    });

    return weekBuckets;
  }, [scanStats, viewMode]);

  const chartJsData = useMemo(
    () => ({
      labels: chartData.map((d) => d.label),
      datasets: [
        {
          label: "Access Card",
          data: chartData.map((d) => d.accessCard),
          borderColor: "#10b981", // emerald
          backgroundColor: "rgba(16, 185, 129, 0.16)",
          tension: 0.3,
        },
        {
          label: "Fingerprint",
          data: chartData.map((d) => d.fingerprint),
          borderColor: "#0ea5e9", // sky
          backgroundColor: "rgba(14, 165, 233, 0.16)",
          tension: 0.3,
        },
        {
          label: "Access Code",
          data: chartData.map((d) => d.accessCode),
          borderColor: "#8b5cf6", // violet
          backgroundColor: "rgba(139, 92, 246, 0.18)",
          tension: 0.3,
        },
      ],
    }),
    [chartData],
  );

  const chartJsOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index" as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: {
            font: { size: 11 },
          },
        },
        tooltip: {
          enabled: true,
        },
      },
      scales: {
        x: {
          type: "category" as const,
          ticks: {
            font: { size: 10 },
            autoSkip: false,
            maxRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { size: 10 },
          },
          suggestedMax: 5,
        },
      },
    }),
    [],
  );

  const residentPieData = useMemo(() => {
    if (!data) return null;

    const main = data.mainResidentCount ?? 0;
    const dependants = data.dependantCount ?? 0;
    const guards = data.estateGuardCount ?? 0;

    return {
      labels: ["Main residents", "Dependants", "Estate guards"],
      datasets: [
        {
          data: [main, dependants, guards],
          backgroundColor: ["#10b981", "#22c55e", "#0ea5e9"],
          borderColor: ["#065f46", "#15803d", "#0369a1"],
          borderWidth: 2,
          hoverOffset: 6,
          spacing: 2,
          borderRadius: 4,
        },
      ],
    };
  }, [data]);

  const residentPieOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: 8,
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 700,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: false,
          position: "bottom" as const,
          labels: {
            usePointStyle: true,
            padding: 12,
            font: { size: 11 },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<"doughnut">) => {
              const label = context.label || "";
              const value = context.raw as number;
              const dataArr = (context.dataset?.data || []) as number[];
              const total = dataArr.reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0);
              const pct = total ? ((value / total) * 100).toFixed(1) : "0.0";
              const descriptions: Record<string, string> = {
                "Main residents": "Primary household account holders with full estate access.",
                Dependants: "Linked household members managed under a main resident.",
                "Estate guards": "On-site security staff managing gate and estate access.",
              };
              const desc = descriptions[label] || "";
              return [`${label}: ${value} (${pct}%)`, desc];
            },
          },
        },
      },
      cutout: "60%",
    }),
    [],
  );

  return (
    <div className="w-full flex flex-col gap-6 px-3 py-4 sm:px-4 sm:py-5 lg:px-0 lg:py-0 lg:gap-2 md:px-6 md:py-6 xl:px-0 xl:py-0">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <UserGroupIcon className="w-7 h-7 text-emerald-900" />
            <h1 className="text-xl font-semibold text-emerald-950 tracking-tight">Admin Dashboard</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-emerald-950">
            <span className="font-bold">{today}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-emerald-700">View</span>
              <div className="inline-flex rounded-full bg-emerald-100 p-1 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode("day")}
                  className={`px-3 py-1 rounded-full ${
                    viewMode === "day" ? "bg-white text-emerald-900 shadow-sm" : "text-emerald-700"
                  }`}
                >
                  Day
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-1 rounded-full ${
                    viewMode === "week" ? "bg-white text-emerald-900 shadow-sm" : "text-emerald-700"
                  }`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      {dashboardLoading ? (
        <DashboardSkeleton />
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Users overview</h2>
                </div>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                >
                  Open users
                  <ArrowUpRightIcon className="h-3 w-3" />
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between text-[11px] sm:items-start gap-4">
                <div className="rounded-xl border border-emerald-100 bg-white px-2.5 py-2">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-emerald-700">By status</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Link href="/admin/users?status=APPROVED" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 hover:bg-emerald-100">
                      Approved <strong className="font-semibold text-emerald-950">{approvedUsersCount}</strong>
                    </Link>
                    <Link href="/admin/users?status=PENDING" className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 hover:bg-amber-100">
                      Pending <strong className="font-semibold text-amber-900">{pendingUsersCount}</strong>
                    </Link>
                    <Link href="/admin/users?status=REVOKED" className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 hover:bg-rose-100">
                      Rejected <strong className="font-semibold text-rose-900">{rejectedUsersCount}</strong>
                    </Link>
                    <Link href="/admin/users?status=DISABLED" className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200">
                      Disabled <strong className="font-semibold text-slate-900">{disabledUsersCount}</strong>
                    </Link>
                    <Link href="/admin/users?status=BLOCKED" className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200">
                      Blocked <strong className="font-semibold text-slate-900">{blockedUsersCount}</strong>
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-white px-2.5 py-2">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-emerald-700">By role</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Link href="/admin/users?role=MAIN_RESIDENT" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 hover:bg-emerald-100">
                      Main residents <strong className="font-semibold text-emerald-950">{mainResidentCount}</strong>
                    </Link>
                    <Link href="/admin/users?role=DEPENDANT" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 hover:bg-emerald-100">
                      Dependants <strong className="font-semibold text-emerald-950">{dependantCount}</strong>
                    </Link>
                    <Link href="/admin/users?role=ESTATE_GUARD" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 hover:bg-emerald-100">
                      Estate guards <strong className="font-semibold text-emerald-950">{estateGuardCount}</strong>
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Compact stats row */}
            {/* <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Link
                href="/admin/users"
                className="group relative flex flex-col rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-sm transition-all duration-150 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 min-h-[28px] leading-tight">
                      <span className="block">Approved</span>
                      <span className="block">residents</span>
                    </p>
                    <p className="text-2xl font-semibold leading-tight text-emerald-950">
                      {data.residentCount}
                    </p>
                  </div>
                  <div className="self-end">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <UserGroupIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
              <Link
                href="/admin/invites"
                className="group relative flex flex-col rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-sm transition-all duration-150 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 min-h-[28px] leading-tight">
                      <span className="block">Pending</span>
                      <span className="block">invites</span>
                    </p>
                    <p className="text-2xl font-semibold leading-tight text-emerald-950">
                      {data.pendingInvites}
                    </p>
                  </div>
                  <div className="self-end">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <EnvelopeOpenIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
              <Link
                href="/admin/users"
                className="group relative flex flex-col rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-sm transition-all duration-150 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 min-h-[28px] leading-tight">
                      <span className="block">Active access</span>
                      <span className="block">codes</span>
                    </p>
                    <p className="text-2xl font-semibold leading-tight text-emerald-950">
                      {data.activeCodes}
                    </p>
                  </div>
                  <div className="self-end">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <KeyIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
              <Link
                href="/admin/users"
                className="group relative flex flex-col rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-sm transition-all duration-150 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 min-h-[28px] leading-tight">
                      <span className="block">Pending</span>
                      <span className="block">approvals</span>
                    </p>
                    <p className="text-2xl font-semibold leading-tight text-emerald-950">
                      {data.pendingApproval ?? 0}
                    </p>
                  </div>
                  <div className="self-end">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <ClockIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </section> */}

            {/* Access analytics + totals */}
            <section className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-5 items-stretch">
              <div className="rounded-2xl shadow-md border border-emerald-100 bg-white p-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Access Mode Analytics</h2>
                  <span className="text-[11px] text-emerald-600">By {viewMode === "day" ? "day (last 7)" : "week"}</span>
                </div>
                <div className="flex-1 min-h-[220px]">
                  <div className="h-[220px]">
                    <LineChart data={chartJsData} options={chartJsOptions} />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl shadow-md border border-emerald-100 bg-white p-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-emerald-950 tracking-tight mb-1">Scans Overview</h2>
                  <p className="text-[11px] text-emerald-700 mb-3">Total number of codes scanned per day.</p>
                </div>
                <div className="flex flex-col gap-2">
                  {(() => {
                    const todayKey = new Date().toISOString().slice(0, 10);
                    const todayCount = scanStats.filter((s) => s.createdAt.slice(0, 10) === todayKey).length;
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    const weekCount = scanStats.filter((s) => new Date(s.createdAt) >= weekAgo).length;
                    return (
                      <>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] uppercase tracking-wide text-emerald-700">Today</span>
                          <span className="text-2xl font-bold text-emerald-950">{todayCount}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] uppercase tracking-wide text-emerald-700">Last 7 days</span>
                          <span className="text-lg font-semibold text-emerald-950">{weekCount}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </section>

            {/* Resident & guard breakdown pie chart */}
            <section>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-base font-semibold text-emerald-950 tracking-tight">Resident & Guard Mix</h2>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 border border-emerald-100">
                  Total approved: <span className="ml-1 text-emerald-900">{totalUsers}</span>
                </span>
              </div>
              <div className="rounded-2xl shadow border border-emerald-100 bg-white/80 p-4 flex flex-col md:flex-row gap-4 items-stretch">
                <div className="relative md:w-1/2 min-h-[220px] flex items-center justify-center">
                  {totalUsers > 0 && residentPieData ? (
                    <>
                      <DoughnutChart data={residentPieData} options={residentPieOptions} />
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase tracking-wide text-emerald-600">Total approved</span>
                        <span className="text-xl font-semibold text-emerald-950">{totalUsers}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-emerald-700 text-center px-4">
                      No approved main residents, dependants, or estate guards yet.
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between text-xs text-emerald-900 gap-3">
                  <p className="text-[11px] text-emerald-700">
                    See how your approved users split between primary households, their dependants, and on-site security.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3 rounded-lg bg-emerald-50/80 px-2.5 py-2">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-700" />
                        <div>
                          <p className="text-[11px] font-semibold text-emerald-900">Main residents</p>
                          <p className="text-[11px] text-emerald-700">
                            Primary household account holders with full estate access and control over invites.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                          {mainResidentShare}%
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-900">{mainResidentCount}</span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3 rounded-lg bg-emerald-50/60 px-2.5 py-2">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-green-500" />
                        <div>
                          <p className="text-[11px] font-semibold text-emerald-900">Dependants</p>
                          <p className="text-[11px] text-emerald-700">
                            Linked household members whose access is managed under a main resident.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-900">
                          {dependantShare}%
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-900">{dependantCount}</span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3 rounded-lg bg-sky-50 px-2.5 py-2">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                        <div>
                          <p className="text-[11px] font-semibold text-emerald-900">Estate guards</p>
                          <p className="text-[11px] text-emerald-700">
                            Security personnel responsible for scanning codes and controlling entry/exit.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-900">
                          {estateGuardShare}%
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-900">{estateGuardCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Users pending approval */}
            <section className="pb-6">
              <h2 className="text-base font-semibold mb-2 text-emerald-950 tracking-tight">Users Pending Approval</h2>
              <div className="overflow-x-auto rounded-xl shadow border border-blue-100 bg-white/80">
                  {/* Pending approvals list */}
                  <div className="space-y-4 rounded-2xl border border-emerald-50 bg-emerald-50/40 p-4 shadow-sm shadow-emerald-50/80">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-emerald-950">Pending approvals</h2>
                        <p className="text-xs text-emerald-700/80">
                          Last five residents and guards waiting for your review.
                        </p>
                      </div>
                      <Link
                        href="/admin/users"
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/60 px-2.5 py-1 text-[11px] font-medium text-emerald-800 shadow-sm hover:border-emerald-300 hover:text-emerald-900"
                      >
                        View all
                        <ArrowUpRightIcon className="h-3 w-3" />
                      </Link>
                    </div>

                    {data.recentUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-200 bg-white/60 px-4 py-6 text-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                          <CheckCircleIcon className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-medium text-emerald-900">No approvals waiting</p>
                        <p className="text-[11px] text-emerald-700/80">
                          You’re fully up to date. New requests will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white/70">
                        <div className="max-h-[260px] divide-y divide-emerald-50 overflow-y-auto">
                          {data.recentUsers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs transition hover:bg-emerald-50/80"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                  <UserCircleIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-medium text-emerald-950">
                                    {user.fullName || user.email || "Unnamed user"}
                                  </p>
                                  <p className="truncate text-[11px] text-emerald-700/80">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 text-right">
                                <span
                                  className={
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset " +
                                    (user.role === "ESTATE_GUARD"
                                      ? "bg-sky-50 text-sky-800 ring-sky-200"
                                      : user.role === "DEPENDANT"
                                      ? "bg-amber-50 text-amber-800 ring-amber-200"
                                      : "bg-emerald-50 text-emerald-800 ring-emerald-200")
                                  }
                                >
                                  {user.role === "ESTATE_GUARD"
                                    ? "Estate guard"
                                    : user.role === "DEPENDANT"
                                    ? "Dependant"
                                    : "Main resident"}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
                                  Requested {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            </section>
          </div>

          <aside className="mt-4 space-y-3 lg:mt-0">
            <div className="rounded-2xl shadow-md border border-emerald-100 bg-white p-4 h-full flex flex-col">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight mb-1">Real-time Activity</h2>
              <div className="flex items-center justify-between mb-3 gap-2">
                <p className="text-[11px] text-emerald-700">Latest check-ins and check-outs.</p>
                <div className="inline-flex rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-medium overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActivityFilter("all")}
                    className={`px-2 py-1 ${
                      activityFilter === "all" ? "bg-emerald-600 text-white" : "text-emerald-700"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter("in")}
                    className={`px-2 py-1 border-l border-emerald-100 ${
                      activityFilter === "in" ? "bg-emerald-600 text-white" : "text-emerald-700"
                    }`}
                  >
                    In
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter("out")}
                    className={`px-2 py-1 border-l border-emerald-100 ${
                      activityFilter === "out" ? "bg-emerald-600 text-white" : "text-emerald-700"
                    }`}
                  >
                    Out
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[440px] pr-1 text-xs">
                {activity.length === 0 ? (
                  <div className="text-emerald-800 text-[11px]">
                    No recent gate activity. New scans from guards will appear here in real time.
                  </div>
                ) : (
                  activity
                    .filter((item) => {
                      if (activityFilter === "all") return true;
                      const isOut = item.verb === "checked out";
                      return activityFilter === "out" ? isOut : !isOut;
                    })
                    .map((item) => {
                    const isOut = item.verb === "checked out";
                    const directionColor = isOut ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700";
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
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${directionColor}`}>
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
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }).replace("about ", "")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col max-w-[13rem]">
                            {item.residentId ? (
                              <button
                                type="button"
                                onClick={() => {
                                  router.push(`/admin/dashboard?residentId=${item.residentId}`);
                                }}
                                className="text-left text-[11px] font-medium text-emerald-900 hover:underline hover:underline-offset-2"
                              >
                                {item.residentName}
                              </button>
                            ) : (
                              <p className="text-[11px] text-emerald-900 font-medium">{item.residentName}</p>
                            )}
                            <p className="text-[10px] text-emerald-800">
                              {isOut ? "checked out" : "checked in"} via {methodLabel.toLowerCase()} at {item.accessLabel}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {/* <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${methodColor}`}>
                              {methodLabel}
                            </span> */}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900 text-emerald-50">
                              {item.accessLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

