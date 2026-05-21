import { describe, it, expect } from "vitest";
import {
  computeStreak,
  toDayKey,
  addDaysUTC,
  startOfLocalDayUTC,
} from "./streak";

const utc = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe("computeStreak", () => {
  it("returns 0 for an empty log set", () => {
    const today = utc("2026-05-21");
    expect(computeStreak([], today)).toEqual({
      length: 0,
      includesToday: false,
    });
  });

  it("counts a single log on today", () => {
    const today = utc("2026-05-21");
    expect(computeStreak([utc("2026-05-21")], today)).toEqual({
      length: 1,
      includesToday: true,
    });
  });

  it("keeps yesterday's streak alive when today isn't logged yet", () => {
    const today = utc("2026-05-21");
    const result = computeStreak(
      [utc("2026-05-19"), utc("2026-05-20")],
      today
    );
    expect(result.length).toBe(2);
    expect(result.includesToday).toBe(false);
  });

  it("breaks the streak when yesterday is missing", () => {
    const today = utc("2026-05-21");
    // Today not logged, yesterday not logged → 0 (regardless of older history)
    const result = computeStreak(
      [utc("2026-05-15"), utc("2026-05-16"), utc("2026-05-17")],
      today
    );
    expect(result).toEqual({ length: 0, includesToday: false });
  });

  it("includes today plus all consecutive prior days", () => {
    const today = utc("2026-05-21");
    const result = computeStreak(
      [
        utc("2026-05-17"),
        utc("2026-05-18"),
        utc("2026-05-19"),
        utc("2026-05-20"),
        utc("2026-05-21"),
      ],
      today
    );
    expect(result).toEqual({ length: 5, includesToday: true });
  });

  it("stops counting at the first gap going backwards", () => {
    const today = utc("2026-05-21");
    // Logged today, yesterday, day before — gap — older logs.
    const result = computeStreak(
      [
        utc("2026-05-21"),
        utc("2026-05-20"),
        utc("2026-05-19"),
        // gap
        utc("2026-05-15"),
        utc("2026-05-14"),
      ],
      today
    );
    expect(result.length).toBe(3);
  });

  it("de-duplicates same-day logs (multiple habits logged the same day)", () => {
    const today = utc("2026-05-21");
    const result = computeStreak(
      [utc("2026-05-21"), utc("2026-05-21"), utc("2026-05-21")],
      today
    );
    expect(result).toEqual({ length: 1, includesToday: true });
  });

  it("ignores future-dated logs (data hygiene)", () => {
    // Today is May 21. A future-dated log (May 22) shouldn't bump the streak.
    const today = utc("2026-05-21");
    const result = computeStreak(
      [utc("2026-05-21"), utc("2026-05-22")],
      today
    );
    expect(result.length).toBe(1);
  });
});

describe("toDayKey", () => {
  it("formats UTC dates as YYYY-MM-DD", () => {
    expect(toDayKey(utc("2026-05-21"))).toBe("2026-05-21");
  });
  it("pads month and day", () => {
    expect(toDayKey(utc("2026-01-05"))).toBe("2026-01-05");
  });
});

describe("addDaysUTC", () => {
  it("adds positive days", () => {
    expect(toDayKey(addDaysUTC(utc("2026-05-21"), 3))).toBe("2026-05-24");
  });
  it("subtracts with negative", () => {
    expect(toDayKey(addDaysUTC(utc("2026-05-21"), -1))).toBe("2026-05-20");
  });
  it("crosses month boundaries", () => {
    expect(toDayKey(addDaysUTC(utc("2026-05-01"), -1))).toBe("2026-04-30");
  });
});

describe("startOfLocalDayUTC", () => {
  it("returns the user's local date at UTC midnight", () => {
    // At 03:00 UTC on May 21, it's still May 20 in Honolulu (UTC-10).
    const utcEarly = new Date("2026-05-21T03:00:00.000Z");
    expect(toDayKey(startOfLocalDayUTC(utcEarly, "Pacific/Honolulu"))).toBe(
      "2026-05-20"
    );
  });
  it("matches UTC for a UTC user", () => {
    const d = new Date("2026-05-21T15:30:00.000Z");
    expect(toDayKey(startOfLocalDayUTC(d, "UTC"))).toBe("2026-05-21");
  });
});
