/**
 * Password reset token — pure helpers (no DB).
 *
 * Split from the DB-touching code (`passwordResetTokenDb.ts`) so unit tests
 * can exercise the crypto primitives without a Prisma client loaded.
 *
 * Design:
 *   - Token = 32 random bytes (256 bits), base64url-encoded → fits in a URL.
 *   - We store the sha256 HASH in the DB, never the plaintext. A DB leak
 *     therefore doesn't enable account takeover via the reset table.
 *   - 60-minute expiry. Single-use enforced via the DB layer's `usedAt`.
 */

import { randomBytes, createHash } from "node:crypto";

// 60 minutes. Long enough for an interrupted parent to come back to it,
// short enough that a leaked inbox attack window stays small.
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface GeneratedToken {
  /** Plaintext token to put in the email URL. Never store this. */
  plaintext: string;
  /** sha256 hex digest stored in the DB. */
  hash: string;
}

/**
 * Generate a fresh token. Returns both forms; caller emails `plaintext` and
 * persists `hash`.
 */
export function generateResetToken(): GeneratedToken {
  // 32 random bytes → 43 chars in base64url. Plenty of entropy (~256 bits).
  const plaintext = randomBytes(32).toString("base64url");
  const hash = hashToken(plaintext);
  return { plaintext, hash };
}

/**
 * sha256 hex digest. Used both when persisting (after generate) and when
 * verifying (an incoming token from the reset page).
 */
export function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}
