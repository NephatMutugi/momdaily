/**
 * Sends the password-reset email via Resend.
 *
 * Plain inline HTML template — no React Email components. Single transactional
 * email; the dep weight isn't worth it for one template. The string templating
 * is straightforward and we control the entire output.
 *
 * Compatibility notes:
 *   - HTML uses table-based layout for legacy Outlook (it doesn't honor
 *     modern CSS reliably).
 *   - Plain-text alternative is provided alongside (Resend SDK accepts both).
 *   - URL is repeated as plain text below the button — some corporate email
 *     clients block buttons but render text links.
 */

import { getResend, getFromAddress } from "@/lib/resend";

export interface SendPasswordResetEmailArgs {
  to: string;
  name: string | null;
  resetUrl: string;
  /** Used in the footer "expires in N minutes" copy. */
  expiresInMinutes: number;
}

export async function sendPasswordResetEmail(
  args: SendPasswordResetEmailArgs
): Promise<{ messageId: string | null }> {
  const { to, name, resetUrl, expiresInMinutes } = args;
  const friendlyName = name?.trim() || "there";

  const subject = "Reset your MomDaily password";

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafaf9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e7e5e4;padding:32px;">
            <tr>
              <td style="font-size:14px;color:#78716c;letter-spacing:0.04em;text-transform:uppercase;font-weight:600;padding-bottom:8px;">
                MomDaily
              </td>
            </tr>
            <tr>
              <td style="font-size:22px;font-weight:700;color:#1c1917;padding-bottom:16px;line-height:1.3;">
                Reset your password
              </td>
            </tr>
            <tr>
              <td style="font-size:15px;line-height:1.6;color:#44403c;padding-bottom:24px;">
                Hi ${escapeHtml(friendlyName)},<br /><br />
                We got a request to reset your MomDaily password. Tap the
                button below to choose a new one. If you didn't ask for
                this, you can safely ignore this email — your password won't
                change.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a
                  href="${resetUrl}"
                  style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;"
                >Reset password</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#78716c;line-height:1.6;padding-bottom:24px;">
                Or paste this link into your browser:<br />
                <a href="${resetUrl}" style="color:#0f766e;word-break:break-all;">${resetUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#a8a29e;border-top:1px solid #e7e5e4;padding-top:16px;line-height:1.6;">
                This link expires in ${expiresInMinutes} minutes and can only be used once.
                If you didn't request a reset, no action is needed.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Hi ${friendlyName},`,
    "",
    "We got a request to reset your MomDaily password.",
    "Open this link to choose a new password:",
    "",
    resetUrl,
    "",
    `This link expires in ${expiresInMinutes} minutes and can only be used once.`,
    "If you didn't request a reset, you can ignore this email — your password",
    "won't change.",
    "",
    "— MomDaily",
  ].join("\n");

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
    text,
  });

  if (error) {
    // Throwing surfaces the failure to the caller; the API route logs and
    // returns a generic error. We don't leak Resend internals to the client.
    throw new Error(`Resend send failed: ${error.message ?? "unknown"}`);
  }

  return { messageId: data?.id ?? null };
}

/**
 * Conservative HTML escape for user-controlled fields embedded in the
 * template (only `name` today). Resend renders our HTML literally.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
