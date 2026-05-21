import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Signed-in users skip the landing page. Send them to onboarding if they
  // haven't finished it, or straight to the dashboard if they have.
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboarded: true },
    });
    if (user?.onboarded) redirect("/dashboard");
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto max-w-md min-h-[100dvh] flex flex-col p-6 pt-16 sm:pt-24 gap-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">MomDaily</h1>
        <p className="text-[var(--fg-muted)] leading-relaxed">
          Two minutes a day. One tip, three tiny habits. We help you feel
          confident you did right by your child today.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/signup" className="btn btn-primary">
          Get started
        </Link>
        <Link href="/login" className="btn btn-ghost">
          I already have an account
        </Link>
      </div>
    </main>
  );
}
