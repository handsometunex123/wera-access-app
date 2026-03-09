"use client";

import Link from "next/link";

export default function ResidentBackToDashboard() {
  return (
    <Link
      href="/resident/dashboard"
      className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-medium text-sm"
      aria-label="Back to dashboard"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      Back to dashboard
    </Link>
  );
}
