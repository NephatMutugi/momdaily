"use client";

/**
 * Mobile-only top header. Sticky.
 *
 * Layout:
 *   ┌────────────────────────────────────────┐
 *   │ MomDaily                            🔍 │
 *   └────────────────────────────────────────┘
 *
 * Hidden on:
 *   - Landing / auth / onboarding (same gate as BottomNavGate)
 *   - Desktop (md:hidden) — SidebarNav handles brand + nav there.
 *
 * Search icon → /tips?focus=q. TipsFilterBar reads `focus=q` and autofocuses
 * the search input on mount, so the user can start typing immediately.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/login(\/|$)/,
  /^\/signup(\/|$)/,
  /^\/onboarding(\/|$)/,
  /^\/offline(\/|$)/,
];

export default function AppHeader() {
  const pathname = usePathname() ?? "/";
  const hidden = HIDDEN_PATTERNS.some((re) => re.test(pathname));
  if (hidden) return null;

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)] md:hidden"
      style={{
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="mx-auto max-w-md flex items-center justify-between px-4 h-14">
        <Link
          href="/dashboard"
          className="font-bold text-lg tracking-tight"
          aria-label="MomDaily home"
        >
          MomDaily
        </Link>
        <Link
          href="/tips?focus=q"
          aria-label="Search tips"
          title="Search tips"
          className="inline-flex items-center justify-center rounded-full"
          style={{
            width: 44,
            height: 44,
            color: "var(--fg)",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.5" y2="16.5" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
