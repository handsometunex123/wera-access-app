"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaClipboardList, FaKey, FaQrcode, FaUserCircle, FaCheckCircle } from "react-icons/fa";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import QrScanner from "../QrScanner";

type Action = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

interface SessionUser {
  id?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
}

interface AdminCodeDetails {
  code: string;
  type: string;
  qrCodeUrl: string | null;
  purpose: string | null;
  itemDetails: string | null;
  itemImageUrl: string | null;
  residentName: string;
  residentAddress: string | null;
}

export default function EstateGuardDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = (session?.user ?? {}) as SessionUser;

  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardName, setGuardName] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [scanCode, setScanCode] = useState("");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [isAdminCode, setIsAdminCode] = useState<boolean | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [adminDetails, setAdminDetails] = useState<AdminCodeDetails | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      signIn(undefined, { callbackUrl: "/estate-guard/dashboard" });
      return;
    }
    if (user.role !== "ESTATE_GUARD") {
      router.replace("/auth");
    }
  }, [session, status, router, user.role]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user.id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/estate-guard/user-details?id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setGuardName(data?.user?.fullName || "Guard");
          setProfileImage(data?.user?.profileImage || null);
        } else {
          setGuardName(user.name || "Guard");
        }
      } catch {
        setGuardName(user.name || "Guard");
      }

      const baseActions: Action[] = [
        {
          href: "/estate-guard/scan-qr",
          label: "Scan QR",
          icon: <FaQrcode className="h-6 w-6 text-emerald-700" />,
        },
        {
          href: "/estate-guard/verify-code",
          label: "Verify Code",
          icon: <FaKey className="h-6 w-6 text-emerald-700" />,
        },
        {
          href: "/estate-guard/scan-logs",
          label: "Scan Logs",
          icon: <FaClipboardList className="h-6 w-6 text-emerald-700" />,
        },
        {
          href: "/estate-guard/profile",
          label: "Profile",
          icon: <FaUserCircle className="h-6 w-6 text-emerald-700" />,
        },
      ];

      setActions(baseActions);
      setLoading(false);
    }

    if (session && user.role === "ESTATE_GUARD") {
      void fetchProfile();
    }
  }, [session, user.id, user.name, user.role]);

  if (status === "loading") {
    return <div className="flex min-h-[200px] items-center justify-center text-emerald-700">Loading...</div>;
  }

  if (!session || user.role !== "ESTATE_GUARD") {
    return null;
  }

  async function verifyCode(code: string) {
    if (!code || code.length !== 6) {
      setScanError("Please enter a 6-digit code.");
      return;
    }
    setVerifying(true);
    setScanResult(null);
    setScanError(null);
    setIsAdminCode(null);
    setAdminDetails(null);
    setShowAdminModal(false);

    try {
      const res = await fetch("/api/estate-guard/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setScanResult(data.message || "Code verified successfully.");
        setIsAdminCode(Boolean(data.isAdminCode));
        setScanCode("");
        if (data.codeDetails) {
          setAdminDetails({
            code: data.codeDetails.code,
            type: data.codeDetails.type,
            qrCodeUrl: data.codeDetails.qrCodeUrl ?? null,
            purpose: data.codeDetails.purpose ?? null,
            itemDetails: data.codeDetails.itemDetails ?? null,
            itemImageUrl: data.codeDetails.itemImageUrl ?? null,
            residentName: data.codeDetails.residentName,
            residentAddress: data.codeDetails.residentAddress ?? null,
          });
          setShowAdminModal(true);
        }
      } else {
        setScanError(data.error || "Verification failed.");
      }
    } catch {
      setScanError("Network error. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    void verifyCode(scanCode.trim());
  }

  function handleQrScan(data: string) {
    if (!data) return;
    let code: string | null = null;
    const match = data.match(/\b\d{6}\b/);
    if (match) {
      code = match[0];
    } else if (/^\d{6}$/.test(data.trim())) {
      code = data.trim();
    }

    if (!code) {
      setScanError("QR does not contain a valid 6-digit code.");
      setShowScanner(false);
      return;
    }
    setScanCode(code);
    void verifyCode(code);
    setShowScanner(false);
  }

  function handleQrError(err?: unknown) {
    const message =
      err && typeof err === "object" && "name" in err && (err as { name?: string }).name === "AbortError"
        ? "Unable to access camera. Check browser permissions and that no other app is using the camera, then try again."
        : "QR scan failed. Try again.";
    setScanError(message);
    setShowScanner(false);
  }

  const describeAction = (label: string): string => {
    switch (label) {
      case "Scan QR":
        return "Open the scanner to read guest QR codes.";
      case "Verify Code":
        return "Manually verify a 6-digit access code.";
      case "Scan Logs":
        return "Review recent entries, exits and scan history.";
      case "Profile":
        return "Review and update your guard profile.";
      default:
        return "";
    }
  };

  const isCheckout = (scanResult ?? "").toLowerCase().includes("checked out");

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
                    <FaUserCircle className="h-14 w-14 text-emerald-700" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Welcome back</p>
                <h1 className="text-lg md:text-xl font-bold text-emerald-950 tracking-tight">{guardName}</h1>
                <p className="text-[12px] text-emerald-700 mt-1">
                  Your quick snapshot of gate activity, scans and checks.
                </p>
              </div>
            </div>
          </div>

          {/* Inline scan & verify tools */}
          <section className="rounded-2xl border border-emerald-100 bg-white/95 p-4 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                  Scan & verify
                </p>
                <p className="text-xs text-slate-500">
                  Use your camera or enter a code directly from here.
                </p>
              </div>
            </div>

            {scanError && (
              <div className="rounded-xl border px-3 py-2 text-xs md:text-sm flex items-start gap-2 bg-slate-50">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-red-500" />
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-red-700 font-medium">{scanError}</span>
                </div>
                <button
                  type="button"
                  className="text-[10px] text-slate-500 hover:text-slate-700"
                  onClick={() => {
                    setScanResult(null);
                    setScanError(null);
                    setIsAdminCode(null);
                    setAdminDetails(null);
                    setShowAdminModal(false);
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Scan QR
                </p>
                <p className="text-[11px] text-emerald-800/90">
                  Point your camera at the guest&apos;s QR code. We&apos;ll pick the 6-digit code and verify it.
                </p>
                {!showScanner && (
                  <button
                    type="button"
                    className="mt-1 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                    onClick={() => {
                      setScanError(null);
                      setScanResult(null);
                      setIsAdminCode(null);
                      setShowScanner(true);
                    }}
                  >
                    Scan QR Code
                  </button>
                )}
                {showScanner && (
                  <div className="mt-2 rounded-lg border border-emerald-100 bg-white overflow-hidden">
                    <QrScanner
                      onScan={handleQrScan}
                      onError={handleQrError}
                      onCancel={() => setShowScanner(false)}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-emerald-100 bg-slate-50/60 p-3 flex flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                  Enter code manually
                </p>
                <form onSubmit={handleManualSubmit} className="flex flex-col gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={scanCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setScanCode(value);
                      if (value.length === 6 && !verifying) {
                        void verifyCode(value);
                      }
                    }}
                    className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono tracking-[0.3em] text-center"
                    placeholder="••••••"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={verifying || scanCode.length !== 6}
                    >
                      {verifying ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-3 w-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                          <span>Verifying...</span>
                        </span>
                      ) : (
                        "Verify"
                      )}
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setScanCode("");
                        setScanResult(null);
                        setScanError(null);
                        setIsAdminCode(null);
                        setAdminDetails(null);
                        setShowAdminModal(false);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 text-center text-emerald-700 shadow-sm">
              Loading your guard tools...
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
              <Link
                href="/estate-guard/scan-qr"
                className="inline-flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 hover:bg-emerald-100"
              >
                <span>Open QR scanner</span>
                <FaQrcode className="h-4 w-4" />
              </Link>
              <Link
                href="/estate-guard/verify-code"
                className="inline-flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 hover:bg-emerald-100"
              >
                <span>Verify access code</span>
                <FaKey className="h-4 w-4" />
              </Link>
              <Link
                href="/estate-guard/scan-logs"
                className="inline-flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 hover:bg-emerald-100"
              >
                <span>View scan logs</span>
                <FaClipboardList className="h-4 w-4" />
              </Link>
              <Link
                href="/estate-guard/profile"
                className="inline-flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 hover:bg-emerald-100"
              >
                <span>View your profile</span>
                <FaUserCircle className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <div className="mt-2 text-[11px] text-slate-400 text-center">
        Estate Guard Console &copy; {new Date().getFullYear()}
      </div>

      {showAdminModal && adminDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-4 md:p-5 shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-sm"
              onClick={() => setShowAdminModal(false)}
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <div className="mb-4 flex flex-col items-center text-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <FaCheckCircle className="h-7 w-7" />
              </div>
              <p className="text-sm font-semibold text-emerald-950">
                {isCheckout ? "Guest checked out" : "Guest checked in"}
              </p>
              <p className="text-[11px] text-slate-500">
                {scanResult || "Guest access has been verified at the gate."}
              </p>
              <span
                className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                  isAdminCode
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                {isAdminCode ? "Admin code" : "Resident code"}
              </span>
            </div>

            {adminDetails.itemImageUrl && (
              <div className="mb-3 flex items-center justify-center">
                <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/40">
                  <Image src={adminDetails.itemImageUrl} alt="Admin item" fill className="object-cover" />
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Code</span>
                <span className="rounded-full bg-slate-900 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-50">
                  {adminDetails.code}
                </span>
              </div>
              {adminDetails.purpose && (
                <div>
                  <p className="text-slate-500 mb-0.5">Purpose</p>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-800">
                    {adminDetails.purpose}
                  </p>
                </div>
              )}
              {adminDetails.itemDetails && (
                <div>
                  <p className="text-slate-500 mb-0.5">Item details</p>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-800 whitespace-pre-line">
                    {adminDetails.itemDetails}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 mt-1">
                <div>
                  <p className="text-slate-500 mb-0.5">Resident</p>
                  <p className="rounded-xl border border-emerald-50 bg-emerald-50/70 px-2 py-1 text-[11px] font-semibold text-emerald-900">
                    {adminDetails.residentName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Address</p>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-800 line-clamp-2">
                    {adminDetails.residentAddress || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                onClick={() => setShowAdminModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
