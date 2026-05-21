"use client";

/**
 * Shown on /dashboard when arriving from a magic-link tap.
 *
 * Query params it handles:
 *   ?logged=ok       → "Logged. Nice work."
 *   ?logged=missing  → "That habit isn't on your list anymore."
 *   ?logged=error    → "Couldn't save — try again from the dashboard."
 *
 * The banner auto-dismisses after 5s and strips the query param so a page
 * refresh doesn't keep showing it.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const MESSAGES: Record<string, { text: string; tone: "ok" | "warn" | "error" }> =
  {
    ok: { text: "Logged. Nice work.", tone: "ok" },
    missing: {
      text: "That habit isn't on your list anymore — log it from the dashboard.",
      tone: "warn",
    },
    error: {
      text: "Couldn't save from the email — try the dashboard checkboxes.",
      tone: "error",
    },
  };

export default function LoggedToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = params.get("logged");
  const [visible, setVisible] = useState(!!status && status in MESSAGES);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      setVisible(false);
      // Strip the query param so refresh doesn't re-show it.
      const fresh = new URLSearchParams(params.toString());
      fresh.delete("logged");
      const q = fresh.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    }, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || !status || !(status in MESSAGES)) return null;
  const msg = MESSAGES[status]!;

  const tones = {
    ok: { bg: "var(--accent-soft)", color: "var(--accent)", border: "var(--accent)" },
    warn: { bg: "var(--bg-elev)", color: "var(--fg)", border: "var(--border)" },
    error: { bg: "var(--bg-elev)", color: "var(--danger)", border: "var(--danger)" },
  }[msg.tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background: tones.bg,
        color: tones.color,
        border: `1px solid ${tones.border}`,
      }}
    >
      {msg.text}
    </div>
  );
}
