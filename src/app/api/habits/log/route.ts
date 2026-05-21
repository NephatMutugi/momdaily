import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { consume, PROFILE_LIMIT } from "@/lib/rate-limit";
import {
  computeStreak,
  startOfLocalDayUTC,
  addDaysUTC,
} from "@/lib/streak";

/**
 * POST /api/habits/log
 *
 * Body: { habitId: string, value: boolean }
 *
 * Toggles today's log for a habit (unique on userId+habitId+loggedDate, so
 * re-checking just updates `value`). Returns the user's updated streak so
 * the UI can update without a full server round-trip.
 *
 * "Today" is computed in the user's stored timezone — a mom in Honolulu at
 * 11pm logs against her local Tuesday, not the UTC Wednesday.
 */

const Body = z.object({
  habitId: z.string().min(1).max(40),
  value: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consume(`habits:${session.user.id}`, PROFILE_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many updates. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { habitId, value } = parsed.data;

  // Fetch user (for timezone) + verify the habit belongs to them in one go.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: session.user.id },
    select: { id: true },
  });
  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const today = startOfLocalDayUTC(new Date(), user.timezone || "UTC");

  try {
    await prisma.habitLog.upsert({
      where: {
        userId_habitId_loggedDate: {
          userId: session.user.id,
          habitId,
          loggedDate: today,
        },
      },
      create: {
        userId: session.user.id,
        habitId,
        loggedDate: today,
        value,
      },
      update: { value },
    });

    // Recompute streak. We only need positive logs in the last ~400 days.
    const since = addDaysUTC(today, -400);
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

    return NextResponse.json({ ok: true, streak });
  } catch (err) {
    console.error("habit log error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
