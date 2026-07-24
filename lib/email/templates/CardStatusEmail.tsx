import { BANK_NAME, LEGAL_NAME, SUPPORT_EMAIL, POSTAL_ADDRESS } from "@/lib/brand"

export interface CardEmailDetails {
  last4?:     string
  network?:   string   // visa | mastercard | amex
  type?:      string   // debit | credit
  isVirtual?: boolean
}

export interface CardStatusEmailProps {
  firstName:  string
  title:      string          // e.g. "Card application approved"
  message:    string          // the same human-readable message shown in-app
  tone?:      "positive" | "warning" | "neutral"
  card?:      CardEmailDetails
  nextSteps?: string[]        // "What happens next" bullets
}

const TONE: Record<string, { bg: string; fg: string }> = {
  positive: { bg: "#ECFDF3", fg: "#12B76A" },
  warning:  { bg: "#FEF3F2", fg: "#D92D20" },
  neutral:  { bg: "#EFF4FF", fg: "#1A2CCE" },
}

const NETWORK_LABEL: Record<string, string> = {
  visa:       "Visa",
  mastercard: "Mastercard",
  amex:       "American Express",
}

function networkLabel(n?: string): string {
  if (!n) return ""
  return NETWORK_LABEL[n.toLowerCase()] ?? n
}

function cardSummary(card?: CardEmailDetails): string {
  if (!card) return ""
  const parts = [
    networkLabel(card.network),
    card.type ? card.type.charAt(0).toUpperCase() + card.type.slice(1) : "",
  ].filter(Boolean)
  return parts.join(" ")
}

/** Rows shown in the card-details block. */
function detailRows(card?: CardEmailDetails): Array<[string, string]> {
  if (!card) return []
  const rows: Array<[string, string]> = []
  const summary = cardSummary(card)
  if (summary)          rows.push(["Card", summary])
  if (card.last4)       rows.push(["Card number", `•••• •••• •••• ${card.last4}`])
  if (card.isVirtual !== undefined) rows.push(["Format", card.isVirtual ? "Virtual" : "Physical"])
  return rows
}

// ── HTML ──────────────────────────────────────────────────────────────────────

export function renderCardStatusEmail({
  firstName, title, message, tone = "neutral", card, nextSteps = [],
}: CardStatusEmailProps): string {
  const appUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000") + "/app/cards"
  const year  = new Date().getFullYear()
  const badge = TONE[tone] ?? TONE.neutral
  const rows  = detailRows(card)

  const detailsBlock = rows.length ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #EAECF0;border-radius:8px;background-color:#F9FAFB">
          <tr><td style="padding:16px 18px">
            <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#667085">Card details</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${rows.map(([k, v]) => `
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#667085">${escapeHtml(k)}</td>
                <td style="padding:4px 0;font-size:14px;color:#101828;text-align:right;font-weight:500">${escapeHtml(v)}</td>
              </tr>`).join("")}
            </table>
          </td></tr>
        </table>` : ""

  const stepsBlock = nextSteps.length ? `
        <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#101828">What happens next</p>
        <ul style="margin:0 0 24px;padding-left:20px;color:#475467">
          ${nextSteps.map((s) => `<li style="margin:0 0 6px;font-size:15px;line-height:1.6">${escapeHtml(s)}</li>`).join("")}
        </ul>` : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} - ${BANK_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333333">
  <!-- Preheader: shown as the inbox preview, hidden in the body -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0">
    ${escapeHtml(message)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px">
    <tr>
      <td>
        <!-- Header -->
        <h1 style="margin:0 0 32px;font-size:24px;font-weight:600;color:#111111">${BANK_NAME}</h1>

        <!-- Status badge -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
          <tr>
            <td style="background-color:${badge.bg};color:${badge.fg};font-size:13px;font-weight:600;padding:8px 16px;border-radius:999px">
              ${escapeHtml(title)}
            </td>
          </tr>
        </table>

        <!-- Greeting + message -->
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#333333">
          Hi ${escapeHtml(firstName)},
        </p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#333333">
          ${escapeHtml(message)}
        </p>
${detailsBlock}
${stepsBlock}
        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 16px">
          <tr>
            <td>
              <a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:14px 32px;background-color:#111111;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;border-radius:6px">Manage your cards</a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:#98A2B3">
          Or paste this into your browser:<br />
          <span style="color:#667085">${escapeHtml(appUrl)}</span>
        </p>

        <!-- Security notice -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-left:3px solid #EAECF0">
          <tr><td style="padding:2px 0 2px 14px">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#667085">
              <strong style="color:#475467">Security:</strong> ${BANK_NAME} will never ask you for your PIN, CVV,
              full card number or password by email, phone or text. If you did not request this change,
              contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#667085">${SUPPORT_EMAIL}</a>.
            </p>
          </td></tr>
        </table>

        <!-- Divider -->
        <hr style="margin:0 0 24px;border:none;border-top:1px solid #eeeeee" />

        <!-- Footer -->
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#333333">
          Best regards,<br />
          The ${BANK_NAME} Team
        </p>

        <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#999999">
          You are receiving this email because you hold an account with ${BANK_NAME}.
          This is a service message about your card and is not a marketing email.
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

// ── Plain text ────────────────────────────────────────────────────────────────
// A hand-written text/plain part. Shipping HTML with no text alternative is a
// major spam signal, so every card email carries this.

export function renderCardStatusText({
  firstName, title, message, card, nextSteps = [],
}: CardStatusEmailProps): string {
  const appUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000") + "/app/cards"
  const year   = new Date().getFullYear()
  const rows   = detailRows(card)

  const lines: string[] = [
    BANK_NAME,
    "",
    title.toUpperCase(),
    "",
    `Hi ${firstName},`,
    "",
    message,
    "",
  ]

  if (rows.length) {
    lines.push("CARD DETAILS")
    rows.forEach(([k, v]) => lines.push(`  ${k}: ${v}`))
    lines.push("")
  }

  if (nextSteps.length) {
    lines.push("WHAT HAPPENS NEXT")
    nextSteps.forEach((s) => lines.push(`  - ${s}`))
    lines.push("")
  }

  lines.push(
    `Manage your cards: ${appUrl}`,
    "",
    `Security: ${BANK_NAME} will never ask you for your PIN, CVV, full card number or`,
    `password by email, phone or text. If you did not request this change, contact us`,
    `immediately at ${SUPPORT_EMAIL}.`,
    "",
    "--",
    `Best regards,`,
    `The ${BANK_NAME} Team`,
    "",
    `You are receiving this email because you hold an account with ${BANK_NAME}.`,
    `This is a service message about your card and is not a marketing email.`,
    "",
    LEGAL_NAME,
    POSTAL_ADDRESS,
    `(c) ${year} ${BANK_NAME}. All rights reserved.`,
  )

  return lines.join("\n")
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
