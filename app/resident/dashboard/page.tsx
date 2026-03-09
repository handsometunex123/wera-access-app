"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaUser, FaKey, FaClipboardList, FaBell, FaUserCircle, FaEnvelope, FaMoneyBillWave } from "react-icons/fa";

type Action = {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
};

export default function ResidentDashboard() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [residentName, setResidentName] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [canManageCodes, setCanManageCodes] = useState(false);
  const [isMainResident, setIsMainResident] = useState(false);
  useEffect(() => {
    async function fetchProfile() {

      setLoading(true);
      const res = await fetch("/api/resident/profile");
      const data = await res.json();
      const manage = data?.profile?.canManageCodes;
      const canAdminCode = data?.profile?.canGenerateAdminCode;
      const role = data?.profile?.role as string | undefined;
      setResidentName(data?.profile?.fullName || "Resident");
      setProfileImage(data?.profile?.profileImage || null);
      const dependant = data?.profile?.role === "DEPENDANT";
      setCanManageCodes(Boolean(manage));
      setIsMainResident(role === "MAIN_RESIDENT");

      const baseActions = [
        manage && {
          href: "/resident/generate-code",
          label: "Generate Code",
          icon: <FaKey className="h-6 w-6 text-emerald-700" />,
        },
        manage && {
          href: "/resident/manage-codes",
          label: "Manage Codes",
          icon: <FaClipboardList className="h-6 w-6 text-emerald-700" />,
        },
        canAdminCode && {
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
        isMainResident && {
          href: "/resident/payment-requests",
          label: "Payment Requests",
          icon: <FaMoneyBillWave className="h-6 w-6 text-emerald-700" />,
        },
        !dependant && {
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
      ].filter(Boolean);
      setActions(baseActions);
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const describeAction = (label: string): string => {
    switch (label) {
      case "Generate Code":
        return "Create a fresh access code for guests.";
      case "Manage Codes":
        return "View, share or disable existing codes.";
      case "Generate Admin Code":
        return "Request a special code from the estate admin.";
      case "Payment Requests":
        return "Review bills and upload proof of payment.";
      case "Notifications":
        return "See estate-wide announcements and alerts.";
      case "Dependants":
        return "Manage access for family members or dependants.";
      case "Support Tickets":
        return "Raise and track issues with the estate team.";
      case "Feedback":
        return "Share suggestions to improve the estate experience.";
      case "Estate Contacts":
        return "Find key estate phone numbers and emails.";
      case "Profile":
        return "Review and update your personal details.";
      default:
        return "";
    }
  };
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 lg:gap-6 items-start">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center gap-4 md:border-r md:border-emerald-50 md:pr-4">
              <div className="rounded-full p-1 shadow border border-emerald-100 bg-white overflow-hidden w-20 h-20 flex items-center justify-center">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="rounded-full object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-14 w-14">
                    <FaUser className="h-14 w-14 text-emerald-700" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Welcome back</p>
                <h1 className="text-lg md:text-xl font-bold text-emerald-950 tracking-tight">{residentName}</h1>
                <p className="text-[12px] text-emerald-700 mt-1">
                  Your quick snapshot of estate access, guests and support.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 text-center text-emerald-700 shadow-sm">
              Loading your actions...
            </div>
          ) : (
            <section className="rounded-2xl border border-emerald-100 bg-white/95 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">Quick actions</p>
                  <p className="text-xs text-slate-500">Jump straight into the tools you use most.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5 text-sm text-emerald-950 shadow-sm hover:bg-emerald-50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                      {action.icon}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{action.label}</span>
                      {describeAction(action.label) && (
                        <span className="truncate text-[11px] text-emerald-800/80">
                          {describeAction(action.label)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600 mb-2">Shortcuts</p>
            <div className="flex flex-col gap-2 text-sm">
              {canManageCodes && (
                <Link href="/resident/manage-codes" className="inline-flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 hover:bg-emerald-100">
                  <span>View your active codes</span>
                  <FaKey className="h-4 w-4" />
                </Link>
              )}
              {isMainResident && (
                <Link href="/resident/payment-requests" className="inline-flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 hover:bg-emerald-100">
                  <span>View payment requests</span>
                  <FaMoneyBillWave className="h-4 w-4" />
                </Link>
              )}
              <Link href="/resident/notifications" className="inline-flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 hover:bg-emerald-100">
                <span>Check estate notifications</span>
                <FaBell className="h-4 w-4" />
              </Link>
              <Link href="/resident/support-tickets" className="inline-flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 hover:bg-emerald-100">
                <span>Contact support</span>
                <FaEnvelope className="h-4 w-4" />
              </Link>
              <Link href="/resident/profile" className="inline-flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 hover:bg-emerald-100">
                <span>View your profile</span>
                <FaUserCircle className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <div className="mt-2 text-[11px] text-slate-400 text-center">
        Estate Access App &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
