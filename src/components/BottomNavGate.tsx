"use client";

/**
 * Conditionally renders the BottomNav.
 *
 * Hidden on:
 *   - Landing page                 (/)
 *   - Auth flows                   (/login, /signup, /onboarding)
 *   - Offline fallback             (/offline) — added in Phase 6
 *
 * Kept in sync with AppShell's HIDDEN_PATTERNS so chrome behaves consistently.
 */

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

const HIDDEN_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/login(\/|$)/,
  /^\/signup(\/|$)/,
  /^\/onboarding(\/|$)/,
  /^\/offline(\/|$)/,
];

export default function BottomNavGate() {
  const pathname = usePathname() ?? "/";
  const hidden = HIDDEN_PATTERNS.some((re) => re.test(pathname));
  if (hidden) return null;
  return <BottomNav />;
}
