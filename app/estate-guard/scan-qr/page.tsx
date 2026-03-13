"use client";

import React, { useState } from "react";
import QrScanner from "../QrScanner";

export default function ScanQrPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  function handleQrScan(data: string) {
    if (data) {
      setScanResult(data);
      setScanError(null);
      // Hide scanner after a successful scan
      setIsScanning(false);
    } else {
      setScanError("Invalid QR code format.");
      setScanResult(null);
      setIsScanning(false);
    }
  }

  function handleQrError(err?: unknown) {
    const message =
      err && typeof err === "object" && "name" in err && (err as { name?: string }).name === "AbortError"
        ? "Unable to access camera. Check browser permissions and that no other app is using the camera, then try again."
        : "QR scan failed. Try again.";
    setScanError(message);
    setIsScanning(false);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-6 md:p-8 border border-emerald-100">
        <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-900 mb-4 tracking-tight flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-lg font-bold">
            QR
          </span>
          <span>Scan QR Code</span>
        </h1>
        <p className="text-sm text-emerald-700 mb-6">
          Use your device camera to scan guest QR codes. Make sure the entire code is visible and well lit.
        </p>
        <div className="mb-6 flex flex-col items-center">
          {!isScanning && (
            <button
              type="button"
              className="px-6 py-3 rounded-full bg-emerald-700 text-white font-semibold shadow-md hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              onClick={() => {
                setScanError(null);
                setScanResult(null);
                setIsScanning(true);
              }}
            >
              Scan code
            </button>
          )}
          {isScanning && (
            <QrScanner
              onScan={handleQrScan}
              onError={handleQrError}
              onCancel={() => setIsScanning(false)}
            />
          )}
        </div>
        {scanResult && (
          <div className="text-center text-green-700 font-semibold text-sm md:text-base bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-sm mb-3">
            <p className="mb-1">Scanned data</p>
            <p className="font-mono break-all text-xs md:text-sm">{scanResult}</p>
          </div>
        )}
        {scanError && (
          <div className="text-center text-red-700 font-semibold text-sm md:text-base bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm">
            {scanError}
          </div>
        )}
      </div>
    </div>
  );
}