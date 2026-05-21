/**
 * Sends a single user's morning email — idempotent within a day.
 *
 * Flow:
 *   1. Reserve the send by upserting EmailSendLog (userId, morning, today).
 *      If the row already existed (race / retry), bail out — already sent.
 *   2. Compose the tip + 3 magic-link habit URLs.
 *   3. Render the React Email template to HTML + plain text.
 *   4. Send via Resend.
 *   5. On send failure, delete the EmailSendLog row so a later retry can
 *      try again. (Without this, a transient Resend outage would lock the
 *      send for 24h.)
 *
 * Called by the hourly cron for every user whose local hour matches their
 * sendHourLocal preference.
 */

import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { getDailyTip } from "@/lib/getDailyTip";
import { signMagicLogToken } from "@/lib/magicLogToken";
import { getResend, getFromAddress, getAppOrigin } from "@/lib/email";
import { startOfLocalDayUTC } from "@/lib/streak";
import MorningTipEmail, {
  type MorningTipEmailHabit,
} from "@/emails/MorningTip";

export interface SendResult {
  status: "sent" | "skipped" | "failed";
  reason?: string;
  messageId?: string;
}

export async function sendMorningEmail(userId: string): Promise<SendResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      onboarded: true,
      emailPreference: {
        select: { morningEnabled: true },
      },
      children: {
        select: { name: true, birthdate: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user) return { status: "skipped", reason: "user not found" };
  if (!user.onboarded) return { status: "skipped", reason: "not onboarded" };
  if (user.emailPreference && !user.emailPreference.morningEnabled) {
    return { status: "skipped", reason: "morning opted out" };
  }
  if (user.children.length === 0) {
    return { status: "skipped", reason: "no child profile" };
  }

  const timezone = user.timezone || "UTC";
  const today = startOfLocalDayUTC(new Date(), timezone);

  // 1. Reserve the send slot. Postgres unique constraint on (userId, kind, sentDate)
  // is the source of truth — if the create fails with P2002, someone else
  // already sent it today.
  let reservationId: string | null = null;
  try {
    const log = await prisma.emailSendLog.create({
      data: { userId, kind: "morning", sentDate: today },
      select: { id: true },
    });
    reservationId = log.id;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "P2002") {
      return { status: "skipped", reason: "already sent today" };
    }
    throw err;
  }

  try {
    // 2. Compose
    const tipResult = await getDailyTip(userId);
    if (!tipResult) {
      // No tip available — release the reservation so we can try again later.
      await prisma.emailSendLog.delete({ where: { id: reservationId } });
      return { status: "skipped", reason: "no tip available" };
    }

    const habits = await prisma.habit.findMany({
      where: { userId, active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 3,
    });

    const origin = getAppOrigin();
    const habitItems: MorningTipEmailHabit[] = [];
    for (const h of habits) {
      const token = await signMagicLogToken({
        userId,
        habitId: h.id,
        value: true,
      });
      habitItems.push({
        label: h.label,
        logUrl: `${origin}/api/log/${token}`,
      });
    }

    // 3. Render
    const props = {
      greetingName: user.name ?? "friend",
      childName: user.children[0]?.name ?? null,
      tipTitle: tipResult.tip.title,
      tipBody: tipResult.tip.body,
      tipUrl: `${origin}/dashboard`,
      habits: habitItems,
      appUrl: `${origin}/dashboard`,
      preferencesUrl: `${origin}/account`,
      unsubscribeUrl: `${origin}/account?unsubscribe=morning`,
    };
    const html = await render(MorningTipEmail(props));
    const text = await render(MorningTipEmail(props), { plainText: true });

    // 4. Send
    const resend = getResend();
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: user.email,
      subject: `${tipResult.tip.title} — your MomDaily`,
      html,
      text,
    });

    if (result.error) {
      await prisma.emailSendLog.delete({ where: { id: reservationId } });
      return { status: "failed", reason: result.error.message };
    }

    // Stash the provider id for deliverability debugging.
    if (result.data?.id) {
      await prisma.emailSendLog.update({
        where: { id: reservationId },
        data: { providerMessageId: result.data.id },
      });
    }
    return { status: "sent", messageId: result.data?.id };
  } catch (err) {
    // 5. Release the reservation on any unexpected error so retries work.
    if (reservationId) {
      await prisma.emailSendLog
        .delete({ where: { id: reservationId } })
        .catch(() => {});
    }
    throw err;
  }
}
