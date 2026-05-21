"use client";

/**
 * Filter controls for /tips: category chips, age band, keyword search,
 * and a "saved only" toggle.
 *
 * State syncs to URL search params (server-side filtering) so:
 *   - The page is shareable / bookmarkable.
 *   - Back-button navigation works.
 *   - SSR can read the filters directly without a hydration round-trip.
 */

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

const CATEGORIES = [
  { value: "nutrition", label: "Nutrition" },
  { value: "sleep", label: "Sleep" },
  { value: "milestones", label: "Milestones" },
  { value: "self_care", label: "Mom care" },
  { value: "safety", label: "Safety" },
] as const;

const AGE_BANDS = [
  { value: "0-3", label: "0–3 mo" },
  { value: "4-6", label: "4–6 mo" },
  { value: "7-9", label: "7–9 mo" },
  { value: "10-12", label: "10–12 mo" },
  { value: "13-18", label: "13–18 mo" },
  { value: "19-24", label: "19–24 mo" },
  { value: "25-36", label: "2–3 yr" },
] as const;

export default function TipsFilterBar({
  showSavedToggle,
}: {
  showSavedToggle: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const activeCategory = params.get("category");
  const activeAge = params.get("age");
  const activeSaved = params.get("saved") === "1";
  const [q, setQ] = useState(params.get("q") ?? "");
  const searchRef = useRef<HTMLInputElement>(null);

  // When the user lands here via the header's search icon (?focus=q), pop
  // focus into the search input so they can start typing immediately.
  // The focus param is then cleared from the URL so refresh doesn't refocus.
  useEffect(() => {
    if (params.get("focus") === "q") {
      searchRef.current?.focus();
      const next = new URLSearchParams(params.toString());
      next.delete("focus");
      router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`);
    });
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setParam("q", q || null);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
        <input
          ref={searchRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => setParam("q", q || null)}
          placeholder="Search tips — e.g. iron, sleep regression"
          aria-label="Search tips"
          enterKeyHint="search"
          className="flex-1"
          style={{ minHeight: 44 }}
        />
      </form>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Category</legend>
        <Chip
          label="All categories"
          active={!activeCategory}
          onClick={() => setParam("category", null)}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            label={c.label}
            active={activeCategory === c.value}
            onClick={() => setParam("category", c.value)}
          />
        ))}
      </fieldset>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Age band</legend>
        <Chip
          label="Any age"
          active={!activeAge}
          onClick={() => setParam("age", null)}
        />
        {AGE_BANDS.map((b) => (
          <Chip
            key={b.value}
            label={b.label}
            active={activeAge === b.value}
            onClick={() => setParam("age", b.value)}
          />
        ))}
      </fieldset>

      {showSavedToggle && (
        <div className="pt-1">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeSaved}
              onChange={(e) =>
                setParam("saved", e.target.checked ? "1" : null)
              }
              style={{ width: 18, height: 18, accentColor: "var(--accent)" }}
            />
            <span>Show only my saved tips</span>
          </label>
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center rounded-full px-3 transition-colors"
      style={{
        minHeight: 36,
        background: active ? "var(--accent)" : "var(--bg-elev)",
        color: active ? "var(--accent-fg)" : "var(--fg)",
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}
