import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMagicLogToken } from "@/lib/magicLogToken";
import { startOfLocalDayUTC } from "@/lib/streak";

/**
 * GET /api/log/[token]
 *
 * One-click habit logging from the morning email. No session required.
 *
 * Token contains userId + habitId + value. We verify the signature, log
 * the habit against the user's local "today", and 302 to /dashboard with
 * a query param the client uses to render a toast.
 *
 * The redirect strategy (rather than rendering inline) gives moms a
 * consistent landing place — they tap the email, end up on their dashboard,
 * see the streak update, and can keep going.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const origin = new URL(req.url).origin;

  const verified = await verifyMagicLogToken(token);
  if (!verified.ok) {
    const reason = verified.reason; // "expired" | "invalid" | "malformed"
    return NextResponse.redirect(
      `${origin}/login?from=magic-link&error=${reason}`,
      { status: 302 }
    );
  }

  const { userId, habitId, value } = verified.payload;

  // Confirm the habit still belongs to the user (defensive — could've been
  // deleted, or the token could be replayed against a habit that was
  // reassigned somehow).
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { id: true },
  });
  if (!habit) {
    return NextResponse.redirect(
      `${origin}/dashboard?logged=missing`,
      { status: 302 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const today = startOfLocalDayUTC(new Date(), user?.timezone || "UTC");

  try {
    await prisma.habitLog.upsert({
      where: {
        userId_habitId_loggedDate: { userId, habitId, loggedDate: today },
      },
      create: { userId, habitId, loggedDate: today, value },
      update: { value },
    });
  } catch (err) {
    console.error("magic log error", err);
    return NextResponse.redirect(
      `${origin}/dashboard?logged=error`,
      { status: 302 }
    );
  }

  return NextResponse.redirect(`${origin}/dashboard?logged=ok`, {
    status: 302,
  });
}
