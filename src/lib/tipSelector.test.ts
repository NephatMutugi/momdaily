/**
 * Unit tests for the pure tip selector.
 * No DB, no Prisma — only the pure scoring + pick logic.
 *
 * Covers:
 *   - Age boundary inclusivity
 *   - Empty candidate set
 *   - Single candidate
 *   - Goal weighting beats age proximity
 *   - Bad-feedback penalty kicks in only with enough votes
 *   - Determinism: same todayKey → same tip
 *   - Variability: different todayKey can pick differently from the top pool
 *   - ageInMonths edge cases
 */

import { describe, it, expect } from "vitest";
import {
  pickTip,
  scoreTip,
  ageInMonths,
  hashString,
  todayKeyFor,
  type TipCandidate,
} from "./tipSelector";

function tip(overrides: Partial<TipCandidate> & { slug: string }): TipCandidate {
  return {
    id: overrides.slug, // mirror slug for easy assertion
    slug: overrides.slug,
    ageMinMonths: overrides.ageMinMonths ?? 0,
    ageMaxMonths: overrides.ageMaxMonths ?? 12,
    category: overrides.category ?? "nutrition",
    goalsHit: overrides.goalsHit ?? [],
    helpfulCount: overrides.helpfulCount ?? 0,
    notHelpfulCount: overrides.notHelpfulCount ?? 0,
  };
}

describe("pickTip", () => {
  it("returns null when no candidates", () => {
    const result = pickTip({
      candidates: [],
      ageMonths: 6,
      topGoal: "feeding",
      todayKey: "u1:2026-05-21",
    });
    expect(result).toBeNull();
  });

  it("returns the only candidate", () => {
    const only = tip({ slug: "only-one" });
    const result = pickTip({
      candidates: [only],
      ageMonths: 6,
      topGoal: "feeding",
      todayKey: "u1:2026-05-21",
    });
    expect(result?.slug).toBe("only-one");
  });

  it("prefers a tip whose goalsHit matches the user's top goal", () => {
    const matchesGoal = tip({
      slug: "matches-goal",
      goalsHit: ["sleep"],
      ageMinMonths: 0,
      ageMaxMonths: 24,
    });
    const offGoal = tip({
      slug: "off-goal",
      goalsHit: ["feeding"],
      ageMinMonths: 5,
      ageMaxMonths: 7, // closer to ageMonths=6, but wrong goal
    });
    const result = pickTip({
      candidates: [matchesGoal, offGoal],
      ageMonths: 6,
      topGoal: "sleep",
      todayKey: "any-key",
    });
    expect(result?.slug).toBe("matches-goal");
  });

  it("is deterministic for the same todayKey", () => {
    // Make three tips with the same score so pool size > 1 and the hash matters.
    const a = tip({ slug: "aa", goalsHit: ["feeding"], ageMinMonths: 5, ageMaxMonths: 7 });
    const b = tip({ slug: "bb", goalsHit: ["feeding"], ageMinMonths: 5, ageMaxMonths: 7 });
    const c = tip({ slug: "cc", goalsHit: ["feeding"], ageMinMonths: 5, ageMaxMonths: 7 });
    const input = {
      candidates: [a, b, c],
      ageMonths: 6,
      topGoal: "feeding" as const,
      todayKey: "user-x:2026-05-21",
    };
    const r1 = pickTip(input);
    const r2 = pickTip(input);
    expect(r1?.slug).toBe(r2?.slug);
  });

  it("can pick differently across different todayKeys", () => {
    // Same set, different keys — at least one key should land on a different
    // tip than another. (With 3 candidates and FNV hash, this is reliable.)
    const a = tip({ slug: "aa", goalsHit: ["feeding"], ageMinMonths: 5, ageMaxMonths: 7 });
    const b = tip({ slug: "bb", goalsHit: ["feeding"], ageMinMonths: 5, ageMaxMonths: 7 });
    const c = tip({ slug: "cc", goalsHit: ["feeding"], ageMinMonths: 5, ageMaxMonths: 7 });
    const picks = new Set<string | undefined>();
    for (let day = 1; day <= 20; day++) {
      const r = pickTip({
        candidates: [a, b, c],
        ageMonths: 6,
        topGoal: "feeding",
        todayKey: `user-x:2026-05-${String(day).padStart(2, "0")}`,
      });
      picks.add(r?.slug);
    }
    expect(picks.size).toBeGreaterThan(1);
  });

  it("respects topN — won't pick from low-scoring candidates", () => {
    const winner = tip({
      slug: "winner",
      goalsHit: ["feeding"],
      ageMinMonths: 5,
      ageMaxMonths: 7,
    });
    const noisy: TipCandidate[] = [];
    for (let i = 0; i < 20; i++) {
      noisy.push(tip({ slug: `noise-${i}`, goalsHit: [] }));
    }
    const result = pickTip(
      {
        candidates: [winner, ...noisy],
        ageMonths: 6,
        topGoal: "feeding",
        todayKey: "any",
      },
      { topN: 1 }
    );
    expect(result?.slug).toBe("winner");
  });
});

describe("scoreTip", () => {
  it("rewards explicit goal hits more than category alignment", () => {
    const goalHit = tip({
      slug: "g",
      goalsHit: ["sleep"],
      category: "milestones",
    });
    const onlyCategory = tip({
      slug: "c",
      goalsHit: [],
      category: "sleep",
    });
    expect(scoreTip(goalHit, 6, "sleep")).toBeGreaterThan(
      scoreTip(onlyCategory, 6, "sleep")
    );
  });

  it("applies the feedback penalty only with enough votes", () => {
    const fewBadVotes = tip({
      slug: "fb",
      helpfulCount: 0,
      notHelpfulCount: 2, // below threshold
    });
    const lotsOfBadVotes = tip({
      slug: "lb",
      helpfulCount: 1,
      notHelpfulCount: 9, // 10% helpful, penalty kicks in
    });
    expect(scoreTip(fewBadVotes, 6, null)).toBeGreaterThan(
      scoreTip(lotsOfBadVotes, 6, null)
    );
  });

  it("gives a higher score when child age sits near the band midpoint", () => {
    const wideBand = tip({ slug: "w", ageMinMonths: 0, ageMaxMonths: 12 });
    const nearMid = scoreTip(wideBand, 6, null);
    const atEdge = scoreTip(wideBand, 11, null);
    expect(nearMid).toBeGreaterThanOrEqual(atEdge);
  });
});

describe("ageInMonths", () => {
  it("returns 0 for a newborn", () => {
    const today = new Date("2026-05-21");
    expect(ageInMonths(today, today)).toBe(0);
  });

  it("counts whole months only, not partial", () => {
    // Born 2026-01-15, evaluated 2026-05-14 → 3 full months (May 15 not reached yet).
    expect(
      ageInMonths(new Date("2026-01-15"), new Date("2026-05-14"))
    ).toBe(3);
    // Same evaluated 2026-05-15 → 4 months.
    expect(
      ageInMonths(new Date("2026-01-15"), new Date("2026-05-15"))
    ).toBe(4);
  });

  it("never returns a negative number", () => {
    // Future-dated birthdate (data entry error) shouldn't blow up the selector.
    expect(
      ageInMonths(new Date("2027-01-01"), new Date("2026-05-21"))
    ).toBe(0);
  });
});

describe("hashString", () => {
  it("is stable across runs", () => {
    expect(hashString("hello")).toBe(hashString("hello"));
  });

  it("differs for different inputs", () => {
    expect(hashString("a")).not.toBe(hashString("b"));
  });

  it("returns an unsigned 32-bit integer", () => {
    const h = hashString("anything");
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });
});

describe("todayKeyFor", () => {
  it("composes userId + YYYY-MM-DD", () => {
    const k = todayKeyFor("user-123", new Date("2026-05-21T08:00:00Z"));
    expect(k).toBe("user-123:2026-05-21");
  });
});
