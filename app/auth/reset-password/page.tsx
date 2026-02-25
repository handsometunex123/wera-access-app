"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}

function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState<null | boolean>(null);
  const [tokenError, setTokenError] = useState("");

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      // Avoid calling setState synchronously in effect body; use microtask
      Promise.resolve().then(() => {
        setTokenValid(false);
        setTokenError("Missing or invalid token.");
      });
      return;
    }
    fetch("/api/auth/reset-password/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        if (res.ok) {
          setTokenValid(true);
        } else {
          let data;
          try {
            data = await res.json();
          } catch {
            setTokenError("Invalid or expired token.");
            setTokenValid(false);
            return;
          }
          setTokenError(data.error || "Invalid or expired token.");
          setTokenValid(false);
        }
      })
      .catch(() => {
        setTokenError("Network error. Please try again.");
        setTokenValid(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      setLoading(false);
      if (res.ok) {
        setSuccess(true);
      } else {
        let data;
        try {
          data = await res.json();
        } catch {
          
          setError("Failed to reset password. (Invalid server response)");
          return;
        }
        setError(data.error || "Failed to reset password.");
      }
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  if (tokenValid === false) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Invalid or Expired Token</h2>
        <p>{tokenError || "This password reset link is invalid, expired, or has already been used."}</p>
      </div>
    );
  }
  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Password Reset Successful</h2>
        <p>You can now log in with your new password.</p>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Validating reset link...</h2>
        <p>Please wait...</p>
      </div>
    );
  }
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Reset Your Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">New Password</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Confirm Password</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            minLength={6}
            required
          />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
