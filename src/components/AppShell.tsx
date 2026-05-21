"use client";

/**
 * Wraps every page with the desktop app shell: fixed left sidebar plus a
 * left-padded content column on md+. On mobile the sidebar is hidden and
 * the BottomNav handles navigation (the AppHeader handles top-of-screen).
 *
 * On routes where we don't want chrome (landing, auth flows, onboarding,
 * offline fallback) the shell becomes a transparent pass-through. Keep
 * HIDDEN_PATTERNS in sync with BottomNavGate and AppHeader.
 */

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import SidebarNav from "./SidebarNav";

const HIDDEN_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/login(\/|$)/,
  /^\/signup(\/|$)/,
  /^\/onboarding(\/|$)/,
  /^\/offline(\/|$)/,
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const hidden = HIDDEN_PATTERNS.some((re) => re.test(pathname));

  if (hidden) {
    return <>{children}</>;
  }

  return (
    <>
      <SidebarNav />
      <div className="md:pl-60">{children}</div>
    </>
  );
}
