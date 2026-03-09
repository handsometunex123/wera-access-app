"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  KeyIcon,
  LifebuoyIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import SessionProvider from "../SessionProvider";

type GuardLink = {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const guardLinks: GuardLink[] = [
  { href: "/estate-guard/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/estate-guard/scan-qr", label: "Scan QR", icon: KeyIcon },
  { href: "/estate-guard/verify-code", label: "Verify Code", icon: KeyIcon },
  { href: "/estate-guard/scan-logs", label: "Scan Logs", icon: LifebuoyIcon },
  { href: "/estate-guard/profile", label: "Profile", icon: UserCircleIcon },
];

export default function EstateGuardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
              <GuardProfileSection />
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            {/* Sidebar (desktop) */}
            <aside className="hidden h-full w-64 flex-shrink-0 flex-col overflow-y-auto border-r border-emerald-900/30 bg-slate-950 text-slate-100 shadow-xl shadow-emerald-950/25 md:flex">
              <div className="flex flex-col gap-6 px-4 py-5 pb-8">
                <div className="px-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">Wera</p>
                  <p className="mt-1 text-sm font-semibold text-slate-50">Guard portal</p>
                  <p className="text-[11px] text-slate-400">Monitor entries, exits and scans.</p>
                </div>
                <GuardSidebarLinks />
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
                  <span className="text-sm font-semibold text-white">Guard portal</span>
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
                <GuardSidebarLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </SessionProvider>
  );
}

function GuardSidebarLinks({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 text-sm">
      <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Navigation
      </p>
      {guardLinks.map((link) => {
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

function GuardProfileSection() {
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
      .slice(0, 2) || "G";

  const handleSignOut = () => signOut({ callbackUrl: "/auth" });

  return (
    <>
      <button
        className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-900 shadow-sm hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        onClick={() => router.push("/estate-guard/profile")}
        aria-label="Open guard profile"
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
