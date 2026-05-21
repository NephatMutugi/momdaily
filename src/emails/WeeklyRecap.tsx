/**
 * Weekly recap (Sunday morning). Phase 7 owns the share-card image and
 * the full content of this email. Phase 4 ships just enough scaffolding
 * to make the cron + idempotency path work end-to-end.
 *
 * If you're reading this in Phase 7 to add the share card: hook the
 * image URL into the `shareImageUrl` prop and render <Img /> below the
 * recap text.
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface WeeklyRecapEmailProps {
  greetingName: string;
  childName: string | null;
  streakDays: number;
  habitsLogged: number;
  appUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
}

const COLORS = {
  bg: "#fffaf7",
  card: "#fff3ed",
  border: "#f0d7ca",
  fg: "#2a1f1a",
  muted: "#7a6a62",
};

export default function WeeklyRecapEmail({
  greetingName,
  childName,
  streakDays,
  habitsLogged,
  appUrl,
  preferencesUrl,
  unsubscribeUrl,
}: WeeklyRecapEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your MomDaily week: {streakDays}-day streak, {habitsLogged} habits
      </Preview>
      <Body
        style={{
          backgroundColor: COLORS.bg,
          color: COLORS.fg,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: "24px 12px",
        }}
      >
        <Container style={{ maxWidth: "520px", margin: "0 auto" }}>
          <Heading
            as="h1"
            style={{ fontSize: "22px", margin: "0 0 8px" }}
          >
            You showed up, {greetingName}.
          </Heading>
          <Text style={{ color: COLORS.muted, margin: "0 0 16px" }}>
            {childName ? `A look at ${childName}'s week.` : "A look at your week."}
          </Text>

          <Section
            style={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "16px",
              padding: "20px",
              marginTop: "12px",
            }}
          >
            <Text style={{ margin: 0, fontSize: "32px", fontWeight: 700 }}>
              {streakDays}
            </Text>
            <Text style={{ margin: "0 0 12px", color: COLORS.muted }}>
              {streakDays === 1 ? "day streak" : "day streak"}
            </Text>
            <Text style={{ margin: 0, fontSize: "16px" }}>
              {habitsLogged} habits logged this week.
            </Text>
          </Section>

          <Section
            style={{
              marginTop: "24px",
              paddingTop: "12px",
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            <Text style={{ color: COLORS.muted, fontSize: "12px", margin: 0 }}>
              <Link href={appUrl} style={{ color: COLORS.muted }}>
                Open MomDaily
              </Link>{" "}
              ·{" "}
              <Link href={preferencesUrl} style={{ color: COLORS.muted }}>
                Email preferences
              </Link>{" "}
              ·{" "}
              <Link href={unsubscribeUrl} style={{ color: COLORS.muted }}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
