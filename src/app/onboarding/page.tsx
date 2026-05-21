"use client";

/**
 * Onboarding — 3 steps:
 *   1. Account-level confirmation (name, timezone defaulted from browser)
 *   2. Child profile (birthdate + feeding stage)
 *   3. Top goal (sleep / feeding / milestones / self-care)
 *
 * Posts atomically to /api/profile and redirects to /dashboard on success.
 * If unauthenticated, redirects to /login.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type FeedingStage = "breast" | "formula" | "mixed" | "solids" | "family_foods";
type Goal = "sleep" | "feeding" | "milestones" | "self_care";

const FEEDING_OPTIONS: { value: FeedingStage; label: string; hint: string }[] = [
  { value: "breast", label: "Breastfeeding", hint: "Exclusive or primarily" },
  { value: "formula", label: "Formula", hint: "Exclusive or primarily" },
  { value: "mixed", label: "Mixed feeding", hint: "Breast + formula" },
  { value: "solids", label: "Starting solids", hint: "First foods, purées" },
  { value: "family_foods", label: "Family foods", hint: "Eating what you eat" },
];

const GOAL_OPTIONS: { value: Goal; label: string; hint: string }[] = [
  { value: "sleep", label: "Better sleep", hint: "For baby — and for you" },
  { value: "feeding", label: "Feeding confidence", hint: "What, when, and how much" },
  { value: "milestones", label: "Milestones", hint: "Knowing what's next" },
  { value: "self_care", label: "Taking care of me", hint: "Small wins for mom" },
];

type Form = {
  name: string;
  childName: string;
  birthdate: string; // YYYY-MM-DD
  feedingStage: FeedingStage | "";
  topGoal: Goal | "";
};

const STEP_COUNT = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Form>({
    name: "",
    childName: "",
    birthdate: "",
    feedingStage: "",
    topGoal: "",
  });

  // Once session loads, seed the name field with whatever the user provided
  // at signup. They can still edit it.
  useEffect(() => {
    if (session?.user?.name && !form.name) {
      setForm((f) => ({ ...f, name: session.user!.name as string }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.name]);

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-md min-h-[100dvh] flex items-center justify-center p-6">
        <p className="text-[var(--fg-muted)]">Loading…</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const canAdvance = (() => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return form.birthdate !== "" && form.feedingStage !== "";
    if (step === 2) return form.topGoal !== "";
    return false;
  })();

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          timezone,
          child: {
            name: form.childName.trim() || undefined,
            birthdate: form.birthdate,
            feedingStage: form.feedingStage,
          },
          topGoal: form.topGoal,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save your details. Try again.");
        setSubmitting(false);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md min-h-[100dvh] flex flex-col p-6">
      {/* Progress dots */}
      <div className="pt-8 pb-6 flex items-center gap-2" aria-label="Onboarding progress">
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{
              background:
                i <= step ? "var(--accent)" : "var(--border)",
            }}
          />
        ))}
      </div>

      {step === 0 && (
        <section className="flex flex-col gap-4">
          <header>
            <h1 className="text-2xl font-bold">First, about you</h1>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              We&apos;ll use your name in your daily tip.
            </p>
          </header>
          <label className="block">
            <span className="block text-sm mb-1.5 text-[var(--fg-muted)]">
              Your name
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="Your first name"
              maxLength={60}
              autoComplete="given-name"
            />
          </label>
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-col gap-4">
          <header>
            <h1 className="text-2xl font-bold">About your little one</h1>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              We use age + feeding stage to pick the right tip each day.
            </p>
          </header>
          <label className="block">
            <span className="block text-sm mb-1.5 text-[var(--fg-muted)]">
              Child&apos;s name <span className="text-[var(--fg-muted)]">(optional)</span>
            </span>
            <input
              type="text"
              value={form.childName}
              onChange={(e) =>
                setForm((f) => ({ ...f, childName: e.target.value }))
              }
              placeholder="e.g., Maya"
              maxLength={60}
            />
          </label>
          <label className="block">
            <span className="block text-sm mb-1.5 text-[var(--fg-muted)]">
              Birthdate
            </span>
            <input
              type="date"
              value={form.birthdate}
              onChange={(e) =>
                setForm((f) => ({ ...f, birthdate: e.target.value }))
              }
              max={new Date().toISOString().slice(0, 10)}
              required
            />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="block text-sm mb-1.5 text-[var(--fg-muted)]">
              Feeding stage
            </legend>
            {FEEDING_OPTIONS.map((opt) => {
              const selected = form.feedingStage === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, feedingStage: opt.value }))
                  }
                  className="card text-left transition-colors"
                  style={{
                    borderColor: selected ? "var(--accent)" : "var(--border)",
                    background: selected
                      ? "var(--accent-soft)"
                      : "var(--bg-elev)",
                  }}
                  aria-pressed={selected}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-sm text-[var(--fg-muted)]">{opt.hint}</div>
                </button>
              );
            })}
          </fieldset>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-4">
          <header>
            <h1 className="text-2xl font-bold">What matters most right now?</h1>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Pick one. You can change this anytime.
            </p>
          </header>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Top goal</legend>
            {GOAL_OPTIONS.map((opt) => {
              const selected = form.topGoal === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, topGoal: opt.value }))}
                  className="card text-left transition-colors"
                  style={{
                    borderColor: selected ? "var(--accent)" : "var(--border)",
                    background: selected
                      ? "var(--accent-soft)"
                      : "var(--bg-elev)",
                  }}
                  aria-pressed={selected}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-sm text-[var(--fg-muted)]">{opt.hint}</div>
                </button>
              );
            })}
          </fieldset>
        </section>
      )}

      {error && (
        <p className="mt-4 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <div className="mt-auto pt-6 flex flex-col gap-3">
        {step < STEP_COUNT - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance}
            className="btn btn-primary"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canAdvance || submitting}
            className="btn btn-primary"
          >
            {submitting ? "Saving…" : "Finish setup"}
          </button>
        )}
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="btn btn-ghost"
          >
            Back
          </button>
        )}
      </div>
    </main>
  );
}
