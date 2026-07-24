"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm, Controller }     from "react-hook-form"
import { zodResolver }             from "@hookform/resolvers/zod"
import { z }                       from "zod"
import { Button }                  from "@/components/ui/button"
import { Input }                   from "@/components/ui/input"
import { Label }                   from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast }                from "@/components/ui/use-toast"
import { Bell, Send, Users, CheckCircle, Megaphone } from "lucide-react"
import Link from "next/link"
import { BANK_NAME } from "@/lib/brand"

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationStats {
  totalSent:        number
  unreadCount:      number
  byType:           Array<{ type: string; count: number }>
  byChannel:        Array<{ channel: string; count: number }>
  recentBroadcasts: Record<string, unknown>[]
}

interface Props {
  stats: NotificationStats
}

// ── Form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  targetAudience:  z.enum(["all", "verified", "unverified", "specific_users"]),
  specificUserIds: z.array(z.string()).optional(),
  type:            z.enum(["system", "marketing"]),
  subject:         z.string().min(1, "Subject required").max(100),
  body:            z.string().min(1, "Message required").max(1000),
}).refine((d) => {
  if (d.targetAudience === "specific_users") return (d.specificUserIds?.length ?? 0) > 0
  return true
}, { message: "Select at least one user", path: ["specificUserIds"] })

type FormData = z.infer<typeof schema>

// ── User search for specific_users ────────────────────────────────────────────

interface UserSearchResult {
  id:        string
  firstName: string
  lastName:  string
  email:     string
}

function SpecificUsersSelector({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [query,   setQuery]   = useState("")
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [selected, setSelected] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const id = setTimeout(async () => {
      setSearching(true)
      try {
        const res  = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=8`)
        const data = await res.json() as { users?: UserSearchResult[] }
        setResults(data.users ?? [])
      } catch { /* ignore */ }
      finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(id)
  }, [query])

  function add(u: UserSearchResult) {
    if (value.includes(u.id)) return
    const next = [...selected, u]
    setSelected(next)
    onChange(next.map((x) => x.id))
    setQuery("")
    setResults([])
  }

  function remove(id: string) {
    const next = selected.filter((u) => u.id !== id)
    setSelected(next)
    onChange(next.map((u) => u.id))
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="Search users by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="text-sm"
        />
        {results.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {results.filter((u) => !value.includes(u.id)).map((u) => (
              <button
                key={u.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); add(u) }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
              >
                <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </button>
            ))}
            {searching && <p className="px-3 py-2 text-xs text-gray-400 animate-pulse">Searching…</p>}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[36px]">
          {selected.map((u) => (
            <span key={u.id} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-300 text-gray-700 px-2 py-0.5 rounded-full">
              {u.firstName} {u.lastName}
              <button type="button" onClick={() => remove(u.id)} className="text-gray-400 hover:text-gray-600">×</button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400">{selected.length} user{selected.length !== 1 ? "s" : ""} selected (max 100)</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function NotificationsClient({ stats: initialStats }: Props) {
  const { toast }                    = useToast()
  const [stats,         setStats]    = useState(initialStats)
  const [audienceCount, setAudienceCount] = useState<number | null>(null)
  const [countLoading,  setCountLoading]  = useState(false)
  const [confirmOpen,   setConfirmOpen]   = useState(false)
  const [sending,       setSending]       = useState(false)
  const [successSent,   setSuccessSent]   = useState<number | null>(null)
  const [pendingData,   setPendingData]   = useState<FormData | null>(null)

  const { register, handleSubmit, watch, control, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      targetAudience:  "all",
      type:            "system",
      subject:         "",
      body:            "",
      specificUserIds: [],
    },
  })

  const watchAll = watch()

  // Fetch audience count reactively
  const fetchCount = useCallback(async (audience: string, userIds: string[]) => {
    setCountLoading(true)
    try {
      const params = new URLSearchParams({ targetAudience: audience })
      if (audience === "specific_users" && userIds.length > 0) {
        userIds.forEach((id) => params.append("userId", id))
      }
      const res  = await fetch(`/api/admin/users?${params}&limit=1`)
      const data = await res.json() as { total?: number; users?: unknown[] }
      if (audience === "specific_users") {
        setAudienceCount(userIds.length)
      } else {
        setAudienceCount(data.total ?? 0)
      }
    } catch {
      setAudienceCount(null)
    } finally {
      setCountLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCount(watchAll.targetAudience, watchAll.specificUserIds ?? [])
  }, [watchAll.targetAudience, watchAll.specificUserIds, fetchCount])

  function onSubmit(data: FormData) {
    setPendingData(data)
    setConfirmOpen(true)
  }

  async function confirmSend() {
    if (!pendingData) return
    setSending(true)
    try {
      const res  = await fetch("/api/admin/notifications/broadcast", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(pendingData),
      })
      const data = await res.json() as { sent?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Failed")
      setSuccessSent(data.sent ?? 0)
      setConfirmOpen(false)
      reset()
      // Refresh stats
      fetch("/api/admin/notifications/stats")
        .then((r) => r.json())
        .then((s) => setStats(s as NotificationStats))
        .catch(() => {})
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  const audienceLabels: Record<string, string> = {
    all:            "All users",
    verified:       "Verified users only",
    unverified:     "Unverified users",
    specific_users: "Specific users",
  }

  const systemCount   = stats.byType.find((t) => t.type === "system")?.count     ?? 0
  const marketingCount = stats.byType.find((t) => t.type === "marketing")?.count  ?? 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Broadcast notifications to users</p>
      </div>

      {successSent !== null && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Notification sent successfully</p>
            <p className="text-sm text-green-700">Delivered to {successSent.toLocaleString()} user{successSent !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setSuccessSent(null)} className="ml-auto text-green-400 hover:text-green-600">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Broadcast form */}
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-[#1A2CCE]" />
            Send notification
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Target audience */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Target audience</Label>
              <div className="space-y-2">
                {([
                  { value: "all",            label: "All users",             desc: "Every registered user" },
                  { value: "verified",       label: "Verified users only",   desc: "KYC status = verified" },
                  { value: "unverified",     label: "Unverified users",      desc: "KYC not yet completed" },
                  { value: "specific_users", label: "Specific users",        desc: "Choose individuals" },
                ] as const).map((opt) => (
                  <label key={opt.value} className={[
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    watchAll.targetAudience === opt.value ? "border-[#1A2CCE] bg-[#1A2CCE]/5" : "border-gray-200 hover:border-gray-300",
                  ].join(" ")}>
                    <input type="radio" value={opt.value} {...register("targetAudience")} className="mt-0.5 accent-[#1A2CCE]" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.targetAudience && <p className="text-xs text-red-500">{errors.targetAudience.message}</p>}
            </div>

            {/* Specific users search */}
            {watchAll.targetAudience === "specific_users" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Select users</Label>
                <Controller
                  name="specificUserIds"
                  control={control}
                  render={({ field }) => (
                    <SpecificUsersSelector value={field.value ?? []} onChange={field.onChange} />
                  )}
                />
                {errors.specificUserIds && <p className="text-xs text-red-500">{errors.specificUserIds.message}</p>}
              </div>
            )}

            {/* Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notification type</Label>
              <div className="flex gap-3">
                {(["system", "marketing"] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={t} {...register("type")} className="accent-[#1A2CCE]" />
                    <span className="text-sm capitalize text-gray-700">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Subject</Label>
              <Input {...register("subject")} placeholder="Important platform update" />
              {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Message</Label>
              <textarea
                {...register("body")}
                rows={5}
                placeholder="Enter your message here…"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1A2CCE] focus:border-[#1A2CCE]"
              />
              <p className="text-xs text-gray-400">{watchAll.body?.length ?? 0}/1000</p>
              {errors.body && <p className="text-xs text-red-500">{errors.body.message}</p>}
            </div>

            {/* Preview */}
            {(watchAll.subject || watchAll.body) && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-[#1A2CCE]" />
                  <span className="text-xs font-semibold text-gray-600">{BANK_NAME}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${watchAll.type === "marketing" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}`}>
                    {watchAll.type}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">Just now</span>
                </div>
                {watchAll.subject && <p className="text-sm font-semibold text-gray-900">{watchAll.subject}</p>}
                {watchAll.body    && <p className="text-sm text-gray-700 whitespace-pre-line">{watchAll.body}</p>}
              </div>
            )}

            {/* Audience count */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm text-indigo-700 flex items-center gap-2">
              <Users className="w-4 h-4 flex-shrink-0" />
              {countLoading ? (
                <span className="animate-pulse">Counting recipients…</span>
              ) : audienceCount !== null ? (
                <span>This will be sent to approximately <strong>{audienceCount.toLocaleString()}</strong> user{audienceCount !== 1 ? "s" : ""}</span>
              ) : (
                <span>Unable to estimate recipient count</span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gap-2 bg-[#1A2CCE] hover:bg-[#1A2CCE]/90"
              disabled={!watchAll.subject || !watchAll.body || audienceCount === 0}
            >
              <Send className="w-4 h-4" />
              Send to {audienceCount !== null ? audienceCount.toLocaleString() : "…"} users
            </Button>
          </form>
        </div>

        {/* Right: Stats */}
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#1A2CCE]" />
            Notification stats
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total sent",  value: stats.totalSent.toLocaleString(),   color: "text-gray-900" },
              { label: "Unread",      value: stats.unreadCount.toLocaleString(), color: "text-amber-600" },
              { label: "System",      value: systemCount.toLocaleString(),        color: "text-indigo-600"  },
              { label: "Marketing",   value: marketingCount.toLocaleString(),     color: "text-purple-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Recent broadcasts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Recent broadcasts</p>
              <Link href="/admin/audit-log?action=notification.broadcast"
                className="text-xs text-indigo-600 hover:underline">View audit log →</Link>
            </div>

            {stats.recentBroadcasts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No broadcasts yet.</p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[640px] text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Subject</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Audience</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.recentBroadcasts.map((b, i) => {
                      const payload = (b.payload ?? {}) as Record<string, unknown>
                      const date    = b.createdAt ? new Date(b.createdAt as string).toLocaleDateString() : "—"
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-500">{date}</td>
                          <td className="px-3 py-2 text-gray-900 max-w-[140px] truncate">{String(payload.subject ?? "—")}</td>
                          <td className="px-3 py-2 text-gray-500 capitalize">{String(payload.targetAudience ?? "—")}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-700">{Number(payload.userCount ?? 0).toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm broadcast</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600 space-y-2">
            <p>You are about to send a notification to <strong>{audienceCount?.toLocaleString() ?? "?"} users</strong>.</p>
            <p className="text-xs text-gray-400">This cannot be undone.</p>
            {pendingData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1">
                <p><span className="font-medium">Subject:</span> {pendingData.subject}</p>
                <p><span className="font-medium">Audience:</span> {audienceLabels[pendingData.targetAudience]}</p>
                <p><span className="font-medium">Type:</span> {pendingData.type}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={confirmSend}
              disabled={sending}
              className="bg-[#1A2CCE] hover:bg-[#1A2CCE]/90"
            >
              {sending ? "Sending…" : `Send to ${audienceCount?.toLocaleString() ?? "?"} users`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
