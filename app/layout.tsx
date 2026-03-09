import "./globals.css";

import type { Metadata } from "next";
import ClientProviders from "../components/ClientProviders";

export const metadata: Metadata = {
  title: "Wera Access Control",
  description:
    "Secure and manage access to your estate with Wera Access Control. Our app provides seamless entry management, real-time notifications, and comprehensive admin tools to ensure the safety and convenience of your residents.",
  manifest: "/manifest.json",
};

export const viewport = {
  // Move theme color to the viewport export per environment warning
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes"></meta>
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-white">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
