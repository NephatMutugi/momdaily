"use client";

/**
 * Streak status — three states, three voices:
 *   length 0, includesToday=false   → "Start today" (no shame, just the door)
 *   length N, includesToday=false   → "N-day streak — log one to keep it going"
 *   length N, includesToday=true    → "N-day streak"
 *
 * Kept on the client so it can re-render when HabitChecklist hands back a
 * fresh streak after a toggle.
 */

export interface StreakSnapshot {
  length: number;
  includesToday: boolean;
}

export default function StreakBadge({ streak }: { streak: StreakSnapshot }) {
  if (streak.length === 0 && !streak.includesToday) {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
        style={{
          background: "var(--bg-elev)",
          border: "1px solid var(--border)",
          color: "var(--fg-muted)",
        }}
      >
        <span aria-hidden="true">✨</span>
        Start today
      </span>
    );
  }

  const dayWord = streak.length === 1 ? "day" : "days";
  if (streak.includesToday) {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
        style={{
          background: "var(--accent-soft)",
          color: "var(--accent)",
          border: "1px solid var(--accent)",
        }}
      >
        <span aria-hidden="true">🔥</span>
        {streak.length}-{dayWord} streak
      </span>
    );
  }

  // Streak alive but today not yet logged.
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
      style={{
        background: "var(--bg-elev)",
        border: "1px dashed var(--accent)",
        color: "var(--fg)",
      }}
      title="Log a habit today to keep your streak going"
    >
      <span aria-hidden="true">🔥</span>
      {streak.length}-{dayWord} streak · log one today
    </span>
  );
}
