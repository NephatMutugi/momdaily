import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { consume, PROFILE_LIMIT } from "@/lib/rate-limit";

/**
 * POST /api/tips/feedback
 *
 * Body: { tipId: string, helpful: boolean }
 *
 * Records one vote per user per tip (re-submitting flips the vote). The
 * aggregate helpfulCount / notHelpfulCount columns on Tip are updated in
 * the same transaction so reads are cheap (no per-request aggregation).
 */

const Body = z.object({
  tipId: z.string().min(1).max(40),
  helpful: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consume(`feedback:${session.user.id}`, PROFILE_LIMIT);
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
  const { tipId, helpful } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Find the previous vote (if any) so we can correct the aggregate
      // counts when the user flips their vote.
      const previous = await tx.tipFeedback.findUnique({
        where: { userId_tipId: { userId: session.user.id, tipId } },
        select: { helpful: true },
      });

      await tx.tipFeedback.upsert({
        where: { userId_tipId: { userId: session.user.id, tipId } },
        create: { userId: session.user.id, tipId, helpful },
        update: { helpful },
      });

      if (!previous) {
        // First-time vote — increment the matching aggregate.
        await tx.tip.update({
          where: { id: tipId },
          data: helpful
            ? { helpfulCount: { increment: 1 } }
            : { notHelpfulCount: { increment: 1 } },
        });
      } else if (previous.helpful !== helpful) {
        // Flipped vote — decrement old side, increment new side.
        await tx.tip.update({
          where: { id: tipId },
          data: helpful
            ? {
                helpfulCount: { increment: 1 },
                notHelpfulCount: { decrement: 1 },
              }
            : {
                helpfulCount: { decrement: 1 },
                notHelpfulCount: { increment: 1 },
              },
        });
      }
      // No change → no aggregate update needed.
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("tip feedback error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
