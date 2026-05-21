import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { consume, PROFILE_LIMIT } from "@/lib/rate-limit";

/**
 * POST /api/tips/save
 *
 * Body: { tipId: string }
 *
 * Toggles a bookmark: if the user hasn't saved this tip, save it; if they
 * have, remove it. Returns { saved: boolean } so the client can update
 * optimistic state without a refetch.
 */

const Body = z.object({
  tipId: z.string().min(1).max(40),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consume(`save:${session.user.id}`, PROFILE_LIMIT);
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
  const { tipId } = parsed.data;

  try {
    const existing = await prisma.tipSave.findUnique({
      where: { userId_tipId: { userId: session.user.id, tipId } },
    });

    if (existing) {
      await prisma.tipSave.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }

    await prisma.tipSave.create({
      data: { userId: session.user.id, tipId },
    });
    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error("tip save error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
