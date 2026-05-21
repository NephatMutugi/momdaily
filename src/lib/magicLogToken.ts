/**
 * Signed, time-bound tokens for one-click habit logging from email.
 *
 * Why this exists:
 *   The morning email contains buttons like "✅ Baby fed". When tapped, we
 *   need to log the habit *without* requiring the user to sign in (the
 *   whole point of magic-link logging — friction kills the loop).
 *
 * Security model:
 *   - HS256 JWT, signed with NEXTAUTH_SECRET (already in env, already long).
 *   - Payload: userId, habitId, value (always true), iat, exp.
 *   - Expiry: 24h. Short enough that a leaked token from yesterday's email
 *     doesn't grant ongoing write access. Long enough that morning emails
 *     opened late in the day still work.
 *   - Not single-use. The HabitLog upsert is idempotent (one row per
 *     habit-day, re-clicking just confirms the same value), so replay is
 *     a no-op rather than a vulnerability. Single-use would require a
 *     consumed-token table for marginal benefit.
 *
 * Why `jose` and not `jsonwebtoken`:
 *   `jose` is edge-runtime compatible (Vercel cron endpoints can run on
 *   edge), zero-dep, and ~5x smaller. The API is slightly more verbose
 *   but it's the right call for serverless.
 */

import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";
const ISSUER = "momdaily";
const AUDIENCE = "magic-log";
const EXPIRY = "24h";

export interface MagicLogPayload {
  userId: string;
  habitId: string;
  value: boolean;
}

function getKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "NEXTAUTH_SECRET is required to sign magic-link tokens — set it in .env"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signMagicLogToken(
  payload: MagicLogPayload
): Promise<string> {
  return await new SignJWT({
    uid: payload.userId,
    hid: payload.habitId,
    v: payload.value,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(EXPIRY)
    .sign(getKey());
}

export interface VerifyResult {
  ok: true;
  payload: MagicLogPayload;
}

export interface VerifyError {
  ok: false;
  reason: "expired" | "invalid" | "malformed";
}

export async function verifyMagicLogToken(
  token: string
): Promise<VerifyResult | VerifyError> {
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const uid = payload.uid;
    const hid = payload.hid;
    const v = payload.v;
    if (typeof uid !== "string" || typeof hid !== "string" || typeof v !== "boolean") {
      return { ok: false, reason: "malformed" };
    }
    return { ok: true, payload: { userId: uid, habitId: hid, value: v } };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "ERR_JWT_EXPIRED") return { ok: false, reason: "expired" };
    return { ok: false, reason: "invalid" };
  }
}
