"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Bars3Icon, XMarkIcon, HomeIcon, KeyIcon, UserGroupIcon, BellAlertIcon, LifebuoyIcon, ChatBubbleBottomCenterTextIcon, PhoneArrowDownLeftIcon, UserCircleIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import SessionProvider from "../SessionProvider";

type ResidentLink = {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  requiresAdminCodePermission?: boolean;
};

const residentLinks: ResidentLink[] = [
  { href: "/resident/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/resident/generate-code", label: "Generate Code", icon: KeyIcon },
  { href: "/resident/manage-codes", label: "Manage Codes", icon: KeyIcon },
  { href: "/resident/generate-admin-code", label: "Generate Admin Code", icon: KeyIcon, requiresAdminCodePermission: true },
  { href: "/resident/dependants", label: "Dependants", icon: UserGroupIcon },
  { href: "/resident/notifications", label: "Notifications", icon: BellAlertIcon },
  { href: "/resident/support-tickets", label: "Support Tickets", icon: LifebuoyIcon },
  { href: "/resident/feedback", label: "Feedback", icon: ChatBubbleBottomCenterTextIcon },
  { href: "/resident/estate-contacts", label: "Estate Contacts", icon: PhoneArrowDownLeftIcon },
  { href: "/resident/profile", label: "Profile", icon: UserCircleIcon },
  { href: "/resident/payment-requests", label: "Payment Requests", icon: BanknotesIcon },
];

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; subtitle?: string; createdAt: string; type: string }[]
  >([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationsLoadedOnce, setNotificationsLoadedOnce] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  async function loadNotifications() {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const res = await fetch("/api/resident/notifications?page=1&pageSize=10");
      if (!res.ok) {
        setNotificationsError("Unable to load notifications");
        return;
      }
      const data = (await res.json()) as {
        notifications?: { id: string; title: string; subtitle?: string; createdAt: string; type: string }[];
      };
      const items = (data.notifications ?? []).slice(0, 10);
      setNotifications(items);
      setNotificationsLoadedOnce(true);
      setUnreadCount(items.length);
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

    setUnreadCount(0);
  }

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
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Resident
                </span>
                <span className="text-sm font-semibold text-emerald-950 md:text-base">Your estate space</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 ml-auto">
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-800 shadow-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  aria-label="Resident notifications"
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
                          Resident alerts
                        </span>
                        <span className="text-xs text-slate-500">Latest updates from your estate.</span>
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
                        <div className="text-xs text-slate-500">No notifications yet.</div>
                      )}
                      {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                        <ul className="space-y-2">
                          {notifications.map((n) => (
                            <li
                              key={n.id}
                              className="flex items-start gap-2 rounded-lg bg-emerald-50/60 px-2.5 py-2"
                            >
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                              <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-xs font-medium text-emerald-950">{n.title}</span>
                                {n.subtitle && (
                                  <span className="truncate text-[11px] text-emerald-800">{n.subtitle}</span>
                                )}
                                <span className="text-[11px] text-emerald-700/80">
                                  {new Date(n.createdAt).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <span className="ml-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                                {n.type}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-emerald-50 px-3 py-2">
                      <span className="text-[11px] text-slate-500">
                        Showing latest {notifications.length} of 10
                      </span>
                      <Link
                        href="/resident/notifications"
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        View all
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <ResidentProfileSection />
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            {/* Sidebar (desktop) */}
            <aside className="hidden h-full w-64 flex-shrink-0 flex-col overflow-y-auto border-r border-emerald-900/30 bg-slate-950 text-slate-100 shadow-xl shadow-emerald-950/25 md:flex">
              <div className="flex flex-col gap-6 px-4 py-5 pb-8">
                <div className="px-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">Wera</p>
                  <p className="mt-1 text-sm font-semibold text-slate-50">Resident portal</p>
                  <p className="text-[11px] text-slate-400">Manage your access, guests & support.</p>
                </div>
                <ResidentSidebarLinks />
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
                  <span className="text-sm font-semibold text-white">Resident portal</span>
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
                <ResidentSidebarLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </SessionProvider>
  );
}

function ResidentSidebarLinks({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();

  const [canGenerateAdminCode, setCanGenerateAdminCode] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      try {
        const res = await fetch("/api/resident/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        if (!cancelled) {
          setCanGenerateAdminCode(Boolean(data?.profile?.canGenerateAdminCode));
          setRole(data?.profile?.role ?? null);
        }
      } catch {
        if (!cancelled) {
          setCanGenerateAdminCode(false);
          setRole(null);
        }
      }
    }
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleLinks = residentLinks.filter((link) => {
    if ((link as { requiresAdminCodePermission?: boolean }).requiresAdminCodePermission) {
      return !!canGenerateAdminCode;
    }
    if (link.href === "/resident/payment-requests") {
      return role === "MAIN_RESIDENT";
    }
    return true;
  });

  return (
    <nav className="flex flex-col gap-1 text-sm">
      <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Navigation
      </p>
      {visibleLinks.map((link) => {
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

function ResidentProfileSection() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  if (!user) return null;
  const displayName = user.name || user.email || "";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "R";

  const handleSignOut = () => signOut({ callbackUrl: "/auth" });

  return (
    <>
      <button
        className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-900 shadow-sm hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        onClick={() => router.push("/resident/profile")}
        aria-label="Open resident profile"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-semibold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[150px] truncate sm:inline">{displayName}</span>
      </button>
      <button
        onClick={handleSignOut}
        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-50 shadow-sm hover:bg-slate-800 inline-flex"
      >
        Log out
      </button>
    </>
  );
}
