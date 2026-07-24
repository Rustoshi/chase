import { after } from "next/server"
import { renderWelcomeEmail } from "./templates/WelcomeEmail"
import { renderPasswordResetEmail } from "./templates/PasswordResetEmail"
import { renderEmailVerificationSuccessEmail } from "./templates/EmailVerificationSuccessEmail"
import { renderOtpEmail } from "./templates/OtpEmail"
import { renderKycApprovedEmail } from "./templates/KycApprovedEmail"
import { renderKycRejectedEmail } from "./templates/KycRejectedEmail"
import { renderCardStatusEmail, renderCardStatusText, type CardEmailDetails } from "./templates/CardStatusEmail"
import { renderDepositStatusEmail } from "./templates/DepositStatusEmail"
import { renderAccountAlertEmail, renderAccountAlertText } from "./templates/AccountAlertEmail"
import { renderAdminAlertEmail, type AdminAlertRow } from "./templates/AdminAlertEmail"
import { BANK_NAME } from "@/lib/brand"

// ── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

// Mailtrap HTTP Sending API (https://api-docs.mailtrap.io/).
// Production sending endpoint; override with MAILTRAP_API_URL for sandbox, e.g.
// https://sandbox.api.mailtrap.io/api/send/<inbox_id>
const MAILTRAP_API_URL   = process.env.MAILTRAP_API_URL || "https://send.api.mailtrap.io/api/send"
const MAILTRAP_API_TOKEN = process.env.MAILTRAP_API_TOKEN || process.env.MAILTRAP_TOKEN || ""

// Sender identity. Accepts either "Name <email>" (legacy MAILTRAP_FROM) or the
// split MAILTRAP_FROM_EMAIL / MAILTRAP_FROM_NAME pair.
function parseFrom(): { email: string; name: string } {
  const rawEmail = process.env.MAILTRAP_FROM_EMAIL
  const rawName  = process.env.MAILTRAP_FROM_NAME
  if (rawEmail) return { email: rawEmail.trim(), name: (rawName || BANK_NAME).trim() }

  const combined = process.env.MAILTRAP_FROM || `${BANK_NAME} <noreply@summittrustbank.com>`
  const m = combined.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  if (m) return { name: (m[1] || BANK_NAME).trim(), email: m[2].trim() }
  return { name: BANK_NAME, email: combined.trim() }
}

const FROM = parseFrom()

// Email is considered configured once an API token is present.
const isEmailConfigured = Boolean(MAILTRAP_API_TOKEN)

// ── Plain-text alternative ────────────────────────────────────────────────────
// Every message must ship a text/plain part alongside the HTML. HTML-only mail
// is one of the strongest spam signals there is; senders that omit it get
// filtered regardless of content quality.

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h[1-6]|li|table)>/gi, "\n")
    // Keep link targets visible: "text (https://…)"
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&copy;/g, "(c)")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// ── Safe email sender (never throws) ──────────────────────────────────────────

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Check if configured
  if (!isEmailConfigured) {
    console.warn("[Email] Mailtrap API token not configured — skipping email send")
    return false
  }

  // Support a single address or a comma-separated list.
  const recipients = options.to
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
    .map((email) => ({ email }))

  if (recipients.length === 0) {
    console.warn("[Email] No recipient — skipping email send")
    return false
  }

  try {
    const res = await fetch(MAILTRAP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Token": MAILTRAP_API_TOKEN,
        Authorization: `Bearer ${MAILTRAP_API_TOKEN}`,
      },
      body: JSON.stringify({
        from: { email: FROM.email, name: FROM.name },
        to: recipients,
        subject: options.subject,
        html: options.html,
        // Always include a text/plain alternative (see htmlToText above).
        text: options.text?.trim() || htmlToText(options.html),
      }),
      // Fail fast instead of hanging a serverless invocation.
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error(`[Email] Mailtrap API ${res.status} for "${options.subject}": ${detail}`)
      return false
    }

    console.log(`[Email] Sent "${options.subject}" to ${options.to}`)
    return true
  } catch (err) {
    console.error("[Email] Failed to send email:", err instanceof Error ? err.message : err)
    return false
  }
}

// ── Background email sender (for non-blocking notifications) ───────────────────
// Sends AFTER the HTTP response using Next's `after()`, which on Vercel keeps
// the serverless function alive (via waitUntil) until delivery completes. Without
// this, an unawaited send is suspended the moment the response returns and may
// not deliver until the instance is (maybe) reused — the "emails are slow" bug.
// Use this only for notifications the caller isn't synchronously waiting on
// (admin alerts, KYC/card status). OTP/reset/verification must stay blocking.
function sendEmailInBackground(options: EmailOptions): Promise<boolean> {
  try {
    after(async () => { await sendEmail(options) })
    return Promise.resolve(true)
  } catch {
    // No request context (e.g. a script/cron) — fall back to an inline send.
    return sendEmail(options)
  }
}

// ── sendWelcomeEmail ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  to:        string,
  firstName: string
): Promise<boolean> {
  const html = renderWelcomeEmail({ firstName })

  return sendEmail({
    to,
    subject: `Welcome to ${BANK_NAME}`,
    html,
  })
}

// ── sendPasswordResetEmail ────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  to:         string,
  firstName:  string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`
  const html = renderPasswordResetEmail({ firstName, resetUrl })

  return sendEmail({
    to,
    subject: `Reset your ${BANK_NAME} password`,
    html,
  })
}

// ── sendEmailVerifiedEmail ────────────────────────────────────────────────────

export async function sendEmailVerifiedEmail(
  to:        string,
  firstName: string
): Promise<boolean> {
  const html = renderEmailVerificationSuccessEmail({ firstName })

  return sendEmail({
    to,
    subject: `Your ${BANK_NAME} email has been verified`,
    html,
  })
}

// ── sendOtpEmail (email verification during signup) ───────────────────────────

export async function sendOtpEmail(
  to:        string,
  firstName: string,
  otp:       string
): Promise<boolean> {
  const html = renderOtpEmail({ firstName, otp })

  return sendEmail({
    to,
    subject: `${otp} is your ${BANK_NAME} verification code`,
    html,
  })
}

// ── sendKycApprovedEmail ──────────────────────────────────────────────────────

export async function sendKycApprovedEmail(
  to:        string,
  firstName: string,
  tier?:     number
): Promise<boolean> {
  const html = renderKycApprovedEmail({ firstName, tier })

  return sendEmailInBackground({
    to,
    subject: `Your ${BANK_NAME} identity has been verified`,
    html,
  })
}

// ── sendKycRejectedEmail ──────────────────────────────────────────────────────

export async function sendKycRejectedEmail(
  to:        string,
  firstName: string,
  reason:    string,
  docLabel?: string
): Promise<boolean> {
  const html = renderKycRejectedEmail({ firstName, reason, docLabel })

  return sendEmailInBackground({
    to,
    subject: `Action required: your ${BANK_NAME} verification needs attention`,
    html,
  })
}

// ── sendCardStatusEmail ───────────────────────────────────────────────────────

export async function sendCardStatusEmail(
  to:         string,
  firstName:  string,
  title:      string,
  message:    string,
  tone?:      "positive" | "warning" | "neutral",
  card?:      CardEmailDetails,
  nextSteps?: string[],
  subject?:   string
): Promise<boolean> {
  const props = { firstName, title, message, tone, card, nextSteps }
  const html  = renderCardStatusEmail(props)
  const text  = renderCardStatusText(props)

  return sendEmailInBackground({
    to,
    // A specific subject ("Your Visa debit card ending 1234 is now active")
    // scores far better than a generic one.
    subject: subject || `${title} — ${BANK_NAME}`,
    html,
    text,
  })
}

// ── sendDepositStatusEmail ────────────────────────────────────────────────────

export async function sendDepositStatusEmail(
  to:         string,
  firstName:  string,
  title:      string,
  message:    string,
  reference?: string,
  tone?:      "positive" | "warning" | "neutral"
): Promise<boolean> {
  const html = renderDepositStatusEmail({ firstName, title, message, reference, tone })

  return sendEmailInBackground({
    to,
    subject: `${title} — ${BANK_NAME}`,
    html,
  })
}

// ── sendAccountAlertEmail (admin-authored critical alert for one client) ──────

export async function sendAccountAlertEmail(
  to:        string,
  firstName: string,
  title:     string,
  body:      string,
  severity?: "info" | "warning" | "critical"
): Promise<boolean> {
  const props = { firstName, title, body, severity }

  return sendEmailInBackground({
    to,
    subject: title,
    html: renderAccountAlertEmail(props),
    text: renderAccountAlertText(props),
  })
}

// ── sendAdminAlertEmail (notifies the ADMIN_EMAIL of key activity) ────────────

export async function sendAdminAlertEmail(
  title: string,
  rows:  AdminAlertRow[],
  intro?: string
): Promise<boolean> {
  const to = process.env.ADMIN_EMAIL
  if (!to) {
    console.warn("[Email] ADMIN_EMAIL not set — skipping admin alert")
    return false
  }
  const html = renderAdminAlertEmail({ title, intro, rows })
  return sendEmailInBackground({ to, subject: `[${BANK_NAME} Admin] ${title}`, html })
}

// ── Generic email sender for custom emails ────────────────────────────────────

export async function sendCustomEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  return sendEmail({ to, subject, html })
}
