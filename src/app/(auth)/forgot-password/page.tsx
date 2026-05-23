"use client";

/**
 * /forgot-password — request a reset link.
 *
 * UX notes:
 *   - Success state always shows the same message ("If an account…") whether
 *     the email exists or not. Matches the API's privacy-preserving
 *     always-200 response.
 *   - We don't show inline errors for "rate-limited" — the server quietly
 *     returns 200 in that case too. Better to be consistent than to leak
 *     "we throttled you" through the UI.
 *   - Loading state disables the button so the form can't double-submit.
 */

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always advance to the success state, no matter what the API says.
      setSubmitted(true);
    } catch {
      // Network errors land here. Still show success — see top-of-file note.
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md min-h-[100dvh] flex flex-col p-6">
      <div className="pt-10 pb-6">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="mt-2 text-[var(--fg-muted)] text-sm">
          Enter the email you signed up with. We&apos;ll send you a link to
          choose a new password.
        </p>
      </div>

      {submitted ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl px-4 py-4 text-sm"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
            border: "1px solid var(--accent)",
          }}
        >
          If an account with that email exists, we&apos;ve sent a reset
          link. Check your inbox — and your spam folder, just in case. The
          link expires in 60 minutes.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="block text-sm mb-1.5 text-[var(--fg-muted)]">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoFocus
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-2"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-[var(--fg-muted)] text-center">
        Remembered it?{" "}
        <Link href="/login" className="underline">
          Back to log in
        </Link>
      </p>
    </main>
  );
}
