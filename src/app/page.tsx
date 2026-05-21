import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-md min-h-[100dvh] flex flex-col p-6 pt-16 sm:pt-24 gap-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">MomDaily</h1>
        <p className="text-[var(--fg-muted)] leading-relaxed">
          Two minutes a day. One tip, three tiny habits. We help you feel
          confident you did right by your child today.
        </p>
      </div>

      <div className="card space-y-2">
        <p className="text-sm font-semibold">Phase 0 placeholder</p>
        <p className="text-sm text-[var(--fg-muted)]">
          Auth, onboarding, and the daily dashboard land in Phase 1+. See
          <code className="mx-1 rounded bg-[var(--accent-soft)] px-1 py-0.5 text-xs">
            MOMDAILY_BUILD_PROMPT.md
          </code>
          for the full roadmap.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/signup" className="btn btn-primary" aria-disabled="true">
          Get started (coming Phase 1)
        </Link>
        <Link href="/login" className="btn btn-ghost" aria-disabled="true">
          I already have an account
        </Link>
      </div>
    </main>
  );
}
