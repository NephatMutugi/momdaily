/**
 * Tip browsing — search, filter, and "related tips."
 *
 * Server-only. The /tips page imports these directly; the /tips/[slug] page
 * imports getTipBySlug + getRelatedTips.
 *
 * Search strategy: Postgres ILIKE on title + body. With ~50–300 tips that's
 * trivial. Beyond ~10,000 we'd want a tsvector column with a GIN index, or
 * something like pg_trgm. Easy to migrate later — the search interface
 * here is the same.
 */

import { prisma } from "@/lib/prisma";
import type { Tip, TipCategory, Goal } from "@prisma/client";

export interface SearchFilters {
  /** Comma-tolerant: ["nutrition", "sleep"] returns either. */
  categories?: TipCategory[];
  /** Free text — searched in title + body, case-insensitive. */
  query?: string;
  /** Inclusive age band overlap. Both required if either is set. */
  ageMinMonths?: number;
  ageMaxMonths?: number;
  /** If set, only returns tips this user has bookmarked. Requires auth. */
  savedByUserId?: string;
  /** Defaults to 200 — tips library will never be huge. */
  limit?: number;
}

export async function searchTips(filters: SearchFilters): Promise<Tip[]> {
  const where: Record<string, unknown> = {
    publishedAt: { not: null, lte: new Date() },
  };

  if (filters.categories && filters.categories.length > 0) {
    where.category = { in: filters.categories };
  }

  // Age band overlap: a tip applies if its band intersects the requested
  // band. tipBand ∩ requestedBand ≠ ∅  ⇔  tipMin ≤ reqMax AND tipMax ≥ reqMin.
  if (
    typeof filters.ageMinMonths === "number" &&
    typeof filters.ageMaxMonths === "number"
  ) {
    where.ageMinMonths = { lte: filters.ageMaxMonths };
    where.ageMaxMonths = { gte: filters.ageMinMonths };
  }

  // Keyword search — case-insensitive substring match on title or body.
  const q = filters.query?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ];
  }

  // Saved-only filter — adds an inner-join via Prisma's relation filter.
  if (filters.savedByUserId) {
    where.saves = { some: { userId: filters.savedByUserId } };
  }

  return prisma.tip.findMany({
    where,
    orderBy: [{ ageMinMonths: "asc" }, { title: "asc" }],
    take: filters.limit ?? 200,
  });
}

export async function getTipBySlug(slug: string): Promise<Tip | null> {
  return prisma.tip.findUnique({
    where: { slug },
  });
}

/**
 * "Related tips" — same category, overlapping age band, excluding the
 * current tip. Falls back to same-age-band-only if same-category returns
 * fewer than `limit`.
 */
export async function getRelatedTips(
  tip: Pick<Tip, "id" | "category" | "ageMinMonths" | "ageMaxMonths">,
  limit = 4
): Promise<Tip[]> {
  const sameCategory = await prisma.tip.findMany({
    where: {
      publishedAt: { not: null, lte: new Date() },
      id: { not: tip.id },
      category: tip.category,
      ageMinMonths: { lte: tip.ageMaxMonths },
      ageMaxMonths: { gte: tip.ageMinMonths },
    },
    orderBy: { title: "asc" },
    take: limit,
  });
  if (sameCategory.length >= limit) return sameCategory;

  // Top up from same-age-band tips of other categories.
  const remaining = limit - sameCategory.length;
  const sameCategoryIds = new Set(sameCategory.map((t) => t.id));
  const filler = await prisma.tip.findMany({
    where: {
      publishedAt: { not: null, lte: new Date() },
      id: { not: tip.id, notIn: Array.from(sameCategoryIds) },
      ageMinMonths: { lte: tip.ageMaxMonths },
      ageMaxMonths: { gte: tip.ageMinMonths },
    },
    orderBy: { title: "asc" },
    take: remaining,
  });
  return [...sameCategory, ...filler];
}

/** Returns the set of tip ids the user has bookmarked. */
export async function listSavedTipIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.tipSave.findMany({
    where: { userId },
    select: { tipId: true },
  });
  return new Set(rows.map((r) => r.tipId));
}

/**
 * "For You" — top N candidates for this user, useful for the dashboard
 * rail and for an unfiltered tip-library default sort. Reuses the scoring
 * from tipSelector but doesn't enforce the 30-day no-repeat rule (that's
 * only for the daily push).
 */
export async function getForYouTips(
  userId: string,
  options: { limit?: number; excludeTipIds?: string[] } = {}
): Promise<Tip[]> {
  const { limit = 4, excludeTipIds = [] } = options;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      topGoal: true,
      children: {
        select: { birthdate: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });
  if (!user || user.children.length === 0) return [];

  const child = user.children[0]!;
  const ageMonths = Math.max(0, monthsBetween(child.birthdate, new Date()));

  // Candidates: age-eligible published tips, excluding what the caller
  // already showed elsewhere on the page (typically today's tip).
  const candidates = await prisma.tip.findMany({
    where: {
      publishedAt: { not: null, lte: new Date() },
      ageMinMonths: { lte: ageMonths },
      ageMaxMonths: { gte: ageMonths },
      ...(excludeTipIds.length > 0 ? { id: { notIn: excludeTipIds } } : {}),
    },
    take: 200,
  });

  // Simple scoring — same shape as the selector but inline to avoid a
  // dependency cycle and keep this self-contained.
  const scored = candidates.map((t) => {
    let score = 0;
    if (user.topGoal && (t.goalsHit as Goal[]).includes(user.topGoal)) score += 5;
    const mid = (t.ageMinMonths + t.ageMaxMonths) / 2;
    const band = Math.max(1, t.ageMaxMonths - t.ageMinMonths);
    score += Math.max(0, 3 - (Math.abs(ageMonths - mid) / band) * 3);
    return { tip: t, score };
  });
  scored.sort((a, b) => b.score - a.score || a.tip.title.localeCompare(b.tip.title));
  return scored.slice(0, limit).map((s) => s.tip);
}

function monthsBetween(from: Date, to: Date): number {
  let months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return months;
}
