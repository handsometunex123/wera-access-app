"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useNotify } from "@/components/useNotify";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
  UsersIcon,
  EnvelopeOpenIcon,
  KeyIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
  LifebuoyIcon,
  BellAlertIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import SessionProvider from "../SessionProvider";
import AdminResidentModal from "@/components/AdminResidentModal";

const AdminProfilePage = dynamic(() => import("./profile"), { ssr: false });

type AdminLink = {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type HeaderNotification = {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

const adminLinks: AdminLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Squares2X2Icon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/invites", label: "Invites", icon: EnvelopeOpenIcon },
  { href: "/admin/access-codes", label: "Access Codes", icon: KeyIcon },
  { href: "/admin/admin-code-approvals", label: "Admin Code Approvals", icon: ShieldCheckIcon },
  { href: "/admin/generate-code", label: "Generate Code", icon: SparklesIcon },
  { href: "/admin/profile-update-requests", label: "Profile Updates", icon: UserCircleIcon },
  { href: "/admin/support-tickets", label: "Support Tickets", icon: LifebuoyIcon },
  { href: "/admin/notifications", label: "Notifications", icon: BellAlertIcon },
  { href: "/admin/payment-requests", label: "Payments", icon: BanknotesIcon },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardDocumentListIcon },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationsLoadedOnce, setNotificationsLoadedOnce] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerSelectedNotification, setHeaderSelectedNotification] = useState<HeaderNotification | null>(null);
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; fullName?: string | null; email?: string | null }[]
  >([]);
  const residentId = searchParams?.get("residentId");
  const residentModalOpen = Boolean(residentId);

  async function runUserSearch(term: string, signal?: AbortSignal) {
    const trimmed = term.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    try {
      const params = new URLSearchParams({ page: "1", pageSize: "10" });
      const res = await fetch(`/api/admin/users?${params.toString()}`, signal ? { signal } : {});
      const d = await res.json();
      if (res.ok && Array.isArray(d.users)) {
        const lower = trimmed.toLowerCase();
        const filtered = d.users.filter(
          (u: { fullName?: string | null; email?: string | null }) =>
            (u.fullName || "").toLowerCase().includes(lower) ||
            (u.email || "").toLowerCase().includes(lower),
        );
        setSearchResults(filtered.slice(0, 5));
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    if (!searchTerm.trim()) {
      setSearchResults([]);
      return () => {
        controller.abort();
      };
    }

    const timeout = setTimeout(async () => {
      await runUserSearch(searchTerm, controller.signal);
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchTerm]);

  async function loadNotifications() {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const res = await fetch("/api/admin/notifications?page=1");
      if (!res.ok) {
        setNotificationsError("Unable to load notifications");
        return;
      }
      const data = (await res.json()) as {
        notifications?: { id: string; message: string; createdAt: string; read?: boolean }[];
      };
      const items: HeaderNotification[] = (data.notifications ?? []).slice(0, 10).map((n) => ({
        id: n.id,
        message: n.message ?? "",
        createdAt: n.createdAt,
        read: Boolean(n.read) === true,
      }));
      setNotifications(items);
      setNotificationsLoadedOnce(true);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch {
      setNotificationsError("Network error loading notifications");
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function toggleNotifications() {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);

    if (!nextOpen) return;

    if (!notificationsLoadedOnce) {
      await loadNotifications();
    }
  }

  async function setHeaderNotificationRead(id: string, read: boolean) {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read } : n));
      setUnreadCount(updated.filter((n) => !n.read).length);
      return updated;
    });

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read }),
      });
      if (!res.ok) {
        // On failure, reload to keep things consistent
        await loadNotifications();
      }
    } catch {
      await loadNotifications();
    }
  }

  function openHeaderNotification(n: HeaderNotification) {
    setHeaderSelectedNotification(n);
    setHeaderModalOpen(true);
    if (!n.read) {
      void setHeaderNotificationRead(n.id, true);
    }
  }

  function closeHeaderModal() {
    setHeaderModalOpen(false);
    setHeaderSelectedNotification(null);
  }

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    if (!notificationsOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  // Optionally pre-load notifications in the background so count is accurate in the badge
  useEffect(() => {
    if (!notificationsLoadedOnce) {
      void loadNotifications();
    }
  }, [notificationsLoadedOnce]);

  return (
    <SessionProvider>
      <div className="flex min-h-screen w-full bg-slate-950/5">
        <div className="flex max-h-screen flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-emerald-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur md:px-6 md:py-3.5">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 hidden md:block">
                  Admin
                </span>
                <span className="text-sm font-semibold text-emerald-950 hidden md:block md:text-base">
                  Estate control center
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 ml-auto">
              <div className="relative w-40 xs:w-56 sm:w-64 md:w-72 lg:w-80 transition-all duration-300 ease-out focus-within:w-52 xs:focus-within:w-60 sm:focus-within:w-72 md:focus-within:w-80 lg:focus-within:w-96 max-w-full">
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                      if (searchTerm.trim()) {
                        void runUserSearch(searchTerm);
                      }
                    }}
                    placeholder="Search residents / guards..."
                    className="w-full rounded-full border border-emerald-100 bg-white px-7 py-1.5 text-[11px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setSearchResults([]);
                      }}
                      className="absolute right-2.5 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      aria-label="Clear search"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {searchResults.filter((u) => u.id).length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-emerald-100 bg-white shadow-lg text-xs">
                    {searchResults
                      .filter((u) => u.id)
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSearchTerm("");
                            setSearchResults([]);
                            router.push(`${pathname}?residentId=${u.id}`);
                          }}
                          className="flex w-full flex-col px-3 py-2 text-left hover:bg-emerald-50"
                        >
                          <span className="font-semibold text-emerald-900">{u.fullName}</span>
                          <span className="text-[11px] text-emerald-700">{u.email}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-800 shadow-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  aria-label="Admin notifications"
                >
                  <BellAlertIcon className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="fixed inset-x-3 top-16 z-30 rounded-xl border border-emerald-100 bg-white/95 shadow-lg shadow-emerald-900/10 backdrop-blur-sm sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
                    <div className="flex items-center justify-between border-b border-emerald-50 px-3 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                          Admin alerts
                        </span>
                        <span className="text-xs text-slate-500">Latest actions that need your eye.</span>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto px-3 py-2.5">
                      {notificationsLoading && (
                        <div className="space-y-2 text-xs text-slate-500">
                          <div className="h-2.5 w-40 rounded-full bg-slate-100" />
                          <div className="h-2.5 w-32 rounded-full bg-slate-100" />
                          <div className="h-2.5 w-52 rounded-full bg-slate-100" />
                        </div>
                      )}
                      {!notificationsLoading && notificationsError && (
                        <div className="text-xs font-medium text-red-600">{notificationsError}</div>
                      )}
                      {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                        <div className="text-xs text-slate-500">No admin notifications yet.</div>
                      )}
                      {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                        <ul className="space-y-2">
                          {notifications
                            .slice()
                            .sort((a, b) => {
                              if (a.read === b.read) {
                                return (
                                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                );
                              }
                              return a.read ? 1 : -1;
                            })
                            .map((n) => (
                            <li key={n.id}>
                              <button
                                type="button"
                                onClick={() => openHeaderNotification(n)}
                                className={
                                  "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition " +
                                  (n.read
                                    ? "bg-white hover:bg-emerald-50"
                                    : "bg-emerald-50/60 hover:bg-emerald-100/80")
                                }
                              >
                                <span
                                  className={
                                    "mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full " +
                                    (n.read ? "bg-emerald-300" : "bg-emerald-500")
                                  }
                                />
                                <div className="flex min-w-0 flex-1 flex-col">
                                  <span
                                    className={
                                      "truncate text-xs font-medium text-emerald-950 " +
                                      (n.read ? "" : "blur-sm select-none")
                                    }
                                  >
                                    {n.message}
                                  </span>
                                  <span className="text-[11px] text-emerald-700/80">
                                    {new Date(n.createdAt).toLocaleString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-emerald-50 px-3 py-2">
                      <span className="text-[11px] text-slate-500">
                        Showing {notifications.filter((n) => !n.read).length} unread of 10
                      </span>
                      <Link
                        href="/admin/notifications"
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        View all
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <UserProfileSection />
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            {/* Sidebar (desktop) */}
            <aside className="hidden h-full w-64 flex-shrink-0 flex-col overflow-y-auto border-r border-emerald-900/30 bg-slate-950 text-slate-100 shadow-xl shadow-emerald-950/25 md:flex">
              <div className="flex flex-col gap-6 px-4 py-5 pb-8">
                <div className="px-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">Wera</p>
                  <p className="mt-1 text-sm font-semibold text-slate-50">Admin console</p>
                  <p className="text-[11px] text-slate-400">Manage residents, codes & security.</p>
                </div>
                <SidebarLinks />
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto bg-slate-50/80 p-4 md:p-8">{children}</main>
          </div>
        </div>

        {/* Mobile menu slide-over */}
        {mobileOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative flex h-full w-72 max-w-full flex-col border-r border-emerald-900/40 bg-slate-950 text-slate-50 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                    Wera
                  </span>
                  <span className="text-sm font-semibold text-white">Admin console</span>
                </div>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-5 pb-8">
                <SidebarLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          </div>
        )}
        <AdminResidentModal
          key={residentId ?? "none"}
          open={residentModalOpen}
          userId={residentId ?? null}
          onClose={() => {
            if (!pathname) return;
            router.replace(pathname);
          }}
        />
        {headerModalOpen && headerSelectedNotification && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-950">Admin notification</h3>
                  <p className="text-[11px] text-emerald-700">
                    {new Date(headerSelectedNotification.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeHeaderModal}
                  className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  Close
                </button>
              </div>
              <div className="rounded-xl bg-emerald-50/60 p-3">
                <p className="text-[11px] text-emerald-900 whitespace-pre-wrap break-words">
                  {headerSelectedNotification.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SessionProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-emerald-800">Loading admin console...</div>}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}

function SidebarLinks({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 text-sm">
      <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Navigation
      </p>
      {adminLinks.map((link) => {
        const Icon = link.icon;
        const active = (pathname || "").startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => {
              if (onNavigate) onNavigate();
            }}
            className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors ${
              active
                ? "bg-emerald-500/15 text-emerald-50 ring-1 ring-inset ring-emerald-400/50 shadow-sm shadow-emerald-900/40"
                : "text-slate-200 hover:bg-slate-800/70 hover:text-white"
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-medium ${
                active
                  ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                  : "border-slate-700 bg-slate-900/60 text-slate-300 group-hover:border-emerald-500/40 group-hover:text-emerald-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="truncate">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserProfileSection() {
  const { data: session } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const notify = useNotify();
  const handleSignOut = () => signOut({ callbackUrl: "/auth" });

  // Realtime push for new admin code approval notifications (no polling)
  useEffect(() => {
    if (!supabaseClient) return;

    const channel = supabaseClient
      .channel("admin-notifications")
      .on("broadcast", { event: "admin_code_request" }, (event: { payload?: unknown }) => {
        const payload = event.payload as { message?: string } | undefined;
        if (!payload?.message) return;
        notify(payload.message, "info", { duration: 4000 });
      });

    void channel.subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [notify]);

  if (!user) return null;

  const displayName = user.name || user.email || "";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "A";

  return (
    <>
      <button
        className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-900 shadow-sm hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        onClick={() => setOpen(true)}
        aria-label="Open profile modal"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-semibold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[150px] truncate sm:inline">{user.email}</span>
      </button>
      <button
        onClick={handleSignOut}
        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-50 shadow-sm hover:bg-slate-800 inline-flex"
      >
        Log out
      </button>
      {open && <ProfileModal onClose={() => setOpen(false)} />}
    </>
  );
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
      <div className="relative mx-auto w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:max-w-xl sm:p-6">
        <button
          type="button"
          className="absolute right-3 top-3 text-lg text-emerald-900"
          onClick={onClose}
          aria-label="Close profile modal"
        >
          &times;
        </button>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Admin profile</h2>
          <p className="text-[11px] text-emerald-700">View and update your administrator account details.</p>
        </div>
        <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 px-3 py-3 sm:px-4">
          <AdminProfilePage />
        </div>
      </div>
    </div>,
    document.body,
  );
}
