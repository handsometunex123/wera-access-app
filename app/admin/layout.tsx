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
  return (
    <SessionProvider>
      <div className="flex flex-col min-h-screen h-screen w-full">
        {/* Header */}
        <header className="w-full bg-white border-b border-gray-200 flex items-center justify-between px-8 py-4 shadow-sm z-10 flex-shrink-0">
          <div className="text-xl font-bold text-emerald-800 tracking-tight">Admin Panel</div>
          <div className="flex items-center gap-4">
            <UserProfileSection />
          </div>
        </header>
        <div className="flex flex-1 min-h-0 h-0">
          {/* Sidebar */}
          <aside className="w-56 bg-gray-900 text-white flex flex-col py-6 px-4 overflow-y-auto flex-shrink-0">
            <SidebarLinks />
          </aside>
          {/* Main content */}
          <main className="flex-1 bg-gray-50 p-8 overflow-auto h-full">{children}</main>
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="relative w-full max-w-xl mx-auto">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 text-2xl font-bold bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
          onClick={onClose}
          aria-label="Close profile modal"
        >
          &times;
        </button>
        <div className="bg-white rounded-2xl shadow-lg p-0">
          <AdminProfilePage />
        </div>
      </div>
    </div>
  );
}

