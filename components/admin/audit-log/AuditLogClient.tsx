"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { BarChart, Bar, Tooltip, ResponsiveContainer } from "recharts"
import { Button }        from "@/components/ui/button"
import { Input }         from "@/components/ui/input"
import { useToast }      from "@/components/ui/use-toast"
import { Copy, ChevronDown, ChevronRight, Download } from "lucide-react"
import { ActionBadge }   from "./ActionBadge"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditLogItem {
  id:          string
  adminId:     string
  adminName:   string
  adminEmail:  string
  action:      string
  targetType?: string
  targetId?:   string
  payload?:    Record<string, unknown>
  ipAddress?:  string
  userAgent?:  string
  createdAt:   string
}

interface AuditLogStats {
  totalActions:    number
  uniqueAdmins:    number
  actionBreakdown: Array<{ action: string; count: number }>
  dailyActivity:   Array<{ date: string; count: number }>
  topAdmins:       Array<{ adminId: string; adminName: string; actionCount: number }>
}

interface Props {
  initialLogs:  AuditLogItem[]
  initialTotal: number
  initialStats: AuditLogStats
}

const LIMIT_OPTIONS = [25, 50, 100]

const TARGET_LINKS: Record<string, (id: string) => string> = {
  User:            (id) => `/admin/users/${id}`,
  Transaction:     (id) => `/admin/transactions?id=${id}`,
  LoanApplication: (id) => `/admin/loans?id=${id}`,
  CardApplication: (id) => `/admin/cards?id=${id}`,
}

// ── JSON Syntax Highlighter ───────────────────────────────────────────────────

function highlightJson(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2)
  return json
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span class="text-indigo-600">${match}</span>`
        return `<span class="text-green-700">${match}</span>`
      }
      if (/true|false/.test(match)) return `<span class="text-red-600">${match}</span>`
      if (/null/.test(match))       return `<span class="text-gray-400">${match}</span>`
      return `<span class="text-amber-600">${match}</span>`
    })
}

// ── Payload summary ───────────────────────────────────────────────────────────

function payloadSummary(payload?: Record<string, unknown>): string {
  if (!payload) return ""
  if (payload.before && payload.after) {
    const before = payload.before as Record<string, unknown>
    const after  = payload.after  as Record<string, unknown>
    const keys   = Object.keys(after)
    const changes = keys
      .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
      .map((k) => `${k}: ${String(before[k] ?? "—")} → ${String(after[k] ?? "—")}`)
    if (changes.length === 0) return `${keys.length} field${keys.length !== 1 ? "s" : ""} updated`
    const s = changes.join(" · ")
    return s.length > 80 ? s.slice(0, 77) + "…" : s
  }
  const keys = Object.keys(payload)
  if (keys.length === 0) return ""
  const s = keys.map((k) => `${k}: ${String(payload[k])}`).join(", ")
  return s.length > 80 ? s.slice(0, 77) + "…" : s
}

function parseUA(ua?: string): string {
  if (!ua) return "Unknown"
  if (/Firefox/i.test(ua))        return "Firefox"
  if (/Chrome/i.test(ua))         return "Chrome"
  if (/Safari/i.test(ua))         return "Safari"
  if (/Edge/i.test(ua))           return "Edge"
  if (/OPR|Opera/i.test(ua))      return "Opera"
  return "Unknown"
}

function formatTs(ts: string): { full: string; relative: string } {
  const d    = new Date(ts)
  const full = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
               " at " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return { full, relative: "just now" }
  if (mins < 60)  return { full, relative: `${mins}m ago` }
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return { full, relative: `${hrs}h ago` }
  return { full, relative: `${Math.floor(hrs / 24)}d ago` }
}

// ── Expanded row ──────────────────────────────────────────────────────────────

function ExpandedRow({ log }: { log: AuditLogItem }) {
  const link = log.targetType && log.targetId ? TARGET_LINKS[log.targetType]?.(log.targetId) : undefined
  const ts   = formatTs(log.createdAt)

  return (
    <tr>
      <td colSpan={7} className="bg-gray-50 border-b border-gray-200">
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payload */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payload</p>
            <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono overflow-auto max-h-64">
              {log.payload ? (
                <pre
                  className="text-gray-100 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlightJson(log.payload) }}
                />
              ) : (
                <span className="text-gray-500 italic">No payload</span>
              )}
            </div>
          </div>

          {/* Context */}
          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Context</p>
            <div className="space-y-1.5">
              <div>
                <span className="text-gray-500 text-xs">Action</span>
                <div className="mt-0.5"><ActionBadge action={log.action} /></div>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Target</span>
                <div className="mt-0.5 flex items-center gap-2">
                  {log.targetType && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{log.targetType}</span>
                  )}
                  {log.targetId && (
                    <>
                      <code className="text-xs font-mono text-gray-600">{log.targetId.slice(0, 16)}…</code>
                      {link && <a href={link} className="text-xs text-indigo-600 hover:underline">View →</a>}
                    </>
                  )}
                  {!log.targetType && <span className="text-xs text-gray-400">None</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500 text-xs">IP address</span>
                  <p className="font-mono text-xs text-gray-700 mt-0.5">{log.ipAddress ?? "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Browser</span>
                  <p className="text-xs text-gray-700 mt-0.5">{parseUA(log.userAgent)}</p>
                </div>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Admin</span>
                <p className="text-xs text-gray-700 mt-0.5">{log.adminName} · {log.adminEmail}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Timestamp</span>
                <p className="text-xs text-gray-700 mt-0.5">{ts.full}</p>
                <p className="text-xs text-gray-400">{new Date(log.createdAt).toISOString()}</p>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AuditLogClient({ initialLogs, initialTotal, initialStats }: Props) {
  const { toast }                     = useToast()
  const [logs,         setLogs]       = useState<AuditLogItem[]>(initialLogs)
  const [total,        setTotal]      = useState(initialTotal)
  const [stats,        setStats]      = useState<AuditLogStats>(initialStats)
  const [statsOpen,    setStatsOpen]  = useState(true)
  const [page,         setPage]       = useState(1)
  const [limit,        setLimit]      = useState(50)
  const [pages,        setPages]      = useState(Math.ceil(initialTotal / 50))
  const [search,       setSearch]     = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [targetType,   setTargetType] = useState("")
  const [sortOrder,    setSortOrder]  = useState("desc")
  const [loading,      setLoading]    = useState(false)
  const [expandedId,   setExpandedId] = useState<string | null>(null)
  const [allActions,   setAllActions] = useState<string[]>([])
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch("/api/admin/audit-log/actions")
      .then((r) => r.json())
      .then((a) => setAllActions(a as string[]))
      .catch(() => {})
  }, [])

  const fetchLogs = useCallback(async (opts: {
    page?: number; limit?: number; search?: string; action?: string; targetType?: string; sortOrder?: string
  }) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page:      String(opts.page      ?? 1),
        limit:     String(opts.limit     ?? 50),
        sortOrder: opts.sortOrder ?? "desc",
      })
      if (opts.search)     params.set("search",     opts.search)
      if (opts.action)     params.set("action",     opts.action)
      if (opts.targetType) params.set("targetType", opts.targetType)
      const res  = await fetch(`/api/admin/audit-log?${params}`)
      const data = await res.json() as { logs: AuditLogItem[]; total: number; pages: number }
      setLogs(data.logs)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      toast({ title: "Failed to load", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  function handleSearch(v: string) {
    setSearch(v)
    setPage(1)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => {
      fetchLogs({ page: 1, limit, search: v, action: actionFilter, targetType, sortOrder })
    }, 500)
  }

  function handleActionFilter(v: string) {
    setActionFilter(v)
    setPage(1)
    fetchLogs({ page: 1, limit, search, action: v, targetType, sortOrder })
  }

  function handleTargetType(v: string) {
    setTargetType(v)
    setPage(1)
    fetchLogs({ page: 1, limit, search, action: actionFilter, targetType: v, sortOrder })
  }

  function handleSort(v: string) {
    setSortOrder(v)
    setPage(1)
    fetchLogs({ page: 1, limit, search, action: actionFilter, targetType, sortOrder: v })
  }

  function handleLimitChange(v: number) {
    setLimit(v)
    setPage(1)
    fetchLogs({ page: 1, limit: v, search, action: actionFilter, targetType, sortOrder })
  }

  function handlePage(p: number) {
    setPage(p)
    fetchLogs({ page: p, limit, search, action: actionFilter, targetType, sortOrder })
  }

  async function handleExport() {
    try {
      const params = new URLSearchParams({ page: "1", limit: "5000", sortOrder })
      if (search)      params.set("search",     search)
      if (actionFilter) params.set("action",    actionFilter)
      if (targetType)  params.set("targetType", targetType)
      const res  = await fetch(`/api/admin/audit-log?${params}`)
      const data = await res.json() as { logs: AuditLogItem[] }
      const rows = data.logs.map((l) => [
        `"${new Date(l.createdAt).toISOString()}"`,
        `"${l.adminName}"`,
        `"${l.adminEmail}"`,
        `"${l.action}"`,
        `"${l.targetType ?? ""}"`,
        `"${l.targetId ?? ""}"`,
        `"${payloadSummary(l.payload).replace(/"/g, "\"\"")}"`,
        `"${l.ipAddress ?? ""}"`,
      ].join(","))
      const csv  = ["timestamp,adminName,adminEmail,action,targetType,targetId,payloadSummary,ipAddress", ...rows].join("\n")
      const url  = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
      const a    = document.createElement("a")
      a.href     = url
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: "Export failed", variant: "destructive" })
    }
  }

  // Group actions by prefix for dropdown display
  const actionGroups = allActions.reduce<Record<string, string[]>>((acc, a) => {
    const prefix = a.split(".")[0]
    if (!acc[prefix]) acc[prefix] = []
    acc[prefix].push(a)
    return acc
  }, {})

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast({ title: "Copied" })).catch(() => {})
  }

  const from = (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audit log</h1>
          <p className="text-sm text-gray-500 mt-1">Immutable record of every admin action</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* Stats section */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setStatsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 bg-white hover:bg-gray-50 text-left"
        >
          <span className="text-sm font-medium text-gray-900">Activity overview (last 30 days)</span>
          {statsOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </button>
        {statsOpen && (
          <div className="border-t border-gray-100 p-5 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3 lg:col-span-1">
                {[
                  { label: "Total actions",  value: stats.totalActions.toLocaleString() },
                  { label: "Active admins",  value: stats.uniqueAdmins },
                  { label: "Top action",     value: stats.actionBreakdown[0]?.action?.split(".")[1] ?? "—", mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-center">
                    <p className={`text-base font-bold text-gray-900 ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {/* Spark chart */}
              <div className="lg:col-span-2">
                <p className="text-xs text-gray-400 mb-1">Daily actions</p>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={stats.dailyActivity} barSize={6}>
                    <Tooltip
                      contentStyle={{ fontSize: 11, padding: "4px 8px" }}
                      formatter={(v: number) => [v, "actions"]}
                      labelFormatter={(label: string) => label}
                    />
                    <Bar dataKey="count" fill="#1A2CCE" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search action or email…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-60 text-sm h-9"
        />

        <select value={actionFilter} onChange={(e) => handleActionFilter(e.target.value)}
          className="h-9 text-sm border border-gray-300 rounded-lg px-2 bg-white min-w-[180px]">
          <option value="">All actions</option>
          {Object.entries(actionGroups).map(([prefix, actions]) => (
            <optgroup key={prefix} label={prefix}>
              {actions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
              <option value={`${prefix}.`}>All {prefix}.*</option>
            </optgroup>
          ))}
        </select>

        <select value={targetType} onChange={(e) => handleTargetType(e.target.value)}
          className="h-9 text-sm border border-gray-300 rounded-lg px-2 bg-white">
          <option value="">All target types</option>
          {["User", "Transaction", "LoanApplication", "CardApplication", "KycDocument", "PaymentMethod", "AppSettings", "DepositRequest"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select value={sortOrder} onChange={(e) => handleSort(e.target.value)}
          className="h-9 text-sm border border-gray-300 rounded-lg px-2 bg-white">
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>

        <select value={limit} onChange={(e) => handleLimitChange(Number(e.target.value))}
          className="h-9 text-sm border border-gray-300 rounded-lg px-2 bg-white">
          {LIMIT_OPTIONS.map((n) => <option key={n} value={n}>{n} per page</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm animate-pulse">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No audit log entries found.</div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-36">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Admin</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Target</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden xl:table-cell">Summary</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden xl:table-cell">IP</th>
                <th className="w-8 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const ts      = formatTs(log.createdAt)
                const summary = payloadSummary(log.payload)
                const isExp   = expandedId === log.id

                return (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedId(isExp ? null : log.id)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700">{ts.full}</p>
                        <p className="text-xs text-gray-400">{ts.relative}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#1A2CCE]/10 flex items-center justify-center text-[#1A2CCE] text-xs font-semibold flex-shrink-0">
                            {log.adminName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{log.adminName}</p>
                            <p className="text-xs text-gray-400 truncate">{log.adminEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {log.targetType && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {log.targetType}
                            </span>
                            {log.targetId && (
                              <div className="flex items-center gap-1">
                                <code className="text-xs font-mono text-gray-500">
                                  {log.targetId.slice(0, 12)}…
                                </code>
                                <button
                                  onClick={(e) => { e.stopPropagation(); copyToClipboard(log.targetId!) }}
                                  className="text-gray-300 hover:text-gray-500"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell max-w-xs">
                        <p className="text-xs text-gray-600 truncate">{summary || <span className="text-gray-300">—</span>}</p>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <code className="text-xs text-gray-400">{log.ipAddress ?? "—"}</code>
                      </td>
                      <td className="px-2 py-3 text-gray-400">
                        {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </td>
                    </tr>
                    {isExp && <ExpandedRow key={`exp-${log.id}`} log={log} />}
                  </>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Showing {from}–{to} of {total.toLocaleString()} entries</span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => handlePage(page - 1)}>
            Previous
          </Button>
          <Button size="sm" variant="outline" disabled={page === pages} onClick={() => handlePage(page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
