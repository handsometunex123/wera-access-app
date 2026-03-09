"use client";
import React, { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeCameraScanConfig } from "html5-qrcode";

interface QrScannerProps {
  onScan: (code: string) => void;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
}

export default function QrScanner({ onScan, onError, onCancel }: QrScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrcodeScannerRef = useRef<Html5Qrcode | null>(null);
  // Use a unique id for each mount, stable across renders
  // Generate a stable scanner id outside render to avoid impure function error
// Generate a stable scanner id after mount using useState
const [scannerId, setScannerId] = React.useState<string | null>(null);
React.useEffect(() => {
  const randomId = Math.random().toString(36).substr(2, 9);
  setScannerId(`html5qr-code-scanner-${randomId}`);
}, []);
  const initialized = useRef(false);

//   useEffect(() => {
//     if (!scannerRef.current) return;
//     const html5Qrcode = new Html5Qrcode("html5qr-code-scanner");
//     html5QrcodeScannerRef.current = html5Qrcode;
//     scanningActive.current = true;
//     html5Qrcode
//       .start(
//         { facingMode: "environment" },
//         { fps: 10, qrbox: { width: 250, height: 250 } },
//         (decodedText: string) => {
//           if (!scanningActive.current) return;
//           scanningActive.current = false;
//           onScan(decodedText);
//           // Remove scan callback by stopping and clearing
//           (async () => {
//             await html5Qrcode.stop().catch((e) => {
//               if (
//                 typeof e === "string" &&
//                 e.includes("Cannot stop, scanner is not running or paused")
//               ) {
//                 // Suppress this specific error
//                 return;
//               }
//               // Optionally log other errors
//             });
//             await html5Qrcode.clear();
//           })();
//         },
//         (error: string) => {
//           if (onError) onError(error);
//         }
//       )
//       .catch((err) => {
//         if (onError) onError(err);
//       });
//     return () => {
//       if (scanningActive.current) {
//         html5QrcodeScannerRef.current?.stop().catch(() => {});
//       }
//       html5QrcodeScannerRef.current?.clear();
//       scanningActive.current = false;
//     };
//   }, [onScan, onError]);

   useEffect(() => {
  if (!scannerRef.current) return;

  // Only initialize when scannerId is set
  if (!scannerId) return;

  // Aggressively clear all child nodes from the scanner div
  if (scannerRef.current) {
    while (scannerRef.current.firstChild) {
      scannerRef.current.removeChild(scannerRef.current.firstChild);
    }
  }

  // Prevent multiple initializations per mount
  if (initialized.current) return;
  initialized.current = true;

  const html5Qrcode = new Html5Qrcode(scannerId);
  html5QrcodeScannerRef.current = html5Qrcode;
  let isMounted = true;

  const startScanner = async () => {
    try {
      console.log("Scanner started. Present a QR code.");
      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 30, // Max out practical FPS for quicker detection
          // Slightly larger scan area so the code is easier to catch
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          // Only decode QR codes, and use the browser's BarcodeDetector
          // when supported (much faster in modern Chrome/Edge).
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        } as Html5QrcodeCameraScanConfig,
        (decodedText) => {
          if (!isMounted) return;
          onScan(decodedText);
        },
        () => {
          // Optionally handle scan errors
        }
      );
    } catch (err) {
      console.error(`Scanner failed to start: ${err}`);
      onError?.(err);
    }
  };

  startScanner();

  return () => {
    isMounted = false;

    const scanner = html5QrcodeScannerRef.current;
    if (!scanner) return;
    // Only stop if scanner is running or paused
    const state = scanner.getState();
    // 2 = SCANNING, 3 = PAUSED
    if (state === 2 || state === 3) {
      scanner.stop()
        .then(() => {
          try {
            scanner.clear();
          } catch {}
        })
        .catch(() => {
          try {
            scanner.clear();
          } catch {}
        });
    } else {
      try {
        scanner.clear();
      } catch {}
    }
    initialized.current = false;
  };
}, [scannerId, onScan, onError]);
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div
        id={scannerId ?? undefined}
        ref={scannerRef}
        className="w-full max-w-xs aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-emerald-700"
      ></div>
      <button
        type="button"
        className="mt-6 px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all text-lg flex items-center gap-2"
        onClick={() => {
          // Clean up scanner
          const scanner = html5QrcodeScannerRef.current;
          if (scanner) {
            try {
              scanner.stop().catch(() => {});
              scanner.clear();
            } catch {}
          }
          initialized.current = false;
          if (onCancel) onCancel();
        }}
        aria-label="Cancel QR scan"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Cancel
      </button>
    </div>
  );
}
