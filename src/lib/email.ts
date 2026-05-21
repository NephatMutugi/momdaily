/**
 * Resend client wrapper.
 *
 * Centralized so:
 *   - The API key check happens once (and fails loud on missing config).
 *   - Tests can mock the module without poking around in templates.
 *   - We can swap providers later (Postmark, SES) without rewriting senders.
 *
 * Resend free tier: 100 emails/day, 3,000/month — fine through beta.
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
  // Format: "MomDaily <hello@yourdomain.com>"
  return process.env.EMAIL_FROM || "MomDaily <onboarding@resend.dev>";
}

export function getAppOrigin(): string {
  // Order: explicit env (production) > NEXTAUTH_URL (Vercel autosets) > localhost.
  return (
    process.env.APP_ORIGIN ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}
