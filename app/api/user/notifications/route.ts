import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import Notification from "@/lib/models/Notification"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const uid = new mongoose.Types.ObjectId(session.user.id)
    const sp = req.nextUrl.searchParams

    const page  = parseInt(sp.get("page") || "1", 10)
    const limit = Math.min(parseInt(sp.get("limit") || "20", 10), 50)
    const skip  = (page - 1) * limit

    const filter: Record<string, unknown> = { userId: uid }
    const typeFilter = sp.get("type")
    if (typeFilter && typeFilter !== "all") {
      if (typeFilter === "unread") {
        filter.isRead = false
      } else {
        filter.type = typeFilter
      }
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ sentAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: uid, isRead: false }),
    ])

    const serialized = notifications.map((n) => ({
      _id:     n._id.toString(),
      type:    n.type,
      channel: n.channel,
      subject: n.subject || "",
      body:    n.body,
      isRead:  n.isRead,
      sentAt:  n.sentAt.toISOString(),
    }))

    return NextResponse.json({
      notifications: serialized,
      total,
      unreadCount,
      hasMore: skip + notifications.length < total,
    })
  } catch (err) {
    console.error("[Notifications API GET]", err)
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    if (body.markAllRead) {
      await Notification.updateMany(
        { userId: session.user.id, isRead: false },
        { isRead: true, readAt: new Date() }
      )
      return NextResponse.json({ success: true })
    }

    if (body.notificationId) {
      const notif = await Notification.findById(body.notificationId)
      if (!notif || notif.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      notif.isRead = true
      notif.readAt = new Date()
      await notif.save()
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (err) {
    console.error("[Notifications API PATCH]", err)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
