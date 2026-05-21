"use client";

/**
 * Primary mobile bottom navigation — four tabs, thumb-zone aligned.
 *
 * Design notes:
 *   - Research says 3–5 items is the sweet spot. We're at four:
 *     Today, Tips, Saved, Profile.
 *   - "Saved" links to /tips?saved=1, which is the same physical page as
 *     "Tips" but with the bookmark filter pre-applied. The active matcher
 *     distinguishes the two by reading `saved=1` from the URL.
 *   - Touch targets are 56×72 — well past WCAG 2.5.5's 44px enhanced bar.
 *   - iOS PWA: env(safe-area-inset-bottom) keeps tap targets above the
 *     home-indicator gesture region.
 *
 * Desktop: hidden via Tailwind `md:hidden`. SidebarNav takes over on md+.
 */

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

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

function BookmarkOutline() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 3a2 2 0 0 0-2 2v16l8-4 8 4V5a2 2 0 0 0-2-2H6Z"
        stroke={STROKE}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BookmarkFilled() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 3a2 2 0 0 0-2 2v16l8-4 8 4V5a2 2 0 0 0-2-2H6Z" />
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

export interface NavTab {
  href: string;
  label: string;
  /** Matches against pathname + search params, returns true if this tab is active. */
  matches: (path: string, params: URLSearchParams) => boolean;
  outline: ReactNode;
  filled: ReactNode;
}

// `Tips` and `Saved` share the same path; the `saved=1` param disambiguates.
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
    matches: (p, params) =>
      (p === "/tips" || p.startsWith("/tips/")) && params.get("saved") !== "1",
    outline: <BookOutline />,
    filled: <BookFilled />,
  },
  {
    href: "/tips?saved=1",
    label: "Saved",
    matches: (p, params) => p === "/tips" && params.get("saved") === "1",
    outline: <BookmarkOutline />,
    filled: <BookmarkFilled />,
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
  const sp = useSearchParams();
  // useSearchParams returns a ReadonlyURLSearchParams; cast to URLSearchParams shape
  const params = new URLSearchParams(sp?.toString() ?? "");

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--bg-elev)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {NAV_TABS.map((tab) => {
          const active = tab.matches(pathname, params);
          return (
            <li key={tab.label}>
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
