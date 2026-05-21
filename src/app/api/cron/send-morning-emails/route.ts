import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMorningEmail } from "@/lib/sendMorningEmail";

/**
 * GET /api/cron/send-morning-emails
 *
 * Hourly cron entry point. Designed to be hit by Vercel Cron on the hour
 * (or by an external scheduler — see DEPLOY.md for Vercel free-tier notes).
 *
 * Authentication:
 *   Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. We accept that
 *   header OR Vercel's automatic `x-vercel-cron` header. Anything else is
 *   401'd so this can't be triggered by random web traffic.
 *
 * Logic each invocation:
 *   1. Determine "current UTC hour" — that's what we just got woken up for.
 *   2. For every user, compute their local hour in their stored timezone.
 *   3. If their local hour equals their EmailPreference.sendHourLocal AND
 *      morning email is enabled — schedule a send.
 *   4. Send sequentially (capped concurrency would be nicer at scale, but
 *      single-thread keeps the rate-limit story simple and Resend free
 *      tier is 10/sec).
 *   5. sendMorningEmail() is idempotent — even concurrent invocations
 *      can't double-mail thanks to the EmailSendLog unique constraint.
 *
 * Return shape includes counts so the Vercel Cron logs are useful.
 */

// 60s cap — comfortable for under ~3000 users at a few seconds per send.
// If you grow past that, batch by timezone group and parallelize.
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  // Vercel Cron sets x-vercel-cron=1 — trust if present and we're running on Vercel.
  if (req.headers.get("x-vercel-cron") === "1") return true;
  // Also accept a bearer token for local/manual testing or non-Vercel schedulers.
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const got = req.headers.get("authorization");
  return got === `Bearer ${expected}`;
}

interface CronSummary {
  candidates: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary: CronSummary = {
    candidates: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // We need to fan out per user because each user's local hour depends on
  // their stored timezone. Postgres can't compute that natively without
  // installing extensions, so we pull the (small) set of candidates and
  // filter in JS. This is fine up to ~50k onboarded users.
  const candidates = await prisma.user.findMany({
    where: {
      onboarded: true,
      OR: [
        { emailPreference: null },                     // legacy users — defaults
        { emailPreference: { morningEnabled: true } },
      ],
    },
    select: {
      id: true,
      timezone: true,
      emailPreference: { select: { sendHourLocal: true } },
    },
  });

  const now = new Date();

  for (const u of candidates) {
    const tz = u.timezone || "UTC";
    const sendHour = u.emailPreference?.sendHourLocal ?? 7;
    const localHour = currentHourIn(tz, now);
    if (localHour !== sendHour) continue;

    summary.candidates += 1;
    try {
      const result = await sendMorningEmail(u.id);
      if (result.status === "sent") summary.sent += 1;
      else if (result.status === "skipped") summary.skipped += 1;
      else {
        summary.failed += 1;
        if (result.reason) summary.errors.push(`${u.id}: ${result.reason}`);
      }
    } catch (err) {
      summary.failed += 1;
      summary.errors.push(
        `${u.id}: ${(err as Error).message || "unknown error"}`
      );
      console.error("morning cron failure for", u.id, err);
    }
  }

  return NextResponse.json(summary);
}

function currentHourIn(timeZone: string, d: Date): number {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).format(d);
  // en-US with hour12=false can return "24" at midnight on some platforms — normalize.
  const h = parseInt(hourStr, 10);
  return h === 24 ? 0 : h;
}
