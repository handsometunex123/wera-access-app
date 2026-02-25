"use client";
import React, { createContext, useContext, useState } from "react";

export type ToastType = "success" | "error" | "info";
export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

const ToastContext = createContext<{
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
}>({ toasts: [], showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(message: string, type: ToastType = "info") {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <div className="fixed z-50 top-6 right-6 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg shadow-lg text-white font-semibold transition-all ${toast.type === "success" ? "bg-emerald-500" : toast.type === "error" ? "bg-red-500" : "bg-blue-500"}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
