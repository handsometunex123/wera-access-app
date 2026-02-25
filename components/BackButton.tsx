"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <div>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold text-sm px-3 py-1 rounded-lg border border-emerald-100 bg-white shadow-sm transition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
        </button>
    </div>
  );
}