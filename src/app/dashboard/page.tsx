import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDailyTip } from "@/lib/getDailyTip";
import {
  computeStreak,
  startOfLocalDayUTC,
  addDaysUTC,
} from "@/lib/streak";
import { ensureDefaultHabits } from "@/lib/defaultHabits";
import { getForYouTips, listSavedTipIds } from "@/lib/tipBrowse";
import DashboardClient from "./DashboardClient";

/**
 * Phase 3 dashboard.
 *
 * Server component. Fetches everything up-front:
 *   - User + first child (for greeting + age)
 *   - Today's tip via getDailyTip()
 *   - Active habits + whether each was logged today (joined in one query)
 *   - Current streak from positive logs in the last 400 days
 *
 * Then hands it all to DashboardClient. The client only re-renders the
 * streak when the user toggles a habit (the toggle response includes the
 * recomputed streak so we don't need a full page refresh).
 *
 * Backfill consideration: users who completed onboarding before Phase 3
 * shipped don't have the default habits seeded. ensureDefaultHabits() is
 * idempotent and runs on every dashboard load — it's a no-op for new
 * users and a one-time backfill for old ones.
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      onboarded: true,
      timezone: true,
      topGoal: true,
      children: {
        select: { name: true, birthdate: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  // Backfill default habits if needed (idempotent — see file header).
  await ensureDefaultHabits(session.user.id);

  const timezone = user.timezone || "UTC";
  const today = startOfLocalDayUTC(new Date(), timezone);
  const since = addDaysUTC(today, -400);

  // Today's tip — getDailyTip() also records the show, enforcing the no-
  // repeats-in-30-days rule across page loads.
  let tipResult: Awaited<ReturnType<typeof getDailyTip>> = null;
  try {
    tipResult = await getDailyTip(session.user.id);
  } catch (err) {
    console.error("dashboard: getDailyTip failed", err);
  }

  // Active habits + today's log status in one query.
  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id, active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      logs: {
        where: { loggedDate: today },
        select: { value: true },
        take: 1,
      },
    },
  });

  // Positive logs in the recent window for streak computation. `distinct`
  // gives us one row per day even when multiple habits were logged.
  const positives = await prisma.habitLog.findMany({
    where: {
      userId: session.user.id,
      value: true,
      loggedDate: { gte: since },
    },
    select: { loggedDate: true },
    distinct: ["loggedDate"],
  });
  const streak = computeStreak(
    positives.map((p) => p.loggedDate),
    today
  );

  const child = user.children[0];

  // "For you" rail — additional tips beyond today's, scored by goal + age.
  const [forYouTips, savedIds] = await Promise.all([
    getForYouTips(session.user.id, {
      limit: 4,
      excludeTipIds: tipResult ? [tipResult.tip.id] : [],
    }),
    listSavedTipIds(session.user.id),
  ]);

  return (
    <DashboardClient
      greetingName={user.name ?? "there"}
      childName={child?.name ?? null}
      ageMonths={tipResult?.ageMonths ?? null}
      tip={
        tipResult
          ? {
              id: tipResult.tip.id,
              slug: tipResult.tip.slug,
              title: tipResult.tip.title,
              body: tipResult.tip.body,
              category: tipResult.tip.category,
              sources: tipResult.tip.sources,
            }
          : null
      }
      habits={habits.map((h) => ({
        id: h.id,
        label: h.label,
        loggedToday: (h.logs[0]?.value ?? false) === true,
      }))}
      streak={streak}
      forYouTips={forYouTips.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        body: t.body,
        category: t.category,
        ageMinMonths: t.ageMinMonths,
        ageMaxMonths: t.ageMaxMonths,
      }))}
      savedTipIds={Array.from(savedIds)}
    />
  );
}
