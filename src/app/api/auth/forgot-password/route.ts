import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  consume,
  FORGOT_PASSWORD_IP_LIMIT,
  FORGOT_PASSWORD_EMAIL_LIMIT,
} from "@/lib/rate-limit";
import { RESET_TOKEN_TTL_MS } from "@/lib/passwordResetToken";
import { createResetTokenForUser } from "@/lib/passwordResetTokenDb";
import { sendPasswordResetEmail } from "@/lib/sendPasswordResetEmail";
import { getAppOrigin, isResendConfigured } from "@/lib/resend";

/**
 * POST /api/auth/forgot-password
 *
 * Privacy-preserving:
 *   - Always returns 200 { ok: true } regardless of whether the email exists,
 *     so an attacker can't enumerate registered emails.
 *   - Rate-limited by IP AND by email, but rate-limit overflow still returns
 *     200 (we just skip the send) — same reason.
 *   - Logs internally on every send / skip so we can audit if needed.
 *
 * Edge case: user has no passwordHash (Google-only signup). We don't email
 * them a reset link (it wouldn't help — there's no password to reset).
 * Same outward 200 response.
 */

const ForgotSchema = z.object({
  email: z.string().email("Invalid email"),
});

function ipKey(req: NextRequest, prefix: string): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return `${prefix}:${fwd.split(",")[0]!.trim()}`;
  const real = req.headers.get("x-real-ip");
  if (real) return `${prefix}:${real}`;
  return `${prefix}:anon`;
}

// Always-success body. Defined once so the response shape is identical for
// every code path the caller can see.
const OK_RESPONSE = { ok: true } as const;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Even on bad JSON, return 200 — same reasoning as above. An attacker
    // probing the endpoint should learn nothing.
    return NextResponse.json(OK_RESPONSE, { status: 200 });
  }

  const parsed = ForgotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(OK_RESPONSE, { status: 200 });
  }
  const email = parsed.data.email.toLowerCase().trim();

  // Per-IP rate limit. If exhausted, still 200 — but skip work.
  const ipLimit = consume(ipKey(req, "forgot-ip"), FORGOT_PASSWORD_IP_LIMIT);
  if (!ipLimit.ok) {
    // No console.warn here — that would let an attacker correlate logs to
    // failures. Silent skip.
    return NextResponse.json(OK_RESPONSE, { status: 200 });
  }

  // Per-email rate limit. Same handling.
  const emailLimit = consume(
    `forgot-email:${email}`,
    FORGOT_PASSWORD_EMAIL_LIMIT
  );
  if (!emailLimit.ok) {
    return NextResponse.json(OK_RESPONSE, { status: 200 });
  }

  // Do the actual work. Wrap in try/catch so DB / SMTP failures still return
  // 200 to the client (the caller can't distinguish "not found" from
  // "failed to send" — neither is actionable for the legitimate user, and
  // both leak info to an attacker).
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, passwordHash: true },
    });

    // Skip silently for: unknown email, or user has no password (Google-only).
    if (!user || !user.passwordHash) {
      return NextResponse.json(OK_RESPONSE, { status: 200 });
    }

    // If Resend isn't configured (dev environment without the key), don't
    // crash — just log so the dev knows why no email arrived. Production
    // catches this via the DEPLOY.md checklist.
    if (!isResendConfigured()) {
      console.warn(
        "[forgot-password] RESEND_API_KEY not set — skipping send for",
        email
      );
      return NextResponse.json(OK_RESPONSE, { status: 200 });
    }

    const { plaintext } = await createResetTokenForUser(user.id);
    const resetUrl = `${getAppOrigin()}/reset-password?token=${encodeURIComponent(
      plaintext
    )}`;

    await sendPasswordResetEmail({
      to: email,
      name: user.name,
      resetUrl,
      expiresInMinutes: Math.round(RESET_TOKEN_TTL_MS / 60000),
    });
  } catch (err) {
    // Log server-side so a dev can investigate; client sees no difference.
    console.error("[forgot-password] error for", email, err);
  }

  return NextResponse.json(OK_RESPONSE, { status: 200 });
}
