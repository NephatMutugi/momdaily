/**
 * Pure streak computation.
 *
 * The DB layer (`/api/habits/log`, dashboard server component) is responsible
 * for fetching the distinct dates on which the user logged at least one
 * habit positively. This file does the consecutive-day arithmetic.
 *
 * A streak day = a day where the user logged any habit with value=true.
 * Habit-formation products are kinder when the bar is "showed up," not
 * "completed everything."
 *
 * States we model:
 *   - "Today is logged" → streak counts through today.
 *   - "Yesterday logged, today not yet" → streak still alive, runs through
 *     yesterday. The UI nudges: "log today to keep it going."
 *   - "Yesterday not logged" → streak = 0. (You can revive it by logging today.)
 *
 * Timezone: dates passed in must already be normalized to the user's local
 * date (UTC-midnight Date objects). That conversion happens at the API layer.
 */

export type DayKey = string; // "YYYY-MM-DD"

export interface StreakResult {
  /** Number of consecutive days ending today or yesterday. */
  length: number;
  /** True if the streak includes today (i.e., today is already logged). */
  includesToday: boolean;
}

/**
 * Format a Date as "YYYY-MM-DD" using its UTC parts. Inputs to this module
 * should be UTC-midnight Dates representing the user's local date.
 */
export function toDayKey(d: Date): DayKey {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add `n` days to a UTC-midnight Date (returns a new Date). */
export function addDaysUTC(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
}

/**
 * Compute streak from a set of logged dates and "today".
 *
 * `loggedDates` may be in any order; we de-duplicate to day keys internally.
 * `today` should be the user's local date at UTC midnight.
 */
export function computeStreak(
  loggedDates: Date[],
  today: Date
): StreakResult {
  const logged = new Set<DayKey>(loggedDates.map(toDayKey));
  const todayKey = toDayKey(today);

  const includesToday = logged.has(todayKey);

  // Walk backwards from today (or yesterday, if today isn't logged yet).
  let cursor = includesToday ? today : addDaysUTC(today, -1);
  let length = 0;

  // Cap the walk at 10 years to prevent pathological loops on bad data.
  const HARD_CAP = 366 * 10;
  for (let i = 0; i < HARD_CAP; i++) {
    if (!logged.has(toDayKey(cursor))) break;
    length += 1;
    cursor = addDaysUTC(cursor, -1);
  }

  return { length, includesToday };
}

/**
 * Convert any Date into the corresponding "midnight UTC" Date for the
 * given IANA timezone. Used by the API layer to normalize "now" into the
 * user's local date before passing to computeStreak.
 *
 * Implementation: format the date in the target tz, then construct a new
 * UTC midnight from those parts. Avoids pulling in date-fns-tz for one fn.
 */
export function startOfLocalDayUTC(
  d: Date,
  timeZone: string
): Date {
  // Intl gives us the parts in the target tz. en-CA gives "YYYY-MM-DD" order
  // for the date-only formatter, which is convenient.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return new Date(`${y}-${m}-${day}T00:00:00.000Z`);
}
