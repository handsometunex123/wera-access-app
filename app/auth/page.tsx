"use client";
import React, { useState } from "react";
import { LockClosedIcon, KeyIcon } from "@heroicons/react/24/solid";
import { FaQrcode } from "react-icons/fa";
import { useNotify } from "../../components/useNotify"; // Import useNotify hook

import { signIn } from "next-auth/react";
import { getSession } from "next-auth/react";

export default function LoginPage() {
  const notify = useNotify(); // Initialize notify hook
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white flex flex-col items-center">
          <FaQrcode className="text-emerald-600 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-emerald-700 mb-2">Westend Estate Access Control</h1>
          <p className="text-gray-600 mb-6 text-center">Secure access with unique codes. Generate, scan, and manage entry for residents and guests.</p>
          {verificationRequired ? (
            <form className="w-full" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1" htmlFor="verificationCode">Verification Code</label>
                <input
                  type="text"
                  id="verificationCode"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 text-gray-900"
                  placeholder="Enter the code sent to your email"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-2 rounded font-semibold flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          ) : (
            <form className="w-full" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1" htmlFor="email">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 text-gray-900"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <KeyIcon className="absolute right-3 top-2 text-gray-400" height={20} />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-1" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 text-gray-900"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <LockClosedIcon className="absolute right-3 top-2 text-gray-400" height={20} />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-2 rounded font-semibold flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          )}
          {error && <div className="text-red-600 mt-4">{error}</div>}
          {success && <div className="text-emerald-600 mt-4">{success}</div>}
        </div>
      </div>
    </>
  );
}
