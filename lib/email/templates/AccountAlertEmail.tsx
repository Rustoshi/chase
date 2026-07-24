import { BANK_NAME, LEGAL_NAME, SUPPORT_EMAIL, POSTAL_ADDRESS } from "@/lib/brand"

export interface AccountAlertEmailProps {
  firstName: string
  title:     string
  body:      string
  severity?: "info" | "warning" | "critical"
}

const TONE: Record<string, { bg: string; fg: string; label: string }> = {
  info:     { bg: "#EFF4FF", fg: "#1A2CCE", label: "Account notice" },
  warning:  { bg: "#FFFAEB", fg: "#B54708", label: "Action required" },
  critical: { bg: "#FEF3F2", fg: "#D92D20", label: "Important: action required" },
}

export function renderAccountAlertEmail({
  firstName, title, body, severity = "critical",
}: AccountAlertEmailProps): string {
  const supportUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000") + "/app/support"
  const year  = new Date().getFullYear()
  const badge = TONE[severity] ?? TONE.critical

  // Preserve the admin's paragraph breaks.
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#333333">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} - ${BANK_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333333">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0">
    ${escapeHtml(title)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px">
    <tr>
      <td>
        <h1 style="margin:0 0 32px;font-size:24px;font-weight:600;color:#111111">${BANK_NAME}</h1>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
          <tr>
            <td style="background-color:${badge.bg};color:${badge.fg};font-size:13px;font-weight:600;padding:8px 16px;border-radius:999px">
              ${badge.label}
            </td>
          </tr>
        </table>

        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#333333">
          Hi ${escapeHtml(firstName)},
        </p>

        <h2 style="margin:0 0 16px;font-size:19px;font-weight:600;color:#101828">${escapeHtml(title)}</h2>

        ${paragraphs}

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 16px">
          <tr>
            <td>
              <a href="${escapeHtml(supportUrl)}" style="display:inline-block;padding:14px 32px;background-color:#111111;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;border-radius:6px">Contact support</a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:#98A2B3">
          Or paste this into your browser:<br />
          <span style="color:#667085">${escapeHtml(supportUrl)}</span>
        </p>

        <!-- Security notice -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-left:3px solid #EAECF0">
          <tr><td style="padding:2px 0 2px 14px">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#667085">
              <strong style="color:#475467">Security:</strong> ${BANK_NAME} will never ask you for your PIN, CVV,
              full card number or password by email, phone or text.
            </p>
          </td></tr>
        </table>

        <hr style="margin:0 0 24px;border:none;border-top:1px solid #eeeeee" />

        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#333333">
          Best regards,<br />
          The ${BANK_NAME} Team
        </p>

        <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#999999">
          You are receiving this email because you hold an account with ${BANK_NAME}.
          This is a service message about your account and is not a marketing email.
        </p>

        <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#999999">
          ${LEGAL_NAME}<br />
          ${escapeHtml(POSTAL_ADDRESS)}
        </p>

        <p style="margin:0;font-size:12px;line-height:1.6;color:#999999">
          &copy; ${year} ${BANK_NAME}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function renderAccountAlertText({
  firstName, title, body, severity = "critical",
}: AccountAlertEmailProps): string {
  const supportUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000") + "/app/support"
  const year  = new Date().getFullYear()
  const badge = TONE[severity] ?? TONE.critical

  return [
    BANK_NAME,
    "",
    badge.label.toUpperCase(),
    "",
    `Hi ${firstName},`,
    "",
    title,
    "",
    body,
    "",
    `Contact support: ${supportUrl}`,
    "",
    `Security: ${BANK_NAME} will never ask you for your PIN, CVV, full card number or`,
    `password by email, phone or text.`,
    "",
    "--",
    "Best regards,",
    `The ${BANK_NAME} Team`,
    "",
    `You are receiving this email because you hold an account with ${BANK_NAME}.`,
    "This is a service message about your account and is not a marketing email.",
    "",
    LEGAL_NAME,
    POSTAL_ADDRESS,
    `(c) ${year} ${BANK_NAME}. All rights reserved.`,
  ].join("\n")
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
