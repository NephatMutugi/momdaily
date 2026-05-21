import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Phase 1 dashboard placeholder.
 *
 * Just verifies the auth + onboarding redirect logic works end-to-end:
 *   - Not signed in → /login
 *   - Signed in but not onboarded → /onboarding
 *   - Signed in + onboarded → this page
 *
 * Phase 3 replaces this body with the real TipCard + HabitChecklist + Streak.
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      onboarded: true,
      topGoal: true,
      children: {
        select: { name: true, birthdate: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const child = user.children[0];
  const greetingName = user.name ?? "there";
  const childLabel = child?.name ? `for ${child.name}` : "for your little one";

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <header className="pt-8">
        <p className="text-sm text-[var(--fg-muted)]">Good morning,</p>
        <h1 className="text-2xl font-bold">{greetingName}</h1>
      </header>

      <section className="card space-y-2">
        <p className="text-sm font-semibold">Phase 1 dashboard placeholder</p>
        <p className="text-sm text-[var(--fg-muted)]">
          You&apos;re signed in and onboarded {childLabel}. Today&apos;s tip,
          three habits, and your streak land in Phase 3.
        </p>
        {user.topGoal && (
          <p className="text-sm text-[var(--fg-muted)]">
            Your goal: <span className="font-medium">{user.topGoal.replace("_", " ")}</span>
          </p>
        )}
      </section>
    </main>
  );
}
