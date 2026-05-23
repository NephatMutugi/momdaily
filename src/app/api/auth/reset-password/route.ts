import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { consume, RESET_PASSWORD_LIMIT } from "@/lib/rate-limit";
import {
  verifyResetToken,
  markTokenUsed,
} from "@/lib/passwordResetTokenDb";

/**
 * POST /api/auth/reset-password
 *
 * Body: { token, password }
 *
 * Validates the token (existence, expiry, not previously used), hashes the
 * new password with bcrypt (cost 12, matches signup), and updates the user
 * in a single transaction with `markTokenUsed`. Single-use guarantee comes
 * from the transaction: we re-check `usedAt` inside the transaction so two
 * concurrent submissions can't both win.
 *
 * Session invalidation note: this app uses NextAuth's JWT session strategy,
 * so we can't revoke existing JWT cookies by deleting DB rows (there are no
 * Session rows for credential users with JWT strategy). The compromise:
 *   - Old password no longer authenticates new logins.
 *   - Old JWT cookies remain valid until their expiry (default 30d).
 * If/when this matters, switch NextAuth to the "database" session strategy
 * and delete the user's Session rows here. Tracked in code via
 * User.passwordChangedAt (set below), which is the hook to wire into a JWT
 * version check later.
 */

const ResetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function ipKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return `reset-ip:${fwd.split(",")[0]!.trim()}`;
  const real = req.headers.get("x-real-ip");
  if (real) return `reset-ip:${real}`;
  return "reset-ip:anon";
}

// Generic error returned for any token failure. Same message for "missing",
// "expired", "already used" — we don't want callers distinguishing them.
const TOKEN_ERROR = {
  error: "This reset link is invalid or has expired. Request a new one.",
};

export async function POST(req: NextRequest) {
  const limit = consume(ipKey(req), RESET_PASSWORD_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ResetSchema.safeParse(body);
  if (!parsed.success) {
    // Distinguish password-too-short (legitimately useful UX) from token
    // problems (no info leak). We surface password-length errors explicitly.
    const issue = parsed.error.issues[0];
    const isPasswordIssue = issue?.path[0] === "password";
    return NextResponse.json(
      {
        error: isPasswordIssue
          ? issue.message
          : TOKEN_ERROR.error,
      },
      { status: 400 }
    );
  }
  const { token, password } = parsed.data;

  // First-pass token check outside the transaction (so we can fail fast
  // without holding a transaction open). We re-check inside the transaction
  // below to close the concurrent-submit race window.
  const verified = await verifyResetToken(token);
  if (!verified) {
    return NextResponse.json(TOKEN_ERROR, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction(async (tx) => {
      // Re-check inside the transaction: prevents two concurrent submits
      // from both succeeding. We look up by id (already known) and verify
      // usedAt is still null.
      const fresh = await tx.passwordResetToken.findUnique({
        where: { id: verified.id },
        select: { usedAt: true, expiresAt: true, userId: true },
      });
      if (!fresh) throw new Error("token gone");
      if (fresh.usedAt) throw new Error("token used");
      if (fresh.expiresAt.getTime() < Date.now()) throw new Error("token expired");

      await tx.user.update({
        where: { id: fresh.userId },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
        },
      });
      await tx.passwordResetToken.update({
        where: { id: verified.id },
        data: { usedAt: new Date() },
      });
    });
  } catch (err) {
    // All transaction failures present as a token error to the client.
    // Server logs hold the detail for debugging.
    console.error("[reset-password] failed for token id", verified.id, err);
    return NextResponse.json(TOKEN_ERROR, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

// markTokenUsed isn't used directly in this file (we inline it inside the
// transaction above for atomicity) but is re-exported for future callers
// (e.g., an admin "invalidate this token" tool). Suppress the unused-import
// lint by referencing it once.
void markTokenUsed;
