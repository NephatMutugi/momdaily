/**
 * Resend client wrapper — minimal version, used only for password reset.
 *
 * Centralized so:
 *   - API key check happens once and fails loud on missing config.
 *   - The `from` address is computed in one place.
 *   - Future transactional emails (account-deletion confirmation, etc.) can
 *     reuse this without re-wrapping Resend.
 *
 * Resend free tier: 100 emails/day, 3,000/month — orders of magnitude more
 * than a password-reset endpoint will ever generate.
 */

import { Resend } from "resend";

let cached: Resend | null = null;

export function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Get a key at https://resend.com and add it to .env"
    );
  }
  cached = new Resend(key);
  return cached;
}

export function getFromAddress(): string {
  // Format: "MomDaily <hello@yourdomain.com>". Falls back to Resend's
  // shared sandbox address for local dev where you haven't verified a domain.
  return process.env.EMAIL_FROM || "MomDaily <onboarding@resend.dev>";
}

export function getAppOrigin(): string {
  // Order: explicit env > NEXTAUTH_URL (Vercel autosets) > localhost.
  return (
    process.env.APP_ORIGIN ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}

/**
 * True if Resend is configured. Lets the forgot-password endpoint skip the
 * send (instead of crashing) in environments where the key isn't set —
 * useful for local dev when you don't want to bother provisioning Resend.
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
