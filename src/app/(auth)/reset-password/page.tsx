"use client";

/**
 * /reset-password?token=XXX — choose a new password.
 *
 * The token is read client-side from the URL, sent in the POST body, and
 * never persisted in localStorage. If the user navigates away the token is
 * effectively re-obtainable only from the original email.
 *
 * We don't pre-validate the token on page load (no extra API call). We
 * trust the server to reject invalid tokens on submit. This avoids
 * round-tripping for every user who just opens the link, and avoids the
 * "valid → went to make coffee → invalid" race.
 */

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Missing token in the URL → user got here without clicking the email link.
  // Show a static error instead of letting them submit blank tokens.
  if (!token) {
    return (
      <main className="mx-auto max-w-md min-h-[100dvh] flex flex-col p-6">
        <div className="pt-10 pb-6">
          <h1 className="text-2xl font-bold">Reset link missing</h1>
          <p className="mt-2 text-[var(--fg-muted)] text-sm">
            This page needs a reset token in the URL. Use the link from the
            email we sent, or request a new one below.
          </p>
        </div>
        <Link href="/forgot-password" className="btn btn-primary">
          Request a new link
        </Link>
      </main>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setLoading(false);
        return;
      }
      // Success → push to /login with the toast flag. We deliberately don't
      // auto-sign-in: the user proves they remember the new password they
      // just chose.
      router.push("/login?reset=ok");
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md min-h-[100dvh] flex flex-col p-6">
      <div className="pt-10 pb-6">
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="mt-2 text-[var(--fg-muted)] text-sm">
          Pick something you&apos;ll remember. At least 8 characters; a long
          phrase works best.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="block">
          <span className="block text-sm mb-1.5 text-[var(--fg-muted)]">
            New password
          </span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
              style={{ paddingRight: "44px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] p-2 rounded-md inline-flex items-center justify-center"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="block text-sm mb-1.5 text-[var(--fg-muted)]">
            Confirm new password
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>

        {error && (
          <p
            className="text-sm"
            style={{ color: "var(--danger)" }}
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary mt-2"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--fg-muted)] text-center">
        Link expired or not working?{" "}
        <Link href="/forgot-password" className="underline">
          Request a new link
        </Link>
      </p>
    </main>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams must run inside <Suspense> in App Router pages. The
  // surrounding shell renders a quiet fallback while the params hydrate.
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md min-h-[100dvh] flex flex-col p-6">
          <div className="pt-10 pb-6">
            <h1 className="text-2xl font-bold">Choose a new password</h1>
          </div>
        </main>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
