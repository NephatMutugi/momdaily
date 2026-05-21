import Link from "next/link";
import TipListItem, { type TipListItemData } from "./TipListItem";

/**
 * "Tips for you" — a compact rail below the main TipCard on the dashboard.
 * Server-rendered. Hidden if empty so the dashboard doesn't look broken
 * when the user is past the tip catalog's age range.
 */

export default function ForYouRail({
  tips,
  savedTipIds,
  childName,
}: {
  tips: TipListItemData[];
  savedTipIds: Set<string>;
  childName: string | null;
}) {
  if (tips.length === 0) return null;
  return (
    <section className="space-y-3" aria-label="More tips for you">
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--fg-muted)] uppercase tracking-wide">
            More for {childName ?? "you"}
          </h2>
          <p className="text-xs text-[var(--fg-muted)]">
            Picked for your child&apos;s age and your top goal.
          </p>
        </div>
        <Link
          href="/tips"
          className="text-sm underline"
          style={{ color: "var(--accent)" }}
        >
          Browse all
        </Link>
      </header>
      <div className="space-y-2">
        {tips.map((tip) => (
          <TipListItem key={tip.id} tip={tip} saved={savedTipIds.has(tip.id)} />
        ))}
      </div>
    </section>
  );
}
