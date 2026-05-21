import Link from "next/link";
import SaveButton from "./SaveButton";

/**
 * Compact tip card used in /tips index and the dashboard's "For you" rail.
 *
 * Whole card is a link to /tips/[slug]. SaveButton is positioned to stop
 * propagation so tapping the bookmark doesn't navigate.
 */

export interface TipListItemData {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  ageMinMonths: number;
  ageMaxMonths: number;
}

function ageRangeLabel(min: number, max: number): string {
  if (max < 12) return `${min}–${max} mo`;
  if (min >= 12) {
    const minY = Math.floor(min / 12);
    const maxY = Math.floor(max / 12);
    if (minY === maxY) return `${minY}y`;
    return `${minY}–${maxY}y`;
  }
  return `${min} mo – ${Math.floor(max / 12)}y`;
}

export default function TipListItem({
  tip,
  saved,
}: {
  tip: TipListItemData;
  saved: boolean;
}) {
  // Trim the body to a one-line snippet so the cards stay scannable.
  const snippet =
    tip.body.length > 110 ? tip.body.slice(0, 110).trimEnd() + "…" : tip.body;

  return (
    <article
      className="card relative"
      style={{ padding: 16 }}
    >
      <Link
        href={`/tips/${tip.slug}`}
        className="block"
        aria-label={tip.title}
      >
        <div className="flex items-baseline gap-2 mb-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            {tip.category.replace("_", " ")}
          </span>
          <span className="text-xs text-[var(--fg-muted)]">
            {ageRangeLabel(tip.ageMinMonths, tip.ageMaxMonths)}
          </span>
        </div>
        <h3 className="text-base font-semibold leading-snug pr-12">
          {tip.title}
        </h3>
        <p className="mt-1 text-sm text-[var(--fg-muted)] leading-relaxed">
          {snippet}
        </p>
      </Link>
      <div className="absolute top-3 right-3">
        <SaveButton tipId={tip.id} initialSaved={saved} size="sm" />
      </div>
    </article>
  );
}
