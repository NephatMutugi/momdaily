/**
 * Evening check-in (opt-in, off by default). Same magic-link habit pattern
 * as the morning email, but framed as "did you get to it today?" rather
 * than a fresh tip.
 *
 * Phase 4 ships this as a template but does NOT yet trigger an evening
 * cron — only morning. The evening cron lands in Phase 4.5 once we have
 * data on whether the morning loop alone is enough.
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
  Button,
} from "@react-email/components";
import type { MorningTipEmailHabit } from "./MorningTip";

export interface EveningCheckInEmailProps {
  greetingName: string;
  habits: MorningTipEmailHabit[];
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
  accent: "#c2410c",
};

export default function EveningCheckInEmail({
  greetingName,
  habits,
  appUrl,
  preferencesUrl,
  unsubscribeUrl,
}: EveningCheckInEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>How did today go, {greetingName}?</Preview>
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
            style={{
              fontSize: "20px",
              lineHeight: "1.3",
              margin: "0 0 6px",
            }}
          >
            How did today go, {greetingName}?
          </Heading>
          <Text style={{ color: COLORS.muted, margin: "0 0 16px" }}>
            Tap anything you did. No pressure — even one counts.
          </Text>
          {habits.map((h, i) => (
            <Section key={i} style={{ marginBottom: "8px" }}>
              <Button
                href={h.logUrl}
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box" as const,
                  backgroundColor: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  color: COLORS.fg,
                  fontSize: "15px",
                  textDecoration: "none",
                  padding: "14px 16px",
                  textAlign: "left" as const,
                }}
              >
                ✅ {h.label}
              </Button>
            </Section>
          ))}
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
