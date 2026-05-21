/**
 * DB wrapper around the pure tipSelector.
 *
 * Responsibilities:
 *   - Compute the child's age + recent-tip cutoff.
 *   - Query candidates: published, age-eligible, not shown in the last 30 days.
 *   - Hand them to pickTip() for scoring + deterministic pick.
 *   - Record the pick in TipShown so the no-repeat rule self-enforces.
 *
 * Failure modes are explicit:
 *   - User has no child → throws. Callers should redirect to /onboarding.
 *   - No candidates at all (e.g., bone-dry seed) → returns null.
 *
 * Used by:
 *   - Phase 3: GET /api/tips/today and the dashboard server component.
 *   - Phase 4: the morning-email cron.
 */

import { prisma } from "@/lib/prisma";
import {
  pickTip,
  ageInMonths,
  todayKeyFor,
  type TipCandidate,
} from "@/lib/tipSelector";
import type { Tip } from "@prisma/client";

const NO_REPEAT_WINDOW_DAYS = 30;

export interface DailyTipResult {
  tip: Tip;
  ageMonths: number;
}

export async function getDailyTip(userId: string): Promise<DailyTipResult | null> {
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

  if (!user) throw new Error(`User ${userId} not found`);
  const child = user.children[0];
  if (!child) throw new Error(`User ${userId} has no child profile`);

  const ageMonths = ageInMonths(child.birthdate);

  // Recently-shown tip ids — anything within the cutoff is filtered out.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - NO_REPEAT_WINDOW_DAYS);
  const recent = await prisma.tipShown.findMany({
    where: { userId, shownAt: { gt: cutoff } },
    select: { tipId: true },
  });
  const recentIds = recent.map((r) => r.tipId);

  // Candidate tips: published, age-eligible, not in the recent set.
  const candidates = await prisma.tip.findMany({
    where: {
      publishedAt: { not: null, lte: new Date() },
      ageMinMonths: { lte: ageMonths },
      ageMaxMonths: { gte: ageMonths },
      ...(recentIds.length > 0 ? { id: { notIn: recentIds } } : {}),
    },
  });

  if (candidates.length === 0) {
    // Graceful fallback: relax the recency filter rather than show nothing.
    // (If even that yields nothing we genuinely have no tips for this age.)
    const fallback = await prisma.tip.findMany({
      where: {
        publishedAt: { not: null, lte: new Date() },
        ageMinMonths: { lte: ageMonths },
        ageMaxMonths: { gte: ageMonths },
      },
    });
    if (fallback.length === 0) return null;
    candidates.push(...fallback);
  }

  const lite: (TipCandidate & { full: Tip })[] = candidates.map((t) => ({
    id: t.id,
    slug: t.slug,
    ageMinMonths: t.ageMinMonths,
    ageMaxMonths: t.ageMaxMonths,
    category: t.category,
    goalsHit: t.goalsHit,
    helpfulCount: t.helpfulCount,
    notHelpfulCount: t.notHelpfulCount,
    full: t,
  }));

  const picked = pickTip({
    candidates: lite,
    ageMonths,
    topGoal: user.topGoal,
    todayKey: todayKeyFor(userId),
  });

  if (!picked) return null;

  // Record the show (upsert so re-shows update shownAt, preserving the
  // unique constraint on (userId, tipId)).
  await prisma.tipShown.upsert({
    where: { userId_tipId: { userId, tipId: picked.id } },
    create: { userId, tipId: picked.id },
    update: { shownAt: new Date() },
  });

  return { tip: picked.full, ageMonths };
}
