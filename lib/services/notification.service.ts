import mongoose          from "mongoose"
import { connectDB }     from "@/lib/db/connection"
import Notification      from "@/lib/models/Notification"
import User              from "@/lib/models/User"
import AuditLog          from "@/lib/models/AuditLog"
import { createAuditLog } from "@/lib/services/auth.service"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BroadcastData {
  targetAudience:   "all" | "verified" | "unverified" | "specific_users"
  specificUserIds?: string[]
  subject:          string
  body:             string
  type:             "system" | "marketing"
}

export interface NotificationStats {
  totalSent:        number
  unreadCount:      number
  byType:           Array<{ type: string; count: number }>
  byChannel:        Array<{ channel: string; count: number }>
  recentBroadcasts: Record<string, unknown>[]
}

// ── broadcastNotification ─────────────────────────────────────────────────────

export async function broadcastNotification(
  data:       BroadcastData,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<{ sent: number }> {
  await connectDB()

  // Build user query
  let userQuery: Record<string, unknown> = { role: "user", isActive: true }

  if (data.targetAudience === "verified") {
    userQuery.kycStatus = "verified"
  } else if (data.targetAudience === "unverified") {
    userQuery.kycStatus = { $ne: "verified" }
  } else if (data.targetAudience === "specific_users") {
    if (!data.specificUserIds?.length) throw new Error("specificUserIds required")
    userQuery = { _id: { $in: data.specificUserIds.map((id) => new mongoose.Types.ObjectId(id)) } }
  }

  const users = await User.find(userQuery).select("_id").lean()
  if (users.length === 0) return { sent: 0 }

  const notifType  = data.type === "marketing" ? "marketing" : "system"
  const BATCH_SIZE = 500

  let sent = 0
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE)
    const docs  = batch.map((u) => ({
      userId:  u._id,
      type:    notifType,
      channel: "in_app",
      subject: data.subject,
      body:    data.body,
    }))
    await Notification.insertMany(docs, { ordered: false })
    sent += batch.length
  }

  await createAuditLog(adminId, adminEmail, "notification.broadcast", undefined, undefined, {
    targetAudience: data.targetAudience,
    userCount:      sent,
    subject:        data.subject,
    type:           data.type,
  }, req)

  return { sent }
}

// ── getNotificationStats ──────────────────────────────────────────────────────

export async function getNotificationStats(): Promise<NotificationStats> {
  await connectDB()

  const [totalSent, unreadCount, byType, byChannel] = await Promise.all([
    Notification.countDocuments(),
    Notification.countDocuments({ isRead: false }),
    Notification.aggregate([
      { $group: { _id: "$type",    count: { $sum: 1 } } },
      { $project: { type: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),
    Notification.aggregate([
      { $group: { _id: "$channel",    count: { $sum: 1 } } },
      { $project: { channel: "$_id", count: 1, _id: 0 } },
    ]),
  ])

  const recentBroadcasts = await AuditLog.find({ action: "notification.broadcast" })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()

  return {
    totalSent,
    unreadCount,
    byType:           byType as Array<{ type: string; count: number }>,
    byChannel:        byChannel as Array<{ channel: string; count: number }>,
    recentBroadcasts: recentBroadcasts as unknown as Record<string, unknown>[],
  }
}
