"use client";

import React, { useState } from "react";
import QrScanner from "../QrScanner";

export default function ScanQrPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  function handleQrScan(data: string) {
    if (data) {
      setScanResult(data);
    } else {
      setScanError("Invalid QR code format.");
    }
  }

  function handleQrError() {
    setScanError("QR scan failed. Try again.");
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-emerald-50 py-10 px-2 flex flex-col items-center md:pt-24">
        <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-emerald-100">
          <h1 className="text-2xl font-extrabold text-emerald-900 mb-6 text-center tracking-tight">Scan QR Code</h1>
          <div className="mb-6 flex flex-col items-center">
            <QrScanner onScan={handleQrScan} onError={handleQrError} />
          </div>
          {scanResult && (
            <div className="text-center text-green-700 font-semibold text-lg bg-green-50 border border-green-200 rounded-xl px-4 py-2 shadow-sm">
              <p>Scanned Result:</p>
              <p className="font-mono break-all">{scanResult}</p>
            </div>
          )}
          {scanError && (
            <div className="text-center text-red-700 font-semibold text-lg bg-red-50 border border-red-200 rounded-xl px-4 py-2 shadow-sm">
              {scanError}
            </div>
          )}
        </div>
      </div>
    </>
  );
}