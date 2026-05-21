/**
 * The morning email. Three sections, in priority order:
 *   1. Greeting + today's tip
 *   2. Today's 3 habits — each is a one-click magic link
 *   3. Footer: open in app, manage preferences, unsubscribe
 *
 * Plain-text fallback is built from this same data in render(). React Email
 * handles the table-based layout that survives Outlook / Gmail clipping.
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

export interface MorningTipEmailHabit {
  label: string;
  logUrl: string; // magic-link URL with signed token
}

export interface MorningTipEmailProps {
  greetingName: string;
  childName: string | null;
  tipTitle: string;
  tipBody: string;
  tipUrl: string; // opens the tip in-app (Phase 5+ will be a public tip page)
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
  accentFg: "#ffffff",
};

export default function MorningTipEmail({
  greetingName,
  childName,
  tipTitle,
  tipBody,
  tipUrl,
  habits,
  appUrl,
  preferencesUrl,
  unsubscribeUrl,
}: MorningTipEmailProps) {
  const preview = `${tipTitle} — your two-minute check-in for ${
    childName ?? "your little one"
  }`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
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
        <Container
          style={{ maxWidth: "520px", margin: "0 auto" }}
        >
          <Section>
            <Text style={{ color: COLORS.muted, margin: 0, fontSize: "14px" }}>
              Good morning, {greetingName}
            </Text>
            {childName && (
              <Text
                style={{
                  color: COLORS.muted,
                  margin: "4px 0 0",
                  fontSize: "13px",
                }}
              >
                A two-minute check-in for {childName}.
              </Text>
            )}
          </Section>

          {/* Tip card */}
          <Section
            style={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "16px",
              padding: "20px",
              marginTop: "16px",
            }}
          >
            <Text
              style={{
                color: COLORS.muted,
                textTransform: "uppercase",
                fontSize: "11px",
                letterSpacing: "0.5px",
                margin: 0,
              }}
            >
              Today&rsquo;s tip
            </Text>
            <Heading
              as="h1"
              style={{
                fontSize: "20px",
                lineHeight: "1.3",
                margin: "6px 0 12px",
                color: COLORS.fg,
              }}
            >
              {tipTitle}
            </Heading>
            <Text
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                color: COLORS.fg,
                margin: 0,
              }}
            >
              {tipBody}
            </Text>
            <Text style={{ marginTop: "12px", margin: "12px 0 0" }}>
              <Link
                href={tipUrl}
                style={{
                  color: COLORS.accent,
                  fontSize: "14px",
                  textDecoration: "underline",
                }}
              >
                Open in MomDaily →
              </Link>
            </Text>
          </Section>

          {/* Habits */}
          <Section style={{ marginTop: "20px" }}>
            <Text
              style={{
                color: COLORS.muted,
                textTransform: "uppercase",
                fontSize: "11px",
                letterSpacing: "0.5px",
                margin: "0 0 8px",
              }}
            >
              Today&rsquo;s three
            </Text>
            {habits.map((h, i) => (
              <Section
                key={i}
                style={{
                  marginBottom: "8px",
                }}
              >
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
            <Text
              style={{
                color: COLORS.muted,
                fontSize: "12px",
                margin: "12px 0 0",
              }}
            >
              Tap a habit above to mark it done. No login needed — links are
              valid for 24 hours.
            </Text>
          </Section>

          {/* Footer */}
          <Section
            style={{
              marginTop: "32px",
              paddingTop: "16px",
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            <Text
              style={{
                color: COLORS.muted,
                fontSize: "12px",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              <Link
                href={appUrl}
                style={{ color: COLORS.muted, textDecoration: "underline" }}
              >
                Open MomDaily
              </Link>{" "}
              ·{" "}
              <Link
                href={preferencesUrl}
                style={{ color: COLORS.muted, textDecoration: "underline" }}
              >
                Email preferences
              </Link>{" "}
              ·{" "}
              <Link
                href={unsubscribeUrl}
                style={{ color: COLORS.muted, textDecoration: "underline" }}
              >
                Unsubscribe
              </Link>
            </Text>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: "11px",
                margin: "8px 0 0",
              }}
            >
              MomDaily shares tips drawn from public pediatric guidance and is
              not medical advice. For anything you&rsquo;re worried about,
              call your pediatrician.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
