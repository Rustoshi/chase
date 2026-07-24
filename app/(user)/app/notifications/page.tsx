import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/db/connection"
import mongoose from "mongoose"
import Notification from "@/lib/models/Notification"
import { NotificationsClient } from "@/components/user/notifications/NotificationsClient"
import { BANK_NAME } from "@/lib/brand"

export const metadata: Metadata = { title: `Notifications — ${BANK_NAME}` }

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  await connectDB()
  const uid = new mongoose.Types.ObjectId(session.user.id)

  const [docs, unreadCount] = await Promise.all([
    Notification.find({ userId: uid })
      .sort({ sentAt: -1 })
      .limit(20)
      .lean(),
    Notification.countDocuments({ userId: uid, isRead: false }),
  ])

  const total = await Notification.countDocuments({ userId: uid })

  const notifications = docs.map((n) => ({
    _id:     n._id.toString(),
    type:    n.type as string,
    channel: n.channel as string,
    subject: n.subject || "",
    body:    n.body,
    isRead:  n.isRead,
    sentAt:  n.sentAt.toISOString(),
  }))

  return (
    <NotificationsClient
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
      initialTotal={total}
    />
  )
}
