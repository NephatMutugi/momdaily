"use client";

/**
 * Desktop sidebar navigation (md+). Mirrors BottomNav's tabs vertically.
 * Mobile uses BottomNav exclusively; this component is `hidden md:flex`.
 *
 * Layout:
 *   ┌─────────────────┐
 *   │  MomDaily       │   ← brand
 *   │                 │
 *   │  🏠  Today      │   ← active highlight
 *   │  📖  Tips       │
 *   │  🔖  Saved      │
 *   │  👤  Profile    │
 *   │                 │
 *   │  ─────────────  │
 *   │  Sign out       │   ← footer
 *   └─────────────────┘
 */

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Suspense } from "react";
import { NAV_TABS } from "./BottomNav";

function SidebarNavInner() {
  const pathname = usePathname() ?? "/";
  const sp = useSearchParams();
  const params = new URLSearchParams(sp?.toString() ?? "");

  return (
    <aside
      className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-[var(--border)] bg-[var(--bg-elev)] z-30"
      aria-label="Primary"
    >
      <div className="px-6 py-6">
        <Link
          href="/dashboard"
          className="text-xl font-bold tracking-tight"
          aria-label="MomDaily home"
        >
          MomDaily
        </Link>
      </div>

      <nav className="flex-1 px-3" aria-label="Sections">
        <ul className="space-y-1">
          {NAV_TABS.map((tab) => {
            const active = tab.matches(pathname, params);
            return (
              <li key={tab.label}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors text-sm"
                  style={{
                    background: active ? "var(--accent-soft)" : "transparent",
                    color: active ? "var(--accent)" : "var(--fg)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <span aria-hidden="true" className="inline-flex w-5 h-5">
                    {active ? tab.filled : tab.outline}
                  </span>
                  <span>{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg)]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

export default function SidebarNav() {
  return (
    <Suspense fallback={null}>
      <SidebarNavInner />
    </Suspense>
  );
}
