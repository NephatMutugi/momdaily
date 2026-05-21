"use client";

/**
 * Primary mobile bottom navigation — mirrors gym-planner's pattern.
 *
 * In Phase 0 this component is defined but not yet mounted (no protected
 * routes exist). Phase 3 (dashboard) is where it gets wired into the layout
 * via a BottomNavGate that hides it on landing, auth, and onboarding.
 *
 * iOS PWA notes (for when this gets mounted):
 *   - viewportFit="cover" is set in app/layout.tsx so env(safe-area-inset-*)
 *     resolves to real pixels.
 *   - paddingBottom: env(safe-area-inset-bottom) keeps tap targets above the
 *     home-indicator gesture region.
 *
 * Desktop: hidden via Tailwind `md:hidden`. SidebarNav takes over on md+.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavTab = {
  href: string;
  label: string;
  matches: (path: string) => boolean;
  outline: ReactNode;
  filled: ReactNode;
};

const STROKE = "currentColor";

function HomeOutline() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 10.5 12 4l8.5 6.5V19a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-8.5Z"
        stroke={STROKE}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeFilled() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.5 10.5 12 4l8.5 6.5V19a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-8.5Z" />
    </svg>
  );
}

function BookOutline() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15.5H5.5A1.5 1.5 0 0 1 4 18V5.5Z"
        stroke={STROKE}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15.5h5.5A1.5 1.5 0 0 0 20 18V5.5Z"
        stroke={STROKE}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookFilled() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15.5H5.5A1.5 1.5 0 0 1 4 18V5.5Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15.5h5.5A1.5 1.5 0 0 0 20 18V5.5Z" />
    </svg>
  );
}

function HeartOutline() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z"
        stroke={STROKE}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartFilled() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" />
    </svg>
  );
}

function UserOutline() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.75" stroke={STROKE} strokeWidth="1.75" />
      <path
        d="M4.75 20c.75-3.75 3.75-5.75 7.25-5.75s6.5 2 7.25 5.75"
        stroke={STROKE}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserFilled() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.75 20c.75-3.75 3.75-5.75 7.25-5.75s6.5 2 7.25 5.75H4.75Z" />
    </svg>
  );
}

export const NAV_TABS: NavTab[] = [
  {
    href: "/dashboard",
    label: "Today",
    matches: (p) => p === "/dashboard" || p.startsWith("/dashboard/"),
    outline: <HomeOutline />,
    filled: <HomeFilled />,
  },
  {
    href: "/tips",
    label: "Tips",
    matches: (p) => p === "/tips" || p.startsWith("/tips/"),
    outline: <BookOutline />,
    filled: <BookFilled />,
  },
  {
    href: "/coach",
    label: "Coach",
    matches: (p) => p === "/coach" || p.startsWith("/coach/"),
    outline: <HeartOutline />,
    filled: <HeartFilled />,
  },
  {
    href: "/account",
    label: "Profile",
    matches: (p) => p.startsWith("/account"),
    outline: <UserOutline />,
    filled: <UserFilled />,
  },
];

export default function BottomNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--bg-elev)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {NAV_TABS.map((tab) => {
          const active = tab.matches(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                aria-label={tab.label}
                className={
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 transition-colors " +
                  "focus:outline-none focus-visible:bg-[var(--bg)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-inset " +
                  (active
                    ? "text-[var(--accent)] font-semibold"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]")
                }
              >
                <span aria-hidden="true" className="leading-none">
                  {active ? tab.filled : tab.outline}
                </span>
                <span className="text-[11px] leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
