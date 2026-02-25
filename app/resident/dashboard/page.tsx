"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FaUser, FaKey, FaClipboardList, FaBell, FaUserCircle, FaEnvelope } from "react-icons/fa";
import { signOut } from "next-auth/react"; // Import signOut for logout functionality

type Action = {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void; // Add optional onClick property
};

export default function ResidentDashboard() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [residentName, setResidentName] = useState<string>("");
  useEffect(() => {
    async function fetchProfile() {

      setLoading(true);
      const res = await fetch("/api/resident/profile");
      const data = await res.json();
      const canManageCodes = data?.profile?.canManageCodes;
      const canGenerateAdminCode = data?.profile?.canGenerateAdminCode;
      setResidentName(data?.profile?.fullName || "Resident");
      const isDependant = data?.profile?.role === "DEPENDANT"; // Check if the user is a dependant

      const baseActions = [
        canManageCodes && {
          href: "/resident/generate-code",
          label: "Generate Code",
          icon: <FaKey className="h-6 w-6 text-emerald-700" />,
        },
        canManageCodes && {
          href: "/resident/manage-codes",
          label: "Manage Codes",
          icon: <FaClipboardList className="h-6 w-6 text-emerald-700" />,
        },
        canGenerateAdminCode && {
          href: "/resident/generate-admin-code",
          label: "Generate Admin Code",
          icon: <FaKey className="h-6 w-6 text-red-700" />,
        },
        // {
        //   href: "/resident/invites",
        //   label: "My Invites",
        //   icon: <FaEnvelope className="h-6 w-6 text-blue-700" />,
        // },
        {
          href: "/resident/notifications",
          label: "Notifications",
          icon: <FaBell className="h-6 w-6 text-yellow-600" />,
        },
        !isDependant && {
          href: "/resident/dependants",
          label: "Dependants",
          icon: <FaUser className="h-6 w-6 text-purple-700" />,
        },
        {
          href: "/resident/support-tickets",
          label: "Support Tickets",
          icon: <FaEnvelope className="h-6 w-6 text-pink-700" />,
        },
        {
          href: "/resident/feedback",
          label: "Feedback",
          icon: <FaClipboardList className="h-6 w-6 text-orange-700" />,
        },
        {
          href: "/resident/estate-contacts",
          label: "Estate Contacts",
          icon: <FaUserCircle className="h-6 w-6 text-cyan-700" />,
        },
        {
          href: "/resident/profile",
          label: "Profile",
          icon: <FaUserCircle className="h-6 w-6 text-gray-700" />,
        },
        {
          href: "#",
          label: "Logout",
          icon: <FaUserCircle className="h-6 w-6 text-red-700" />,
          onClick: () => signOut({ callbackUrl: "/auth" }), // Redirect to login page after signing out
        },
      ].filter(Boolean);
      setActions(baseActions);
      setLoading(false);
    }
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center justify-start py-8 px-2">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-full p-3 shadow mb-2 border border-emerald-100 bg-white">
            <FaUser className="h-10 w-10 text-emerald-700" />
          </div>
          <h1 className="text-2xl font-extrabold text-emerald-900 mb-1 text-center tracking-tight">Welcome, {residentName}!</h1>
          <p className="text-gray-500 text-center text-base">Quick access to all your estate features</p>
        </div>
        {loading ? (
          <div className="text-center text-emerald-700">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {actions.map((action) => (
              action.label === "Logout" ? (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex items-center gap-3 p-4 rounded-xl shadow-md font-semibold text-lg border border-emerald-100 bg-white hover:bg-gray-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ) : (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-4 rounded-xl shadow-md font-semibold text-lg border border-emerald-100 bg-white hover:bg-gray-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </Link>
              )
            ))}
          </div>
        )}
        <div className="mt-10 text-xs text-gray-400 text-center">Estate Access App &copy; {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}
