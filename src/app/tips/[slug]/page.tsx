import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getTipBySlug,
  getRelatedTips,
  listSavedTipIds,
} from "@/lib/tipBrowse";
import { prisma } from "@/lib/prisma";
import SaveButton from "@/components/SaveButton";
import TipListItem from "@/components/TipListItem";

/**
 * /tips/[slug] — single tip detail page.
 *
 * Server component. Auth-gated for now; the public/SEO variant lands in
 * the SEO follow-up phase by lifting auth and adding metadata + JSON-LD.
 */

export const dynamic = "force-dynamic";

export default async function TipDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { slug } = await params;
  const tip = await getTipBySlug(slug);
  if (!tip || !tip.publishedAt) notFound();

  const [savedIds, related, savedRecord] = await Promise.all([
    listSavedTipIds(session.user.id),
    getRelatedTips(tip, 4),
    prisma.tipSave.findUnique({
      where: { userId_tipId: { userId: session.user.id, tipId: tip.id } },
      select: { id: true },
    }),
  ]);
  const isSaved = !!savedRecord;

  return (
    <main className="mx-auto max-w-md p-6 pb-32 space-y-6">
      <div className="pt-2">
        <Link
          href="/tips"
          className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-1"
        >
          <span aria-hidden="true">←</span> All tips
        </Link>
      </div>

      <article className="space-y-4">
        <header className="space-y-2">
          <div className="flex items-baseline gap-2">
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
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold leading-tight">{tip.title}</h1>
            <SaveButton tipId={tip.id} initialSaved={isSaved} size="md" />
          </div>
        </header>

        <p className="text-[var(--fg)] leading-relaxed">{tip.body}</p>

        {tip.sources.length > 0 && (
          <section className="pt-2 border-t border-[var(--border)] space-y-1">
            <h2 className="text-xs uppercase tracking-wide text-[var(--fg-muted)]">
              Sources
            </h2>
            <ul className="space-y-1 text-sm">
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
          </section>
        )}

        <section className="pt-2 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--fg-muted)]">
            MomDaily shares tips drawn from public pediatric guidance and is
            not medical advice. For anything you&apos;re worried about, call
            your pediatrician.
          </p>
        </section>
      </article>

      {related.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--fg-muted)] uppercase tracking-wide">
            Related tips
          </h2>
          <div className="space-y-2">
            {related.map((r) => (
              <TipListItem
                key={r.id}
                tip={r}
                saved={savedIds.has(r.id)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
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
