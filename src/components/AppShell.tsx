"use client";

/**
 * Wraps every page. On routes where we don't want chrome (landing, auth flows,
 * onboarding, offline fallback) the shell becomes a transparent pass-through.
 * For other routes it will (in Phase 1+) render a sidebar on desktop and
 * coordinate with BottomNav on mobile — same convention as gym-planner.
 *
 * In Phase 0 every route is "hidden" since there's only `/`. The structure is
 * here so Phase 1 doesn't need to refactor.
 */

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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

  // Phase 1+ will render <SidebarNav /> here on desktop.
  return <div className="md:pl-60">{children}</div>;
}
