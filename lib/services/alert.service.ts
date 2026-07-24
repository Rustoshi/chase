import mongoose from "mongoose"
import { connectDB } from "@/lib/db/connection"
import UserAlert, { type AlertSeverity } from "@/lib/models/UserAlert"
import User from "@/lib/models/User"
import { createAuditLog } from "@/lib/services/auth.service"
import { sendAccountAlertEmail } from "@/lib/email"

// ── Types ─────────────────────────────────────────────────────────────────────

/** Shape handed to the client (plain, RSC-safe). */
export interface UserAlertView {
  id:                 string
  title:              string
  body:               string
  severity:           AlertSeverity
  isActive:           boolean
  requireAcknowledge: boolean
  blockTransactions:  boolean
  acknowledgedAt:     string | null
  updatedAt:          string
}

export interface UpsertUserAlertInput {
  title:               string
  body:                string
  severity?:           AlertSeverity
  isActive?:           boolean
  requireAcknowledge?: boolean
  blockTransactions?:  boolean
  /** Also email the client a copy of this alert. */
  sendEmail?:          boolean
}

function toView(doc: Record<string, unknown>): UserAlertView {
  return {
    id:                 String(doc._id),
    title:              String(doc.title),
    body:               String(doc.body),
    severity:           (doc.severity as AlertSeverity) ?? "critical",
    isActive:           Boolean(doc.isActive),
    requireAcknowledge: Boolean(doc.requireAcknowledge),
    blockTransactions:  Boolean(doc.blockTransactions),
    acknowledgedAt:     doc.acknowledgedAt ? new Date(doc.acknowledgedAt as Date).toISOString() : null,
    updatedAt:          new Date(doc.updatedAt as Date).toISOString(),
  }
}

// ── Reads ─────────────────────────────────────────────────────────────────────

/** The alert to show a client right now (null when none / switched off). */
export async function getActiveUserAlert(userId: string): Promise<UserAlertView | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null
  await connectDB()

  const doc = await UserAlert.findOne({ userId, isActive: true }).lean()
  return doc ? toView(doc as unknown as Record<string, unknown>) : null
}

/** The alert as the admin sees it — returned even when switched off. */
export async function getUserAlertForAdmin(userId: string): Promise<UserAlertView | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null
  await connectDB()

  const doc = await UserAlert.findOne({ userId }).lean()
  return doc ? toView(doc as unknown as Record<string, unknown>) : null
}

// ── Money-movement guard ──────────────────────────────────────────────────────

/**
 * Throws when the client has an active alert configured to freeze money movement.
 * Enforced server-side so the block holds even if the UI is bypassed.
 */
export async function assertTransactionsAllowed(userId: string): Promise<void> {
  const alert = await getActiveUserAlert(userId)
  if (alert?.blockTransactions) {
    throw new Error(
      `${alert.title} — transactions are temporarily unavailable on your account. Please contact support.`
    )
  }
}

// ── Writes ────────────────────────────────────────────────────────────────────

/** Create or replace the client's alert. Editing resets the acknowledgement. */
export async function upsertUserAlert(
  userId:     string,
  input:      UpsertUserAlertInput,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<UserAlertView> {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user")
  if (!input.title?.trim()) throw new Error("Title is required")
  if (!input.body?.trim())  throw new Error("Message is required")

  await connectDB()

  const user = await User.findById(userId).select("email firstName").lean() as
    { email?: string; firstName?: string } | null
  if (!user) throw new Error("User not found")

  const doc = await UserAlert.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    {
      $set: {
        title:              input.title.trim(),
        body:               input.body.trim(),
        severity:           input.severity ?? "critical",
        isActive:           input.isActive ?? true,
        requireAcknowledge: input.requireAcknowledge ?? false,
        blockTransactions:  input.blockTransactions ?? false,
        createdBy:          new mongoose.Types.ObjectId(adminId),
        // Content changed → the client must see it again.
        acknowledgedAt:     undefined,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()

  await createAuditLog(
    adminId, adminEmail, "user.alert_set", "UserAlert", String((doc as Record<string, unknown>)._id),
    {
      userId,
      title: input.title,
      severity: input.severity,
      isActive: input.isActive,
      requireAcknowledge: input.requireAcknowledge,
      blockTransactions: input.blockTransactions,
    },
    req
  )

  // Optional copy by email (fire-and-forget; delivered in the background).
  if (input.sendEmail && (input.isActive ?? true) && user.email) {
    sendAccountAlertEmail(
      user.email,
      user.firstName || "there",
      input.title.trim(),
      input.body.trim(),
      input.severity ?? "critical"
    ).catch(() => {})
  }

  return toView(doc as unknown as Record<string, unknown>)
}

/** Switch the alert off (keeps the content so it can be re-enabled). */
export async function deactivateUserAlert(
  userId:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<UserAlertView | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user")
  await connectDB()

  const doc = await UserAlert.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $set: { isActive: false } },
    { new: true }
  ).lean()
  if (!doc) return null

  await createAuditLog(
    adminId, adminEmail, "user.alert_cleared", "UserAlert",
    String((doc as Record<string, unknown>)._id), { userId }, req
  )

  return toView(doc as unknown as Record<string, unknown>)
}

/** The client confirms they have read the alert. */
export async function acknowledgeUserAlert(userId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return
  await connectDB()

  await UserAlert.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId), isActive: true },
    { $set: { acknowledgedAt: new Date() } }
  )
}
