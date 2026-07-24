import { BANK_NAME, SUPPORT_EMAIL } from "@/lib/brand"

export interface DepositStatusEmailProps {
  firstName: string
  title:     string   // e.g. "Deposit confirmed"
  message:   string   // the same human-readable message shown in-app
  reference?: string  // transaction reference, when available
  tone?:     "positive" | "warning" | "neutral"
}

const TONE: Record<string, { bg: string; fg: string }> = {
  positive: { bg: "#ECFDF3", fg: "#12B76A" },
  warning:  { bg: "#FEF3F2", fg: "#D92D20" },
  neutral:  { bg: "#EFF4FF", fg: "#1A2CCE" },
}

export function renderDepositStatusEmail({
  firstName, title, message, reference, tone = "neutral",
}: DepositStatusEmailProps): string {
  const appUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000") + "/app/transactions"
  const year = new Date().getFullYear()
  const badge = TONE[tone] ?? TONE.neutral

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} - ${BANK_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333333">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px">
    <tr>
      <td>
        <!-- Header -->
        <h1 style="margin:0 0 32px;font-size:24px;font-weight:600;color:#111111">${BANK_NAME}</h1>

        <!-- Badge -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
          <tr>
            <td style="background-color:${badge.bg};color:${badge.fg};font-size:13px;font-weight:600;padding:8px 16px;border-radius:999px">
              ${escapeHtml(title)}
            </td>
          </tr>
        </table>

        <!-- Greeting -->
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#333333">
          Hi ${escapeHtml(firstName)},
        </p>

        <!-- Main content -->
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#333333">
          ${escapeHtml(message)}
        </p>

        ${reference ? `
        <!-- Reference -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
          <tr>
            <td style="background-color:#F9FAFB;border:1px solid #EAECF0;border-radius:8px;padding:16px 18px">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#667085">Reference</p>
              <p style="margin:0;font-size:15px;font-family:monospace;color:#333333">${escapeHtml(reference)}</p>
            </td>
          </tr>
        </table>` : ""}

        <!-- CTA Button -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0">
          <tr>
            <td>
              <a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:14px 32px;background-color:#111111;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;border-radius:6px">View Your Transactions</a>
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <hr style="margin:32px 0;border:none;border-top:1px solid #eeeeee" />

        <!-- Footer -->
        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#333333">
          Best regards,<br />
          The ${BANK_NAME} Team
        </p>

        <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#999999">
          If you have any questions, contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#666666">${SUPPORT_EMAIL}</a>
        </p>

        <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#999999">
          &copy; ${year} ${BANK_NAME}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
