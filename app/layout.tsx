"use client";
import "./globals.css";

import { GlobalLoader } from "./GlobalLoader";
import NotificationProvider from "../components/NotificationProvider";
import { SessionProvider } from "next-auth/react";
// import EstateBg from "./estate-bg.svg.jsx";
// ...existing code...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <GlobalLoader />
          <NotificationProvider />
          {children}
          {/* <EstateBg /> */}
        </SessionProvider>
      </body>
    </html>
  );
}
