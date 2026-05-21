"use client";

/**
 * Today's habits — auto-save imperative controls.
 *
 * Design notes (Nielsen Norman heuristic #1 — Visibility of System Status,
 * and WCAG 2.5.5 target size):
 *   - No submit button. Each tap saves immediately. This is the correct
 *     pattern for imperative controls (toggles, checkboxes) per GitLab's
 *     Pajamas design system and Microsoft Fluent guidance.
 *   - But silent auto-save is bad UX — the user has to guess if it worked.
 *     So we:
 *       (a) say "Tap a row to mark done — saves as you go" upfront,
 *       (b) briefly show "Saved ✓" next to the just-toggled row,
 *       (c) announce changes via aria-live for screen readers.
 *   - Touch targets are ~64px tall — well past the 44px WCAG AAA bar.
 *   - Optimistic UI: the visual flips first; if the network fails we roll
 *     back and surface an error.
 */

import { useState, useEffect } from "react";

export interface HabitItem {
  id: string;
  label: string;
  loggedToday: boolean;
}

export interface StreakSnapshot {
  length: number;
  includesToday: boolean;
}

export default function HabitChecklist({
  habits,
  onStreakChange,
}: {
  habits: HabitItem[];
  onStreakChange?: (s: StreakSnapshot) => void;
}) {
  const [items, setItems] = useState(habits);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  // Clear the "Saved ✓" indicator after a moment so it doesn't linger.
  useEffect(() => {
    if (!recentlySavedId) return;
    const t = setTimeout(() => setRecentlySavedId(null), 2200);
    return () => clearTimeout(t);
  }, [recentlySavedId]);

  async function toggle(habit: HabitItem) {
    if (pendingIds.has(habit.id)) return;
    const nextValue = !habit.loggedToday;

    // Optimistic update.
    setItems((prev) =>
      prev.map((h) =>
        h.id === habit.id ? { ...h, loggedToday: nextValue } : h
      )
    );
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.add(habit.id);
      return next;
    });
    setError(null);

    try {
      const res = await fetch("/api/habits/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId: habit.id, value: nextValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Roll back.
        setItems((prev) =>
          prev.map((h) =>
            h.id === habit.id ? { ...h, loggedToday: !nextValue } : h
          )
        );
        setError(data.error ?? "Couldn't save");
        setLiveMessage("Couldn't save your update.");
      } else {
        setRecentlySavedId(habit.id);
        setLiveMessage(
          nextValue
            ? `${habit.label} — marked done. Saved.`
            : `${habit.label} — unmarked. Saved.`
        );
        if (data.streak && onStreakChange) {
          onStreakChange(data.streak as StreakSnapshot);
        }
      }
    } catch {
      setItems((prev) =>
        prev.map((h) =>
          h.id === habit.id ? { ...h, loggedToday: !nextValue } : h
        )
      );
      setError("Couldn't save");
      setLiveMessage("Couldn't save your update.");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(habit.id);
        return next;
      });
    }
  }

  return (
    <section className="space-y-3" aria-label="Today's habits">
      <header className="space-y-1">
        <h2 className="text-sm font-semibold text-[var(--fg-muted)] uppercase tracking-wide">
          Today
        </h2>
        <p className="text-xs text-[var(--fg-muted)]">
          Tap a row to mark it done. Saves as you go — no submit needed.
        </p>
      </header>

      <ul className="space-y-2">
        {items.map((h) => {
          const checked = h.loggedToday;
          const isPending = pendingIds.has(h.id);
          const justSaved = recentlySavedId === h.id;
          return (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => toggle(h)}
                aria-pressed={checked}
                aria-busy={isPending}
                className="w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-colors"
                style={{
                  minHeight: 56, // WCAG 2.5.5 (AAA) — well past 44px.
                  borderColor: checked ? "var(--accent)" : "var(--border)",
                  background: checked
                    ? "var(--accent-soft)"
                    : "var(--bg-elev)",
                  opacity: isPending ? 0.7 : 1,
                  cursor: isPending ? "wait" : "pointer",
                }}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border"
                  style={{
                    borderColor: checked ? "var(--accent)" : "var(--border)",
                    background: checked ? "var(--accent)" : "transparent",
                    color: "var(--accent-fg)",
                  }}
                >
                  {checked && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span
                  className="flex-1 text-base"
                  style={{
                    textDecoration: checked ? "line-through" : "none",
                    color: checked ? "var(--fg-muted)" : "var(--fg)",
                  }}
                >
                  {h.label}
                </span>
                <span
                  aria-hidden="true"
                  className="text-xs transition-opacity"
                  style={{
                    color: "var(--accent)",
                    opacity: justSaved ? 1 : 0,
                  }}
                >
                  Saved ✓
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error} — tap again to retry.
        </p>
      )}

      {/* Screen-reader-only live region. Visually hidden but announced on
          change. Polite so it doesn't interrupt anything in progress. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {liveMessage}
      </div>
    </section>
  );
}
