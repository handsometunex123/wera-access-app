"use client";
import React, { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import NotificationProvider from "./NotificationProvider";
import { GlobalLoader } from "../app/GlobalLoader";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // register service worker
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('SW registration failed', err));
    }

    const onBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setShowInstall(false);
    setDeferredPrompt(null);
    // optional: log choice
    console.log('PWA install choice', choice);
  };

  return (
    <SessionProvider>
      <GlobalLoader />
      <NotificationProvider />
      {children}
      {showInstall && (
        <button
          onClick={handleInstall}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: 9999,
            background: '#059669',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Install App
        </button>
      )}
    </SessionProvider>
  );
}
