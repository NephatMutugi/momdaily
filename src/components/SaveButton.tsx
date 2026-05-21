"use client";

/**
 * Bookmark/save toggle. Optimistic.
 *
 * Reused on:
 *   - Tip detail pages (icon-only, large)
 *   - Tip list items in /tips (icon-only, small)
 *
 * 44×44 minimum touch target per WCAG 2.5.5 / Apple HIG.
 */

import { useState } from "react";

export default function SaveButton({
  tipId,
  initialSaved,
  size = "md",
}: {
  tipId: string;
  initialSaved: boolean;
  size?: "sm" | "md";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(e: React.MouseEvent) {
    // Prevent the surrounding <Link> from navigating when the button sits
    // inside a list-item link.
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const prev = saved;
    setSaved(!prev);
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/tips/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaved(prev);
        setError(data.error ?? "Couldn't save");
        return;
      }
      // The server is the source of truth — sync with whatever it returned.
      if (typeof data.saved === "boolean") setSaved(data.saved);
    } catch {
      setSaved(prev);
      setError("Couldn't save");
    } finally {
      setPending(false);
    }
  }

  const dim = size === "sm" ? 36 : 44;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save tip"}
      title={saved ? "Saved — tap to remove" : "Save for later"}
      className="inline-flex items-center justify-center rounded-full transition-colors"
      style={{
        width: dim,
        height: dim,
        background: saved ? "var(--accent-soft)" : "transparent",
        border: `1px solid ${saved ? "var(--accent)" : "var(--border)"}`,
        color: saved ? "var(--accent)" : "var(--fg-muted)",
        cursor: pending ? "wait" : "pointer",
      }}
    >
      {saved ? (
        // Filled bookmark
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 3a2 2 0 0 0-2 2v16l8-4 8 4V5a2 2 0 0 0-2-2H6Z" />
        </svg>
      ) : (
        // Outline bookmark
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 3a2 2 0 0 0-2 2v16l8-4 8 4V5a2 2 0 0 0-2-2H6Z" />
        </svg>
      )}
      {error && <span className="sr-only">{error}</span>}
    </button>
  );
}
