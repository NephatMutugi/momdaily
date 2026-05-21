import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import BottomNavGate from "@/components/BottomNavGate";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "MomDaily",
  description: "A 2-minute daily companion for moms of kids 0–3 years.",
  applicationName: "MomDaily",
  // manifest is added in Phase 6 (PWA).
};

// Two-color viewport — the browser picks the right one per OS color scheme.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1410" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProviderWrapper>
          <AppShell>{children}</AppShell>
        </SessionProviderWrapper>
        <BottomNavGate />
      </body>
    </html>
  );
}
