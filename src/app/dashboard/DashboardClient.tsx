"use client";

/**
 * Client wrapper for the dashboard. The server component (page.tsx) fetches
 * everything up-front and hands it down as props, so the first paint is
 * complete. The client only owns the streak — it's the one thing that
 * changes from inside the page (when the user toggles a habit).
 */

import { Suspense, useState } from "react";
import TipCard, { type TipCardData } from "@/components/TipCard";
import HabitChecklist, {
  type HabitItem,
  type StreakSnapshot,
} from "@/components/HabitChecklist";
import StreakBadge from "@/components/StreakBadge";
import LoggedToast from "@/components/LoggedToast";

export interface DashboardProps {
  greetingName: string;
  childName: string | null;
  ageMonths: number | null;
  tip: TipCardData | null;
  habits: HabitItem[];
  streak: StreakSnapshot;
}

export default function DashboardClient({
  greetingName,
  childName,
  ageMonths,
  tip,
  habits,
  streak: initialStreak,
}: DashboardProps) {
  const [streak, setStreak] = useState<StreakSnapshot>(initialStreak);

  return (
    <main className="mx-auto max-w-md p-6 pb-32 space-y-6">
      {/* useSearchParams() requires Suspense in app router. */}
      <Suspense fallback={null}>
        <LoggedToast />
      </Suspense>
      <header className="pt-4 space-y-2">
        <p className="text-sm text-[var(--fg-muted)]">Good morning,</p>
        <h1 className="text-2xl font-bold">{greetingName}</h1>
        {childName && ageMonths !== null && (
          <p className="text-sm text-[var(--fg-muted)]">
            {childName} · {monthsLabel(ageMonths)}
          </p>
        )}
        <div className="pt-2">
          <StreakBadge streak={streak} />
        </div>
      </header>

      {tip ? (
        <TipCard tip={tip} />
      ) : (
        <div className="card">
          <p className="text-sm text-[var(--fg-muted)]">
            We&apos;re still building the tip library for this age band.
            Check back tomorrow.
          </p>
        </div>
      )}

      <HabitChecklist habits={habits} onStreakChange={setStreak} />
    </main>
  );
}

function monthsLabel(m: number): string {
  if (m < 1) return "less than a month old";
  if (m < 12) return m === 1 ? "1 month old" : `${m} months old`;
  const years = Math.floor(m / 12);
  const months = m % 12;
  if (months === 0) return years === 1 ? "1 year old" : `${years} years old`;
  return `${years}y ${months}m old`;
}
