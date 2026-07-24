import type { Metadata }        from "next"
import { auth }                  from "@/lib/auth"
import { redirect }              from "next/navigation"
import { getNotificationStats }  from "@/lib/services/notification.service"
import { NotificationsClient }   from "@/components/admin/notifications/NotificationsClient"

export const metadata: Metadata = { title: "Notifications" }
export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  const stats = await getNotificationStats().catch(() => ({
    totalSent:        0,
    unreadCount:      0,
    byType:           [],
    byChannel:        [],
    recentBroadcasts: [],
  }))

  return (
    <div className="px-6 py-8 max-w-screen-xl mx-auto">
      <NotificationsClient stats={stats} />
    </div>
  )
}
