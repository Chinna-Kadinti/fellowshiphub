import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "FellowshipHub",
  description: "Bible study fellowship coordination for meetings, prayer, resources, and reading plans.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FellowshipHub"
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
