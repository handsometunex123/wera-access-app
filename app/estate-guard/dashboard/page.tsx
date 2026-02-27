"use client";
import React, { useState, useEffect, useMemo } from "react";
import OtpInput from "react-otp-input";
import Link from "next/link";
import QrScanner from "../QrScanner";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SessionUser {
  id?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  fullName?: string | null; // Added fullName to fix the error
}


export default function EstateGuardDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [fullUserDetails, setFullUserDetails] = useState<SessionUser | null>(null); // State for full user details

  // Type guard for session user
  const user = useMemo(() => (session?.user ?? {}) as SessionUser, [session?.user]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      signIn(undefined, { url: "/estate-guard/dashboard" });
    } else if (user.role !== "ESTATE_GUARD") {
      router.replace("/auth");
    }
    console.log("Session user:", user);
  }, [session, status, router, user]);

  // Fetch full user details
  useEffect(() => {
    async function fetchUserDetails() {
      if (!user.id) return;
      try {
        const res = await fetch(`/api/estate-guard/user-details?id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setFullUserDetails(data.user); // Update state with full user details
        } else {
          console.error("Failed to fetch user details");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }

    fetchUserDetails();
  }, [user.id]);

  if (status === "loading" || !session || user.role !== "ESTATE_GUARD") {
    return <div className="min-h-screen flex items-center justify-center text-emerald-700">Loading...</div>;
  }

  async function verifyCode(code: string) {
    // First lookup the code to determine whether we should prompt for action
    setVerifying(true);
    setScanResult(null);
    setScanError(null);
    try {
      const lookup = await fetch(`/api/estate-guard/lookup-code?code=${code}`);
      if (!lookup.ok) {
        const err = await lookup.json();
        setScanError(err.error || "Lookup failed");
        setVerifying(false);
        return;
      }
      const info = await lookup.json();
      // If ENTRY_AND_EXIT with usageLimit > 1, ask guard whether this is check-in or check-out
      if (info.usageType === "ENTRY_AND_EXIT" && info.usageLimit && info.usageLimit > 1) {
        setPendingCode(code);
        setActionModalOpen(true);
        setVerifying(false);
        return;
      }
      // Otherwise perform default verify
      const res = await fetch("/api/estate-guard/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code, guardId: user.id }),
      });
      const data = await res.json();
      if (res.ok) setScanResult(data.message || "Code valid. Guest checked in.");
      else setScanError(data.error || "Verification failed.");
      if (res.ok) setManualCode("");
    } catch {
      setScanError("Network error. Try again.");
    }
    setVerifying(false);
  }

  async function performActionOnPending(action: "CHECK_IN" | "CHECK_OUT") {
    if (!pendingCode) return;
    setActionModalOpen(false);
    setVerifying(true);
    try {
      const res = await fetch("/api/estate-guard/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pendingCode, action, guardId: user.id }),
      });
      const data = await res.json();
      if (res.ok) setScanResult(data.message);
      else setScanError(data.error || "Verification failed.");
      if (res.ok) setManualCode("");
    } catch {
      setScanError("Network error. Try again.");
    }
    setVerifying(false);
    setPendingCode(null);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.length === 6) {
      verifyCode(manualCode);
    } else {
      setScanError("Please enter a 6-digit code.");
    }
  }

  function handleQrScan(data: string) {
    let code = null;
    if (data) {
      // Try to extract a 6-digit code from the string
      const match = data.match(/\b\d{6}\b/);
      if (match) {
        code = match[0];
      } else {
        // Try to parse JSON and extract a code property
        try {
          const obj = JSON.parse(data);
          if (typeof obj === "object" && obj !== null) {
            if (typeof obj.code === "string" && obj.code.length === 6) {
              code = obj.code;
            } else if (typeof obj.codeValue === "string" && obj.codeValue.length === 6) {
              code = obj.codeValue;
            }
          }
        } catch {}
      }
    }
    if (code) {
      console.log(`Scanned code: ${code}`);
      verifyCode(code);
      setShowScanner(false);
    } else if (data) {
      setScanError("Invalid QR code format.");
      setShowScanner(false);
    }
  }

  function handleQrError() {
    setScanError("QR scan failed. Try again.");
    setShowScanner(false);
  }

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-emerald-50 py-10 px-2 flex flex-col items-center md:pt-28">
        <div className="w-full max-w-5xl bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl px-4 py-10 border border-emerald-100">
          <div className="flex md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-900 tracking-tight flex items-center gap-3">
                <span className="inline-block bg-emerald-100 p-2 rounded-xl">
                  <svg xmlns='http://www.w3.org/2000/svg' className='w-8 h-8 text-emerald-700' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path stroke="currentColor" strokeWidth="2" d="M7 7h2v2H7V7zm8 0h2v2h-2V7zm-8 8h2v2H7v-2zm8 0h2v2h-2v-2z" />
                  </svg>
                </span>
                Dashboard
              </h1>
              <div className="text-emerald-700 mt-2 font-medium text-base md:text-lg">
                Welcome, <span className="font-bold">{fullUserDetails?.fullName || user.name || 'Guard'}</span>
              </div>
              {/* Feedback Messages */}
              <div className="min-h-[32px] mt-2">
                {scanResult && (
                  <div className="flex items-center gap-2 text-green-700 font-semibold text-lg bg-green-50 border border-green-200 rounded-xl px-4 py-2 shadow-sm">
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                    </svg>
                    {scanResult}
                    <button
                      className="ml-2 text-green-700 hover:text-green-900 focus:outline-none"
                      onClick={() => setScanResult(null)}
                      aria-label="Dismiss success message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {scanError && (
                  <div className="flex items-center gap-2 justify-between text-red-700 font-semibold text-lg bg-red-50 border border-red-200 rounded-xl px-4 py-2 shadow-sm">
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                    </svg>
                    {scanError}
                    <button
                      className="ml-2 text-red-700 hover:text-red-900 focus:outline-none"
                      onClick={() => setScanError(null)}
                      aria-label="Dismiss error message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Scan/Verify Code Section - Revamped */}
          <div className="mb-10 flex flex-col md:flex-row gap-10 items-stretch justify-center">
            {/* QR Scan Section */}
            <div className="flex-1 flex flex-col items-center justify-center bg-white/90 rounded-2xl shadow-xl border border-emerald-200 p-8 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 opacity-10 pointer-events-none select-none">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" stroke="#10B981" strokeWidth="2" fill="none" /><path stroke="#10B981" strokeWidth="2" d="M7 7h2v2H7V7zm8 0h2v2h-2V7zm-8 8h2v2H7v-2zm8 0h2v2h-2v-2z" /></svg>
              </div>
              <button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-7 rounded-xl shadow flex items-center gap-2 text-lg mb-6 mt-2"
                onClick={() => setShowScanner(true)}
                disabled={verifying}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                  <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path stroke="currentColor" strokeWidth="2" d="M7 7h2v2H7V7zm8 0h2v2h-2V7zm-8 8h2v2H7v-2zm8 0h2v2h-2v-2z" />
                </svg>
                Scan QR Code
              </button>
              {showScanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity px-2">
                  <div className="bg-white rounded-xl shadow-2xl border border-emerald-200 p-3 md:p-6 w-full max-w-sm md:max-w-md flex flex-col items-center relative animate-fade-in">
                    <div className="mb-2 font-semibold text-emerald-700 text-center">Scan the guest&apos;s QR code</div>
                    <QrScanner
                      onScan={handleQrScan}
                      onError={handleQrError}
                      onCancel={() => setShowScanner(false)}
                    />
                  </div>
                </div>
              )}
              {/* Action modal for check-in / check-out choice */}
              {actionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="fixed inset-0 bg-black/40" onClick={() => setActionModalOpen(false)} />
                  <div className="bg-white rounded-xl shadow-xl p-6 z-10 w-11/12 max-w-sm">
                    <h3 className="text-lg font-semibold text-emerald-900">Select action</h3>
                    <p className="text-sm text-gray-600 mt-2">Is this a check-in or a check-out?</p>
                    <div className="mt-4 flex gap-4">
                      <button className="flex-1 bg-emerald-600 text-white py-2 rounded-lg" onClick={() => performActionOnPending("CHECK_IN")}>Check In</button>
                      <button className="flex-1 bg-gray-100 text-emerald-800 py-2 rounded-lg" onClick={() => performActionOnPending("CHECK_OUT")}>Check Out</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Access Code Input Section */}
            <div className="flex-1 flex flex-col items-center justify-center bg-white/90 rounded-2xl shadow-xl border border-emerald-200 px-4 sm:px-8 md:px-10 py-8 sm:py-12 min-w-[0] w-full max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path stroke="currentColor" strokeWidth="2" d="M7 7h2v2H7V7zm8 0h2v2h-2V7zm-8 8h2v2H7v-2zm8 0h2v2h-2v-2z" />
                </svg>
                <h2 className="text-2xl font-bold text-emerald-800">Enter Access Code</h2>
              </div>
              <div className="mb-6 text-emerald-700 text-base text-center font-medium">Enter the 6-digit access code provided to the guest.</div>
              <form onSubmit={handleManualSubmit} className="flex flex-col items-center gap-6 w-full">
                <div className="flex justify-center w-full mb-2 flex-wrap">
                  <OtpInput
                    value={manualCode}
                    onChange={(code: string) => {
                      setManualCode(code);
                      if (code.length === 6) verifyCode(code);
                    }}
                    numInputs={6}
                    inputType="number"
                    shouldAutoFocus
                    containerStyle={{ display: "flex", gap: window.innerWidth < 400 ? "0.1rem" : "0.4rem", flexWrap: "wrap", width: "100%", justifyContent: "center" }}
                    inputStyle={{
                      width: window.innerWidth < 400 ? "2.2rem" : "3.2rem",
                      height: window.innerWidth < 400 ? "2.6rem" : "3.6rem",
                      fontSize: window.innerWidth < 400 ? "1.2rem" : "2rem",
                      borderRadius: "1.2rem",
                      border: "2px solid #10B981",
                      color: "#065F46",
                      background: "#F0FDF4",
                      textAlign: "center",
                      fontWeight: "bold",
                      outline: "none",
                      boxShadow: "0 2px 12px #10B98122"
                    }}
                    renderInput={(props) => <input {...props} />}
                  />
                </div>
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-0.5 px-6 sm:px-8 rounded-xl shadow transition text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                    disabled={verifying || manualCode.length !== 6}
                  >
                    {verifying ? (
                      <span className="flex items-center gap-2 justify-center">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : "Verify"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setManualCode(""); setScanResult(null); setScanError(null); }}
                    className="flex-none bg-white border border-gray-200 text-gray-700 font-semibold py-0.5 px-6 sm:px-4 rounded-xl shadow hover:bg-gray-50 transition"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>          
          {/* Link to Scan Logs Page */}
          <div className="mt-6 flex justify-center">
            <Link href="/estate-guard/scan-logs" className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold py-2.5 px-8 rounded-xl shadow border border-emerald-200 transition text-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4 4-4m-4-5v9" />
              </svg>
              View Scan Logs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}