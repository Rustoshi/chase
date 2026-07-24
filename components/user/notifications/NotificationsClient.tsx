"use client"

import { useState, useCallback } from "react"
import {
  ArrowLeftRight, ShieldAlert, ShieldCheck, Landmark,
  CreditCard, Bell, Megaphone, Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { UserHeader } from "@/components/user/UserHeader"
import { Button } from "@/components/ui/button"
import { useThemeColors } from "@/components/shared/ThemeProvider"

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationItem {
  _id:     string
  type:    string
  channel: string
  subject: string
  body:    string
  isRead:  boolean
  sentAt:  string
}

interface Props {
  initialNotifications: NotificationItem[]
  initialUnreadCount:   number
  initialTotal:         number
}

// ── Type icon mapping ─────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  transaction:      { icon: ArrowLeftRight, bg: "#ECFDF3", color: "#12B76A" },
  security:         { icon: ShieldAlert,    bg: "#FEF3F2", color: "#F04438" },
  kyc:              { icon: ShieldCheck,    bg: "#EEF0FE", color: "#1A2CCE" },
  loan:             { icon: Landmark,       bg: "#EEF0FE", color: "#1A2CCE" },
  card:             { icon: CreditCard,     bg: "#EEF0FE", color: "#1A2CCE" },
  system:           { icon: Bell,           bg: "#F9FAFB", color: "#98A2B3" },
  marketing:        { icon: Megaphone,      bg: "#ECFDF3", color: "#12B76A" },
  deposit_request:  { icon: ArrowLeftRight, bg: "#ECFDF3", color: "#12B76A" },
  transfer:         { icon: ArrowLeftRight, bg: "#EEF0FE", color: "#1A2CCE" },
}

const FILTER_TABS = [
  { key: "all",          label: "All" },
  { key: "unread",       label: "Unread" },
  { key: "transaction",  label: "Transactions" },
  { key: "security",     label: "Security" },
  { key: "system",       label: "System" },
]

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ── Main Component ────────────────────────────────────────────────────────────

export function NotificationsClient({ initialNotifications, initialUnreadCount, initialTotal }: Props) {
  const colors = useThemeColors()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount]     = useState(initialUnreadCount)
  const [total]                           = useState(initialTotal)
  const [activeFilter, setActiveFilter]   = useState("all")
  const [expandedId, setExpandedId]       = useState<string | null>(null)
  const [page, setPage]                   = useState(1)
  const [loading, setLoading]             = useState(false)

  // Mark single as read
  const markRead = useCallback(async (id: string) => {
    try {
      await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch { /* */ }
  }, [])

  // Mark all read
  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch { /* */ }
  }, [])

  // Toggle expand
  const toggleExpand = useCallback(
    (id: string, isRead: boolean) => {
      setExpandedId((prev) => (prev === id ? null : id))
      if (!isRead) markRead(id)
    },
    [markRead]
  )

  // Load more
  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const nextPage = page + 1
      const typeParam = activeFilter === "all" ? "" : `&type=${activeFilter}`
      const res = await fetch(`/api/user/notifications?page=${nextPage}&limit=20${typeParam}`)
      if (res.ok) {
        const json = await res.json()
        setNotifications((prev) => [...prev, ...json.notifications])
        setPage(nextPage)
      }
    } catch { /* */ }
    setLoading(false)
  }, [page, activeFilter])

  // Filter change
  const changeFilter = useCallback(async (filter: string) => {
    setActiveFilter(filter)
    setPage(1)
    setExpandedId(null)

    try {
      const typeParam = filter === "all" ? "" : `&type=${filter}`
      const res = await fetch(`/api/user/notifications?page=1&limit=20${typeParam}`)
      if (res.ok) {
        const json = await res.json()
        setNotifications(json.notifications)
      }
    } catch { /* */ }
  }, [])

  // Filtered list
  const filtered = notifications

  return (
    <>
      <UserHeader
        title="Notifications"
        showBack
        rightElement={
          unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              className="text-xs font-medium whitespace-nowrap"
              style={{ color: colors.blue }}
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto px-4 py-3 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => changeFilter(tab.key)}
            className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: activeFilter === tab.key ? colors.blueBg : colors.bgHover,
              border: activeFilter === tab.key ? `1px solid ${colors.blue}4D` : `1px solid ${colors.border}`,
              color: activeFilter === tab.key ? colors.blue : colors.textSecondary,
            }}
          >
            {tab.label}
            {tab.key === "unread" && unreadCount > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px]" style={{ background: colors.bgHover }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="px-4 lg:px-6">
        {filtered.length === 0 ? (
          <EmptyState filter={activeFilter} colors={colors} />
        ) : (
          <div className="space-y-1">
            {filtered.map((notif) => {
              const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
              const Icon = config.icon
              const isExpanded = expandedId === notif._id

              return (
                <button
                  key={notif._id}
                  onClick={() => toggleExpand(notif._id, notif.isRead)}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors"
                  style={{ background: !notif.isRead ? colors.blueBg : "transparent" }}
                >
                  <div
                    className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: config.bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm leading-snug"
                      style={{ color: colors.textPrimary, fontWeight: !notif.isRead ? 600 : 400 }}
                    >
                      {notif.subject || notif.type}
                    </p>
                    <p
                      className={cn("text-xs leading-relaxed", isExpanded ? "mt-1" : "mt-0.5 line-clamp-1")}
                      style={{ color: colors.textTertiary }}
                    >
                      {notif.body}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                    <span className="text-[11px] whitespace-nowrap" style={{ color: colors.textMuted }}>
                      {relativeTime(notif.sentAt)}
                    </span>
                    {!notif.isRead && (
                      <span className="h-2 w-2 rounded-full" style={{ background: colors.blue }} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Load more */}
        {filtered.length < total && filtered.length > 0 && (
          <div className="py-4 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="h-10 rounded-xl px-6 text-[13px] font-medium transition-all active:scale-[0.98]"
              style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textSecondary }}
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

interface EmptyColors {
  bgHover: string
  textMuted: string
  textTertiary: string
}

function EmptyState({ filter, colors }: { filter: string; colors: EmptyColors }) {
  const messages: Record<string, string> = {
    all:         "You're all caught up! No notifications yet.",
    unread:      "No unread notifications.",
    transaction: "No transaction notifications.",
    security:    "No security alerts.",
    system:      "No system messages.",
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: colors.bgHover }}>
        <Inbox className="h-8 w-8" style={{ color: colors.textMuted }} />
      </div>
      <p className="text-sm" style={{ color: colors.textTertiary }}>{messages[filter] || "No notifications."}</p>
    </div>
  )
}
