"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/access-codes", label: "Access Codes" },
  { href: "/admin/generate-code", label: "Generate Code" },
  { href: "/admin/pending-users", label: "Pending Users" },
  { href: "/admin/profile-update-requests", label: "Profile Updates" },
  { href: "/admin/support-tickets", label: "Support Tickets" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/payment-requests", label: "Payments" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
  { href: "/admin/rejected-residents", label: "Rejected Residents" },
];

const AdminProfilePage = dynamic(() => import("./profile"), { ssr: false });


import SessionProvider from "../SessionProvider";


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <SessionProvider>
      <div className="flex flex-col min-h-screen h-screen w-full">
        {/* Header */}
        <header className="w-full bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded bg-gray-100 hover:bg-gray-200"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-800" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-xl font-bold text-emerald-800 tracking-tight">Admin Panel</div>
          </div>
          <div className="flex items-center gap-4">
            <UserProfileSection />
          </div>
        </header>
        <div className="flex flex-1 min-h-0 h-0">
          {/* Sidebar (desktop) */}
          <aside className="hidden md:flex w-56 bg-gray-900 text-white flex-col py-6 px-4 overflow-y-auto flex-shrink-0">
            <SidebarLinks />
          </aside>
          {/* Main content */}
          <main className="flex-1 bg-gray-50 p-4 md:p-8 overflow-auto h-full">{children}</main>
        </div>

        {/* Mobile menu slide-over */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setMobileOpen(false)} />
            <div className="relative w-64 max-w-full h-full bg-gray-900 text-white shadow-xl p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold">Admin</div>
                <button className="p-2 rounded bg-gray-800 hover:bg-gray-700" onClick={() => setMobileOpen(false)} aria-label="Close menu">×</button>
              </div>
              <SidebarLinks />
            </div>
          </div>
        )}
      </div>
    </SessionProvider>
  );
}

function SidebarLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-2 mt-8">
      {adminLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded px-3 py-2 transition-colors ${
            (pathname || "").startsWith(link.href)
              ? "bg-gray-700 text-white font-semibold"
              : "hover:bg-gray-800 text-gray-200"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function UserProfileSection() {
  const { data: session } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const handleSignOut = () => signOut({ callbackUrl: "/auth" });
  if (!user) return null;
  return (
    <>
      <button
        className="font-semibold text-emerald-900 hover:underline focus:underline outline-none bg-transparent border-none cursor-pointer"
        onClick={() => setOpen(true)}
        aria-label="Open profile modal"
      >
        {user.email}
      </button>
      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-emerald-700 text-white rounded font-semibold hover:bg-emerald-800 transition"
      >
        Log out
      </button>
      {open && (
        <ProfileModal onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  // Modal overlay and content
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2">
      <div className="relative w-full max-w-sm md:max-w-xl mx-auto">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 text-xl font-bold bg-white rounded-full w-9 h-9 flex items-center justify-center shadow"
          onClick={onClose}
          aria-label="Close profile modal"
        >
          &times;
        </button>
        <div className="bg-white rounded-xl shadow-lg p-3 md:p-6">
          <AdminProfilePage />
        </div>
      </div>
    </div>
  );
}

