import { BANK_NAME, SUPPORT_EMAIL } from "@/lib/brand"

export interface KycApprovedEmailProps {
  firstName: string
  tier?:     number
}

export function renderKycApprovedEmail({ firstName, tier }: KycApprovedEmailProps): string {
  const appUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000") + "/app/dashboard"
  const year = new Date().getFullYear()
  const tierLine = tier
    ? `Your account is now verified at <strong>Tier ${tier}</strong>.`
    : `Your account is now fully verified.`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Identity Verified - ${BANK_NAME}</title>
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
            <td style="background-color:#ECFDF3;color:#12B76A;font-size:13px;font-weight:600;padding:8px 16px;border-radius:999px">
              &#10003; Identity Verified
            </td>
          </tr>
        </table>

        <!-- Greeting -->
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#333333">
          Hi ${escapeHtml(firstName)},
        </p>

        <!-- Main content -->
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#333333">
          Good news &mdash; your identity documents have been reviewed and <strong>approved</strong>. ${tierLine}
        </p>

        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#333333">
          You now have full access to your ${BANK_NAME} account, including transfers, cards, and all other features.
        </p>

        <!-- CTA Button -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0">
          <tr>
            <td>
              <a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:14px 32px;background-color:#111111;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;border-radius:6px">Go to Your Dashboard</a>
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
