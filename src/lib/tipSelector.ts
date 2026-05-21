/**
 * Pure tip-selection logic.
 *
 * Lives separately from the DB layer so we can unit-test it without a
 * running Postgres. The DB wrapper (`getDailyTip.ts`) is responsible for:
 *   - Loading published candidates filtered by age
 *   - Filtering out tips shown in the last 30 days
 *   - Persisting the TipShown record after a pick
 *
 * This file does the actual scoring + deterministic pick.
 */

import type { Goal, TipCategory } from "@prisma/client";

export interface TipCandidate {
  id: string;
  slug: string;
  ageMinMonths: number;
  ageMaxMonths: number;
  category: TipCategory;
  goalsHit: Goal[];
  helpfulCount: number;
  notHelpfulCount: number;
}

export interface SelectorInput<T extends TipCandidate = TipCandidate> {
  /** Candidates already filtered by DB (published, age-eligible, not shown lately). */
  candidates: T[];
  /** Child age in months. Used for both filter (in DB) and proximity scoring (here). */
  ageMonths: number;
  /** User's top goal — boosts matching tips. */
  topGoal: Goal | null;
  /** Stable per-user-per-day key (e.g., `${userId}:${YYYY-MM-DD}`). Drives determinism. */
  todayKey: string;
}

/**
 * Score a single tip. Higher is better.
 *
 * Components:
 *   +5 if the tip explicitly hits the user's top goal
 *   +2 if the tip's category aligns with the top goal (loose match)
 *   +0..3 age proximity bonus — tips centered on the child's age win ties
 *   −x bad-feedback penalty — tips with notHelpful > helpful drop sharply
 *
 * Kept small and explicit so changes are easy to reason about.
 */
export function scoreTip<T extends TipCandidate>(
  tip: T,
  ageMonths: number,
  topGoal: Goal | null
): number {
  let score = 0;

  // Goal hit — strongest single signal.
  if (topGoal && tip.goalsHit.includes(topGoal)) {
    score += 5;
  }

  // Category aligns with the top goal (e.g., goal=sleep, category=sleep).
  if (topGoal && categoryAlignsWithGoal(tip.category, topGoal)) {
    score += 2;
  }

  // Age proximity — distance from the band's midpoint, normalized to 0..3.
  const mid = (tip.ageMinMonths + tip.ageMaxMonths) / 2;
  const bandWidth = Math.max(1, tip.ageMaxMonths - tip.ageMinMonths);
  const distance = Math.abs(ageMonths - mid);
  const proximity = Math.max(0, 3 - (distance / bandWidth) * 3);
  score += proximity;

  // Feedback penalty. Only applied when there's enough signal (>=5 votes).
  const totalVotes = tip.helpfulCount + tip.notHelpfulCount;
  if (totalVotes >= 5) {
    const helpfulRatio = tip.helpfulCount / totalVotes;
    if (helpfulRatio < 0.5) {
      // Down-weight up to −4 for tips that consistently flop.
      score -= (0.5 - helpfulRatio) * 8;
    }
  }

  return score;
}

function categoryAlignsWithGoal(category: TipCategory, goal: Goal): boolean {
  if (category === "sleep" && goal === "sleep") return true;
  if (category === "nutrition" && goal === "feeding") return true;
  if (category === "milestones" && goal === "milestones") return true;
  if (category === "self_care" && goal === "self_care") return true;
  return false;
}

/**
 * FNV-1a 32-bit hash — small, fast, no deps. Used to deterministically
 * pick from a top-scoring set given (userId, date). Not cryptographic.
 */
export function hashString(s: string): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    // Multiplication by FNV prime (16777619), kept inside 32-bit
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/**
 * Pick today's tip from the candidates. Pure.
 *
 * Behavior:
 *   - No candidates → null
 *   - One candidate → that one
 *   - Multiple → score all, take the top N (where N=3 by default), then
 *     deterministically pick one using hash(todayKey). This gives the user
 *     "today's tip" stability while still varying day-to-day.
 */
export function pickTip<T extends TipCandidate>(
  input: SelectorInput<T>,
  options?: { topN?: number }
): T | null {
  const { candidates, ageMonths, topGoal, todayKey } = input;
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!;

  const topN = options?.topN ?? 3;

  const scored = candidates.map((tip) => ({
    tip,
    score: scoreTip(tip, ageMonths, topGoal),
  }));

  // Sort: score desc, then slug asc for total ordering (so the same set of
  // ties resolves the same way regardless of input order).
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.tip.slug.localeCompare(b.tip.slug);
  });

  const pool = scored.slice(0, Math.min(topN, scored.length));
  const index = hashString(todayKey) % pool.length;
  return pool[index]!.tip;
}

/**
 * Compute child age in whole months. Convention: an infant born today is
 * 0 months old until the same day next month.
 */
export function ageInMonths(birthdate: Date, asOf: Date = new Date()): number {
  let months =
    (asOf.getFullYear() - birthdate.getFullYear()) * 12 +
    (asOf.getMonth() - birthdate.getMonth());
  if (asOf.getDate() < birthdate.getDate()) months -= 1;
  return Math.max(0, months);
}

/**
 * Compose the deterministic per-day key. Exposed so tests and the DB
 * wrapper can build it the same way.
 */
export function todayKeyFor(userId: string, asOf: Date = new Date()): string {
  const y = asOf.getFullYear();
  const m = String(asOf.getMonth() + 1).padStart(2, "0");
  const d = String(asOf.getDate()).padStart(2, "0");
  return `${userId}:${y}-${m}-${d}`;
}
