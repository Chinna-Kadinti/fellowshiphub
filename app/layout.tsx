import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "EGF Connect",
  description: "Gather • Grow • Go — fellowship, spiritual growth, and Gospel mission.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/egf-connect.png",
    shortcut: "/egf-connect.png",
    apple: "/egf-connect.png"
  },
  appleWebApp: {
    capable: true,
    title: "EGF Connect"
  },
  other: {
    "mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  themeColor: "#1f7369",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
