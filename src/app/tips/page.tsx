import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchTips, listSavedTipIds } from "@/lib/tipBrowse";
import TipsFilterBar from "@/components/TipsFilterBar";
import TipListItem from "@/components/TipListItem";
import type { TipCategory } from "@prisma/client";

/**
 * /tips — browseable tip library.
 *
 * Phase 5 will add a public/unauthenticated version with SEO metadata.
 * For now: logged-in only, so we can read savedByUserId for the bookmark
 * filter without forking the page.
 */
export const dynamic = "force-dynamic"; // search params drive everything

type SearchParams = Record<string, string | string[] | undefined>;

const VALID_CATEGORIES: TipCategory[] = [
  "nutrition",
  "sleep",
  "milestones",
  "self_care",
  "safety",
];

function parseAge(raw: string | undefined): { min: number; max: number } | null {
  if (!raw) return null;
  const m = /^(\d+)-(\d+)$/.exec(raw);
  if (!m) return null;
  const min = parseInt(m[1]!, 10);
  const max = parseInt(m[2]!, 10);
  if (Number.isNaN(min) || Number.isNaN(max) || min > max) return null;
  return { min, max };
}

export default async function TipsLibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const qRaw = typeof sp.q === "string" ? sp.q : undefined;
  const categoryRaw = typeof sp.category === "string" ? sp.category : undefined;
  const ageRaw = typeof sp.age === "string" ? sp.age : undefined;
  const savedOnly = sp.saved === "1";

  const category = (VALID_CATEGORIES as string[]).includes(categoryRaw ?? "")
    ? (categoryRaw as TipCategory)
    : undefined;
  const ageBand = parseAge(ageRaw);

  const tips = await searchTips({
    query: qRaw,
    categories: category ? [category] : undefined,
    ageMinMonths: ageBand?.min,
    ageMaxMonths: ageBand?.max,
    savedByUserId: savedOnly ? session.user.id : undefined,
  });

  const savedIds = await listSavedTipIds(session.user.id);

  return (
    <main className="mx-auto max-w-md p-6 pb-32 space-y-6">
      <header className="pt-4 space-y-1">
        <h1 className="text-2xl font-bold">Tips</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Browse and save. Filter by what&apos;s on your mind right now.
        </p>
      </header>

      <TipsFilterBar showSavedToggle={true} />

      <section aria-label="Tip results" className="space-y-3">
        <p className="text-xs text-[var(--fg-muted)]">
          {tips.length === 0
            ? "No tips match those filters."
            : `${tips.length} ${tips.length === 1 ? "tip" : "tips"}`}
        </p>
        <div className="space-y-2">
          {tips.map((tip) => (
            <TipListItem
              key={tip.id}
              tip={tip}
              saved={savedIds.has(tip.id)}
            />
          ))}
        </div>
        {tips.length === 0 && (
          <div className="card text-sm text-[var(--fg-muted)]">
            Try a broader filter, or clear search to see everything.
          </div>
        )}
      </section>
    </main>
  );
}
