"use client";

/**
 * Today's tip + feedback.
 *
 * Design notes (same principles as HabitChecklist):
 *   - Feedback buttons auto-save (no submit).
 *   - After a vote we change the button area to a "Thanks" confirmation so
 *     the user knows their tap landed. Re-vote is still possible.
 *   - Touch targets are 44px+ tall (WCAG 2.5.5 / Apple HIG).
 *   - aria-live announces "Thanks" for screen readers.
 *   - Microcopy under the question explicitly says feedback saves on tap.
 */

import { useEffect, useState } from "react";

export interface TipCardData {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  sources: string[];
}

export default function TipCard({ tip }: { tip: TipCardData }) {
  // null = not yet voted, true/false = current vote
  const [vote, setVote] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(t);
  }, [justSaved]);

  async function submitFeedback(helpful: boolean) {
    if (submitting) return;
    const prev = vote;
    // Optimistic.
    setVote(helpful);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tips/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipId: tip.id, helpful }),
      });
      if (!res.ok) {
        setVote(prev);
        setError("Couldn't save — tap to retry");
        setLiveMessage("Couldn't save your feedback.");
      } else {
        setJustSaved(true);
        setLiveMessage(
          helpful
            ? "Thanks — saved as helpful."
            : "Thanks — saved as not helpful."
        );
      }
    } catch {
      setVote(prev);
      setError("Couldn't save — tap to retry");
      setLiveMessage("Couldn't save your feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article
      className="card space-y-4"
      aria-labelledby={`tip-title-${tip.id}`}
    >
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-[var(--fg-muted)]">
          Today&apos;s tip · {tip.category.replace("_", " ")}
        </p>
        <h2
          id={`tip-title-${tip.id}`}
          className="text-xl font-semibold leading-tight"
        >
          {tip.title}
        </h2>
      </header>

      <p className="text-[var(--fg)] leading-relaxed">{tip.body}</p>

      {tip.sources.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-[var(--fg-muted)] hover:text-[var(--fg)]">
            Sources
          </summary>
          <ul className="mt-2 space-y-1">
            {tip.sources.map((s, i) => (
              <li key={i} className="text-[var(--fg-muted)] break-words">
                {s.startsWith("http") ? (
                  <a
                    href={s}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {s}
                  </a>
                ) : (
                  s
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="pt-3 border-t border-[var(--border)] space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm text-[var(--fg-muted)]">
            Was this helpful?
          </p>
          <span
            className="text-xs transition-opacity"
            style={{
              color: "var(--accent)",
              opacity: justSaved ? 1 : 0,
            }}
          >
            Saved ✓
          </span>
        </div>
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label="Tip helpfulness"
        >
          <button
            type="button"
            onClick={() => submitFeedback(true)}
            disabled={submitting}
            aria-pressed={vote === true}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 transition-colors"
            style={{
              minHeight: 44, // WCAG 2.5.5 / Apple HIG
              background:
                vote === true ? "var(--accent-soft)" : "var(--bg-elev)",
              color: vote === true ? "var(--accent)" : "var(--fg)",
              border: `1px solid ${
                vote === true ? "var(--accent)" : "var(--border)"
              }`,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            <span aria-hidden="true">👍</span>
            <span>Yes</span>
          </button>
          <button
            type="button"
            onClick={() => submitFeedback(false)}
            disabled={submitting}
            aria-pressed={vote === false}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 transition-colors"
            style={{
              minHeight: 44,
              background:
                vote === false ? "var(--accent-soft)" : "var(--bg-elev)",
              color: vote === false ? "var(--accent)" : "var(--fg)",
              border: `1px solid ${
                vote === false ? "var(--accent)" : "var(--border)"
              }`,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            <span aria-hidden="true">👎</span>
            <span>Not really</span>
          </button>
        </div>
        <p className="text-xs text-[var(--fg-muted)]">
          One tap saves — no submit needed. You can change your answer.
        </p>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {/* Screen-reader-only live region. */}
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
    </article>
  );
}
