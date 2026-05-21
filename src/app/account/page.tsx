import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountClient from "./AccountClient";

/**
 * /account — minimal Profile page.
 *
 * Phase 4 lives here as the link target for the Profile tab in BottomNav
 * and SidebarNav. Shows: name, email, child summary, top goal, email prefs
 * (read-only for now), sign-out.
 *
 * Phase 4.5+ will add: edit child profile, change top goal, toggle email
 * preferences, change password, delete account.
 */

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      topGoal: true,
      timezone: true,
      onboarded: true,
      createdAt: true,
      emailPreference: {
        select: {
          morningEnabled: true,
          eveningEnabled: true,
          weeklyEnabled: true,
          sendHourLocal: true,
        },
      },
      children: {
        select: { name: true, birthdate: true, feedingStage: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const child = user.children[0];

  return (
    <AccountClient
      name={user.name}
      email={user.email}
      topGoal={user.topGoal}
      timezone={user.timezone}
      childName={child?.name ?? null}
      childAgeMonths={child ? monthsBetween(child.birthdate, new Date()) : null}
      childFeedingStage={child?.feedingStage ?? null}
      emailPrefs={
        user.emailPreference
          ? {
              morning: user.emailPreference.morningEnabled,
              evening: user.emailPreference.eveningEnabled,
              weekly: user.emailPreference.weeklyEnabled,
              sendHourLocal: user.emailPreference.sendHourLocal,
            }
          : null
      }
    />
  );
}

function monthsBetween(from: Date, to: Date): number {
  let months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return Math.max(0, months);
}
