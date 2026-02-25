"use client";
import { Toaster } from "react-hot-toast";

export default function NotificationProvider() {

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "12px",
          background: "#fff",
          color: "#1e293b",
          boxShadow: "0 4px 16px rgba(16, 185, 129, 0.15)",
          border: "1px solid #10b981",
          padding: "16px 24px",
          fontSize: "16px",
          fontWeight: 500,
          minWidth: "320px",
          maxWidth: "420px",
        },
        success: {
          style: {
            border: "1px solid #10b981",
            background: "#ecfdf5",
            color: "#047857",
          },
        },
        error: {
          style: {
            border: "1px solid #ef4444",
            background: "#fef2f2",
            color: "#b91c1c",
          },
        },
      }}
    />
  );
}
