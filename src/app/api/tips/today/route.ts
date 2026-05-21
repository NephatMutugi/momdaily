import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDailyTip } from "@/lib/getDailyTip";

/**
 * GET /api/tips/today
 *
 * Returns today's tip for the signed-in user. Idempotent for a given day —
 * the deterministic selector keeps the same pick stable until the next day,
 * or until 30 days have passed (whichever comes first).
 *
 * Currently the dashboard server component reads the tip directly via
 * getDailyTip(), so this endpoint exists primarily for client-side refresh
 * and for the morning email cron in Phase 4.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getDailyTip(session.user.id);
    if (!result) {
      return NextResponse.json(
        { tip: null, ageMonths: null, message: "No tips available for this age" },
        { status: 200 }
      );
    }
    const { tip, ageMonths } = result;
    return NextResponse.json({
      tip: {
        id: tip.id,
        slug: tip.slug,
        title: tip.title,
        body: tip.body,
        category: tip.category,
        sources: tip.sources,
      },
      ageMonths,
    });
  } catch (err) {
    console.error("today tip error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
