import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { consume, PROFILE_LIMIT } from "@/lib/rate-limit";

// One endpoint handles onboarding completion: name + child + goal in a single
// transaction. Keeping it atomic prevents "half-onboarded" zombie states.

const FeedingStage = z.enum(["breast", "formula", "mixed", "solids", "family_foods"]);
const Goal = z.enum(["sleep", "feeding", "milestones", "self_care"]);

const OnboardingSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  timezone: z.string().min(1).max(60).optional(),
  child: z.object({
    name: z.string().min(1).max(60).optional(),
    // Accept ISO date string (YYYY-MM-DD) or full ISO datetime.
    birthdate: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
      message: "Invalid date",
    }),
    feedingStage: FeedingStage,
    gender: z.string().max(40).optional(),
  }),
  topGoal: Goal,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consume(`profile:${session.user.id}`, PROFILE_LIMIT);
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

  const parsed = OnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, timezone, child, topGoal } = parsed.data;
  const birthdate = new Date(child.birthdate);

  // Sanity bounds: birthdate within the last 6 years and not in the future.
  // This catches typos before they hit downstream tip selection logic.
  const now = new Date();
  const sixYearsAgo = new Date(now.getFullYear() - 6, now.getMonth(), now.getDate());
  if (birthdate > now || birthdate < sixYearsAgo) {
    return NextResponse.json(
      { error: "Birthdate must be within the last 6 years and not in the future" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: name ?? undefined,
          timezone: timezone ?? undefined,
          topGoal,
          onboarded: true,
        },
      });
      await tx.child.create({
        data: {
          userId: session.user.id,
          name: child.name ?? null,
          birthdate,
          feedingStage: child.feedingStage,
          gender: child.gender ?? null,
        },
      });
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("onboarding error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
