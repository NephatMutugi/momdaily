"use client";

/**
 * Conditionally renders the BottomNav. Hidden on landing, auth, onboarding,
 * and offline. BottomNav uses useSearchParams (to distinguish Tips from
 * Saved), so it's wrapped in <Suspense> per Next.js 15 requirements.
 */

import { Suspense } from "react";
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
  return (
    <Suspense fallback={null}>
      <BottomNav />
    </Suspense>
  );
}
