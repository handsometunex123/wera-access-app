"use client";
import React, { useState } from "react";
import { LockClosedIcon, KeyIcon } from "@heroicons/react/24/solid";
import { FaQrcode } from "react-icons/fa";
import { useNotify } from "../../components/useNotify"; // Import useNotify hook

import { signIn } from "next-auth/react";
import { getSession } from "next-auth/react";

import { useEffect } from "react";

export default function LoginPage() {
  const notify = useNotify(); // Initialize notify hook
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    async function checkSession() {
      const session = await getSession();
      if (session?.user) {
        const role = (session.user as { role?: string } | undefined)?.role;
        if (role === "ADMIN") {
          window.location.href = "/admin/dashboard";
        } else if (role === "MAIN_RESIDENT" || role === "DEPENDANT") {
          window.location.href = "/resident/dashboard";
        } else if (role === "ESTATE_GUARD") {
          window.location.href = "/estate-guard/dashboard";
        } else {
          window.location.href = "/";
        }
      }
    }
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (verificationRequired) {
      // Verify the code
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        notify(data.error || "Invalid code", "error");
        setLoading(false);
        return;
      }
      notify("Code verified successfully!", "success");
      setVerificationRequired(false);
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (result?.error) {
      if (result.error === "Verification required") {
        setVerificationRequired(true);
        notify("Verification code sent to your email.", "info");
      } else {
        const friendlyError = "Invalid email or password. Please try again.";
        setError(friendlyError);
        notify(friendlyError, "error");
      }
    } else {
      const successMessage = "Login successful!";
      setSuccess(successMessage);
      notify(successMessage, "success");
      // Fetch session and redirect based on user role
      setTimeout(async () => {
        const session = await getSession();
        // Type for user with role
        type UserWithRole = { role?: string };
        const user = session?.user as UserWithRole | undefined;
        const role = user?.role;
        if (role === "ADMIN") {
          window.location.href = "/admin/dashboard";
        } else if (role === "MAIN_RESIDENT" || role === "DEPENDANT") {
          window.location.href = "/resident/dashboard";
        } else if (role === "ESTATE_GUARD") {
          window.location.href = "/estate-guard/dashboard";
        } else {
          window.location.href = "/";
        }
      }, 500);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
        <div className="w-full max-w-md p-8 rounded-3xl shadow-xl bg-white/90 flex flex-col items-center border border-emerald-100">
          <FaQrcode className="text-emerald-600 mb-4 drop-shadow-lg" size={48} />
          <h1 className="text-3xl font-extrabold text-emerald-800 mb-2 tracking-tight text-center">Westend Estate Access Control</h1>
          <p className="text-[13px] text-emerald-700 mb-6 text-center">Secure access with unique codes. Generate, scan, and manage entry for residents and guests.</p>
          {verificationRequired ? (
            <form className="w-full" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-emerald-900 font-medium mb-0.5 text-[13px] text-center tracking-tight" htmlFor="verificationCode">Verification Code</label>
                <input
                  type="text"
                  id="verificationCode"
                  className="w-full px-3 py-1.5 rounded-full border border-emerald-200 bg-white text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-emerald-300 placeholder:text-[12px] text-center text-[15px]"
                  placeholder="Enter the code sent to your email"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-emerald-700 text-white py-2 font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-emerald-800 transition"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          ) : (
            <form className="w-full" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-emerald-900 font-medium mb-0.5 text-[13px] text-center tracking-tight" htmlFor="email">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-1.5 rounded-full border border-emerald-200 bg-white text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-emerald-300 placeholder:text-[12px] text-center text-[15px]"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <KeyIcon className="absolute right-3 top-2 text-emerald-300" height={20} />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-emerald-900 font-medium mb-0.5 text-[13px] text-center tracking-tight" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    className="w-full px-3 py-1.5 rounded-full border border-emerald-200 bg-white text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-emerald-300 placeholder:text-[12px] text-center text-[15px]"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <LockClosedIcon className="absolute right-3 top-2 text-emerald-300" height={20} />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-emerald-700 text-white py-2 font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-emerald-800 transition"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          )}
          {error && <div className="text-red-600 mt-4 text-sm font-semibold bg-rose-50 rounded-full px-4 py-2 w-full text-center shadow-sm">{error}</div>}
          {success && <div className="text-emerald-600 mt-4 text-sm font-semibold bg-emerald-50 rounded-full px-4 py-2 w-full text-center shadow-sm">{success}</div>}
        </div>
      </div>
    </>
  );
}
