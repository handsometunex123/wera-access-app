"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Import usePathname to get the current URL
import { signOut } from "next-auth/react"; // Import signOut for logout functionality

interface SessionUser {
  id?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  fullName?: string | null; // Add fullName to the user type
}

const MENUS = [
  { label: "Dashboard", href: "/estate-guard/dashboard" },
  { label: "Scan Logs", href: "/estate-guard/scan-logs" },
  { label: "Scan QR", href: "/estate-guard/scan-qr" },
  { label: "Verify Code", href: "/estate-guard/verify-code" },
  { label: "Profile", href: "/estate-guard/profile" },
];

export default function Header() {
  const [navOpen, setNavOpen] = useState(false);
  const { data: session } = useSession();
  const user = (session?.user ?? {}) as SessionUser;
  const pathname = usePathname(); // Get the current URL path
  const [fullName, setFullName] = useState(user.fullName || ""); // State for fullName

  useEffect(() => {
    async function fetchFullName() {
      if (!user.id || user.fullName) return; // Skip if user ID is missing or fullName already exists
      try {
        const res = await fetch(`/api/estate-guard/user-details?id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setFullName(data.user.fullName || "Guard");
        } else {
          console.error("Failed to fetch user fullName");
        }
      } catch (error) {
        console.error("Error fetching user fullName:", error);
      }
    }

    fetchFullName();
  }, [user.id, user.fullName]);

  return (
    <header className="w-full bg-gradient-to-r from-emerald-100 to-white border-b border-emerald-200 shadow-md fixed top-0 left-0 z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-emerald-50 focus:outline-none"
            aria-label="Open navigation menu"
            onClick={() => setNavOpen((v) => !v)}
          >
            <svg className="w-8 h-8 text-emerald-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-2xl font-bold text-emerald-900 tracking-tight hidden md:block">WERA Portal</span>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-emerald-800 font-medium text-lg md:text-xl">{fullName || "Guard"}</span>
            <Link href="/estate-guard/profile">
              <Image
                src={user.image || "/avatar-placeholder.svg"}
                alt="Profile"
                width={48}
                height={48}
                className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-lg hover:ring-2 hover:ring-emerald-600 transition-transform transform hover:scale-105 object-cover"
                priority
              />
            </Link>
            <button
              onClick={() => signOut()}
              className="text-emerald-700 font-semibold px-4 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 transition-all"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity md:hidden ${
          navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setNavOpen(false)}
      ></div>
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform md:hidden ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-emerald-200">
          <span className="text-xl font-bold text-emerald-900">Menu</span>
          <button
            className="p-2 rounded-lg hover:bg-emerald-50 focus:outline-none"
            aria-label="Close navigation menu"
            onClick={() => setNavOpen(false)}
          >
            <svg
              className="w-6 h-6 text-emerald-700"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-4 p-4">
          {MENUS.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className={`text-emerald-700 font-semibold px-4 py-2 rounded-lg transition-all ${
                pathname === menu.href
                  ? "bg-emerald-200 text-emerald-900"
                  : "hover:bg-emerald-100"
              }`}
              onClick={() => setNavOpen(false)}
            >
              {menu.label}
            </Link>
          ))}
        </div>
      </nav>
      <nav
        className={`md:flex md:gap-8 md:items-center md:justify-center w-full py-2 bg-emerald-50 border-t border-emerald-200 hidden ${
          navOpen ? "block" : ""
        }`}
      >
        {MENUS.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className={`text-emerald-700 font-semibold px-5 py-2 rounded-lg transition-all ${
              pathname === menu.href ? "bg-emerald-200 text-emerald-900" : "hover:bg-emerald-100"
            }`}
          >
            {menu.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
