/**
 * Password reset token — DB-touching helpers.
 *
 * Split from the pure crypto in `passwordResetToken.ts` so the crypto can
 * be unit-tested without a Prisma client. All functions here issue Postgres
 * queries.
 */

import { prisma } from "@/lib/prisma";
import {
  generateResetToken,
  hashToken,
  RESET_TOKEN_TTL_MS,
} from "@/lib/passwordResetToken";

export interface CreateResetTokenResult {
  plaintext: string;
  expiresAt: Date;
}

/**
 * Persist a new reset token for a user. Returns the plaintext (for the email
 * URL) and expiry. Caller is responsible for sending the email.
 */
export async function createResetTokenForUser(
  userId: string
): Promise<CreateResetTokenResult> {
  const { plaintext, hash } = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: hash, expiresAt },
  });
  return { plaintext, expiresAt };
}

export interface VerifiedToken {
  /** DB row id — caller marks `usedAt` after a successful reset. */
  id: string;
  userId: string;
}

/**
 * Look up a token by hashing the incoming plaintext and matching against the
 * unique index. Returns the row if the token exists, is unexpired, and
 * hasn't been used. Returns `null` for every failure mode — we don't
 * distinguish "doesn't exist" from "expired" from "used" because we don't
 * want the caller surfacing any of those to an attacker.
 */
export async function verifyResetToken(
  plaintext: string
): Promise<VerifiedToken | null> {
  if (!plaintext || typeof plaintext !== "string") return null;
  const hash = hashToken(plaintext);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return { id: row.id, userId: row.userId };
}

/**
 * Mark a token used. The main reset endpoint does this inside its own
 * transaction (so a crash mid-flow can't leave a usable token); this is
 * exposed for future admin / cleanup callers.
 */
export async function markTokenUsed(id: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}
