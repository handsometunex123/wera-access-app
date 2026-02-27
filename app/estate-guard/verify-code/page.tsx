"use client";

import { useState } from "react";
import OtpInput from "react-otp-input"; // Import OTPInput

export default function VerifyCodePage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/estate-guard/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setCode("");
      } else {
        setError(data.error || "An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex pt-24 md:pt-28 justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white">
        <h1 className="text-2xl font-bold text-emerald-700 mb-6 text-center">Verify Code</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <OtpInput
            value={code}
            onChange={(value: string) => setCode(value)}
            numInputs={6}
            inputType="number"
            shouldAutoFocus
            containerStyle={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}
            inputStyle={{
              width: "3rem",
              height: "3.5rem",
              fontSize: "1.5rem",
              borderRadius: "0.5rem",
              border: "2px solid #10B981",
              color: "#065F46",
              background: "#F0FDF4",
              textAlign: "center",
              fontWeight: "bold",
              outline: "none",
              boxShadow: "0 2px 12px #10B98122",
            }}
            renderInput={(props) => <input {...props} />}
          />
          <div className="flex gap-3 justify-center">
            <button
              type="submit"
              className="bg-emerald-700 text-white font-bold py-2 rounded-lg shadow hover:bg-emerald-900 transition px-4"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <button
              type="button"
              onClick={() => { setCode(""); setMessage(""); setError(""); }}
              className="bg-white border border-gray-200 text-gray-700 font-semibold py-2 rounded-lg shadow hover:bg-gray-50 transition px-4"
            >
              Reset
            </button>
          </div>
        </form>
        {message && <p className="text-emerald-700 mt-4 text-center">{message}</p>}
        {error && <p className="text-red-700 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}