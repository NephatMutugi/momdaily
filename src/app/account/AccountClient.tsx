"use client";

/**
 * Profile page UI. Read-only for now (Phase 4) — edit affordances land in
 * Phase 4.5. Layout mirrors the rest of the app's mobile-first feel.
 */

import { signOut } from "next-auth/react";

export interface EmailPrefsView {
  morning: boolean;
  evening: boolean;
  weekly: boolean;
  sendHourLocal: number;
}

export interface AccountClientProps {
  name: string | null;
  email: string;
  topGoal: string | null;
  timezone: string;
  childName: string | null;
  childAgeMonths: number | null;
  childFeedingStage: string | null;
  emailPrefs: EmailPrefsView | null;
}

function ageLabel(m: number | null): string {
  if (m === null) return "—";
  if (m < 1) return "less than a month";
  if (m < 12) return m === 1 ? "1 month" : `${m} months`;
  const y = Math.floor(m / 12);
  const rest = m % 12;
  if (rest === 0) return y === 1 ? "1 year" : `${y} years`;
  return `${y}y ${rest}m`;
}

function hourLabel(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

export default function AccountClient({
  name,
  email,
  topGoal,
  timezone,
  childName,
  childAgeMonths,
  childFeedingStage,
  emailPrefs,
}: AccountClientProps) {
  return (
    <main className="mx-auto max-w-md p-6 pb-32 space-y-6">
      <header className="pt-4 space-y-1">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-[var(--fg-muted)]">{email}</p>
      </header>

      <section className="card space-y-3" aria-labelledby="acct-you">
        <h2
          id="acct-you"
          className="text-xs uppercase tracking-wide text-[var(--fg-muted)]"
        >
          You
        </h2>
        <Row label="Name" value={name ?? "—"} />
        <Row label="Top goal" value={topGoal?.replace("_", " ") ?? "—"} />
        <Row label="Timezone" value={timezone} />
      </section>

      <section className="card space-y-3" aria-labelledby="acct-child">
        <h2
          id="acct-child"
          className="text-xs uppercase tracking-wide text-[var(--fg-muted)]"
        >
          Your child
        </h2>
        <Row label="Name" value={childName ?? "—"} />
        <Row label="Age" value={ageLabel(childAgeMonths)} />
        <Row
          label="Feeding stage"
          value={childFeedingStage?.replace("_", " ") ?? "—"}
        />
      </section>

      <section className="card space-y-3" aria-labelledby="acct-email">
        <h2
          id="acct-email"
          className="text-xs uppercase tracking-wide text-[var(--fg-muted)]"
        >
          Email
        </h2>
        {emailPrefs ? (
          <>
            <Row
              label="Morning tip"
              value={emailPrefs.morning ? "On" : "Off"}
            />
            <Row
              label="Evening check-in"
              value={emailPrefs.evening ? "On" : "Off"}
            />
            <Row
              label="Sunday recap"
              value={emailPrefs.weekly ? "On" : "Off"}
            />
            <Row
              label="Send time"
              value={`${hourLabel(emailPrefs.sendHourLocal)} (local)`}
            />
          </>
        ) : (
          <p className="text-sm text-[var(--fg-muted)]">
            Email preferences haven&apos;t been set yet.
          </p>
        )}
        <p className="text-xs text-[var(--fg-muted)]">
          Editing email preferences lands in the next update.
        </p>
      </section>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="btn btn-ghost"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-[var(--fg-muted)]">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
