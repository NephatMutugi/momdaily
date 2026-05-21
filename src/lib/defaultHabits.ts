/**
 * The three default habits seeded on onboarding completion. Each has a
 * stable `key` (used for idempotent seeding + future analytics) and a
 * user-facing `label`. Users can rename labels later (Phase 4+) without
 * losing historical logs because logs are tied to habitId, not label.
 */

import { prisma } from "@/lib/prisma";

export interface DefaultHabit {
  key: string;
  label: string;
  sortOrder: number;
}

export const DEFAULT_HABITS: DefaultHabit[] = [
  { key: "baby_fed", label: "Baby fed well today", sortOrder: 0 },
  { key: "baby_slept", label: "Baby slept ok", sortOrder: 1 },
  { key: "me_time", label: "I took 5 minutes for me", sortOrder: 2 },
];

/**
 * Idempotent: safe to call multiple times. Uses upsert on (userId, key)
 * so re-running won't duplicate or overwrite a user's edited labels.
 */
export async function ensureDefaultHabits(userId: string): Promise<void> {
  for (const h of DEFAULT_HABITS) {
    await prisma.habit.upsert({
      where: { userId_key: { userId, key: h.key } },
      create: {
        userId,
        key: h.key,
        label: h.label,
        sortOrder: h.sortOrder,
        active: true,
      },
      // Only seed once. If a user has customised the label, we don't clobber it.
      update: {},
    });
  }
}
