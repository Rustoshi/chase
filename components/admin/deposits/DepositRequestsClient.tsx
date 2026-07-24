"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Search, Download, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle,
  ChevronLeft, ChevronRight, Inbox,
} from "lucide-react"
import { DepositStatsBar }      from "@/components/admin/deposits/DepositStatsBar"
import { DepositDetailDrawer }  from "@/components/admin/deposits/DepositDetailDrawer"
import { ConfirmDepositModal }  from "@/components/admin/deposits/modals/ConfirmDepositModal"
import { RejectDepositModal }   from "@/components/admin/deposits/modals/RejectDepositModal"
import { BulkRejectModal }      from "@/components/admin/deposits/modals/BulkRejectModal"
import { PageHeader }           from "@/components/admin/PageHeader"
import { Badge }                from "@/components/ui/badge"
import { Button }               from "@/components/ui/button"
import { Input }                from "@/components/ui/input"
import { Select, SelectItem }   from "@/components/ui/select"
import type { DepositRequestItem, DepositStats } from "@/lib/services/deposit.service"

// ── Types ────────────────────────────────────────────────────────────────────

interface PaymentMethod { id: string; name: string }

interface FetchResult {
  requests: DepositRequestItem[]
  total:    number
  pages:    number
}

interface Props {
  initialStats: DepositStats
  initialData:  FetchResult
  methods:      PaymentMethod[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtAmt = (r: DepositRequestItem) => {
  const currency = r.account.walletType === "bitcoin" ? "BTC" : r.requestedCurrency
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: currency === "BTC" ? 8 : 2,
  }).format(r.requestedAmount)} ${currency}`
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") return <Badge variant="success">Confirmed</Badge>
  if (status === "rejected")  return <Badge variant="destructive">Rejected</Badge>
  return <Badge variant="warning">Pending</Badge>
}

function exportCSV(requests: DepositRequestItem[]) {
  const header = ["ID", "User", "Email", "Method", "Amount", "Currency", "Status", "Submitted", "Reviewed"]
  const rows   = requests.map((r) => [
    r.id,
    `${r.user.firstName} ${r.user.lastName}`,
    r.user.email,
    r.paymentMethod.name,
    r.requestedAmount,
    r.account.walletType === "bitcoin" ? "BTC" : r.requestedCurrency,
    r.status,
    r.createdAt,
    r.reviewedAt ?? "",
  ])

  const csv  = [header, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = `deposit-requests-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "pending",   label: "Pending",   icon: Clock        },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle  },
  { key: "rejected",  label: "Rejected",  icon: XCircle      },
  { key: "",          label: "All",       icon: AlertCircle  },
] as const

type TabKey = typeof TABS[number]["key"]

// ── Component ─────────────────────────────────────────────────────────────────

export function DepositRequestsClient({ initialStats, initialData, methods }: Props) {
  // ── Filter state ─────────────────────────────────────────────────────────
  const [activeTab,  setActiveTab]  = useState<TabKey>("pending")
  const [search,     setSearch]     = useState("")
  const [methodId,   setMethodId]   = useState("")
  const [dateFrom,   setDateFrom]   = useState("")
  const [dateTo,     setDateTo]     = useState("")
  const [page,       setPage]       = useState(1)

  // ── Data state ────────────────────────────────────────────────────────────
  const [stats,   setStats]   = useState<DepositStats>(initialStats)
  const [data,    setData]    = useState<FetchResult>(initialData)
  const [loading, setLoading] = useState(false)
  const [newBanner, setNewBanner] = useState(0)
  const prevPendingCount = useRef(initialData.total)

  // ── Selection state ───────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // ── Modal / drawer state ──────────────────────────────────────────────────
  const [drawerId,     setDrawerId]     = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<DepositRequestItem | null>(null)
  const [rejectModal,  setRejectModal]  = useState<DepositRequestItem | null>(null)
  const [bulkReject,   setBulkReject]   = useState(false)

  // ── Auto-refresh (pending tab only) ──────────────────────────────────────
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const buildQuery = useCallback((overrides: Record<string, unknown> = {}) => {
    const p: Record<string, string> = {}
    const status = overrides.status !== undefined ? String(overrides.status ?? "") : activeTab
    if (status)    p.status = status
    if (search)    p.search = search
    if (methodId)  p.paymentMethodId = methodId
    if (dateFrom)  p.dateFrom = dateFrom
    if (dateTo)    p.dateTo   = dateTo
    p.page  = String(overrides.page ?? page)
    p.limit = "20"
    return new URLSearchParams(p).toString()
  }, [activeTab, search, methodId, dateFrom, dateTo, page])

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    const [reqRes, statsRes] = await Promise.all([
      fetch(`/api/admin/deposit-requests?${buildQuery()}`),
      fetch("/api/admin/deposit-requests/stats"),
    ])
    if (!quiet) setLoading(false)
    if (!reqRes.ok || !statsRes.ok) return

    const [reqData, statsData] = await Promise.all([reqRes.json(), statsRes.json()])

    setData(reqData)
    setStats(statsData)

    // New requests banner (pending tab only)
    if (activeTab === "pending") {
      const incoming = reqData.total as number
      if (incoming > prevPendingCount.current) {
        setNewBanner(incoming - prevPendingCount.current)
      }
      prevPendingCount.current = incoming
    }

    setSelected(new Set())
  }, [buildQuery, activeTab])

  // Re-fetch when filters change
  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, methodId, dateFrom, dateTo, page])

  // Debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { fetchData() }, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Auto-refresh every 30s on pending tab
  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current)
    if (activeTab === "pending") {
      refreshRef.current = setInterval(() => fetchData(true), 30_000)
    }
    return () => { if (refreshRef.current) clearInterval(refreshRef.current) }
  }, [activeTab, fetchData])

  // ── Selection helpers ─────────────────────────────────────────────────────
  const allSelected  = data.requests.length > 0 && data.requests.every((r) => selected.has(r.id))
  const someSelected = !allSelected && data.requests.some((r) => selected.has(r.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.requests.map((r) => r.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedRequests = data.requests.filter((r) => selected.has(r.id))

  // ── Tab change ─────────────────────────────────────────────────────────────
  const changeTab = (key: TabKey) => {
    setActiveTab(key)
    setPage(1)
    setSelected(new Set())
    setNewBanner(0)
    prevPendingCount.current = 0
  }

  const handleAction = () => {
    fetchData()
    setNewBanner(0)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Deposit Requests"
          subtitle="Review and process user deposit requests"
        />

        {/* Stats */}
        {stats && <DepositStatsBar stats={stats} />}

        {/* New requests banner */}
        {newBanner > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-[#1A2CCE]/20 bg-[#1A2CCE]/5 px-4 py-2.5 text-sm text-[#1A2CCE]">
            <span>
              <strong>{newBanner}</strong> new deposit request{newBanner !== 1 ? "s" : ""} arrived since your last view.
            </span>
            <button onClick={() => setNewBanner(0)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => changeTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
                ${activeTab === key
                  ? "border-[#1A2CCE] text-[#1A2CCE]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {key === "pending" && stats?.pendingCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  {stats.pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, email, reference…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>

          {/* Method filter */}
          <div className="w-44">
            <Select
              value={methodId || "all"}
              onValueChange={(v) => { setMethodId(v === "all" ? "" : v); setPage(1) }}
              placeholder="All methods"
            >
              <SelectItem value="all">All methods</SelectItem>
              {methods.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A2CCE]/20"
            title="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A2CCE]/20"
            title="To date"
          />

          <Button variant="outline" onClick={() => fetchData()} className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={() => exportCSV(data.requests)}
            disabled={data.requests.length === 0}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Bulk actions bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-[#1A2CCE]/20 bg-[#1A2CCE]/5 px-4 py-2.5">
            <span className="text-sm font-medium text-[#1A2CCE]">{selected.size} selected</span>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkReject(true)}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Bulk reject
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : data.requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Inbox className="h-8 w-8" />
              <p className="text-sm">No deposit requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected }}
                      onChange={toggleAll}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">User</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Method</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Submitted</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.requests.map((r) => (
                  <tr
                    key={r.id}
                    className={`transition-colors hover:bg-slate-50 ${selected.has(r.id) ? "bg-indigo-50/40" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDrawerId(r.id)}
                        className="text-left hover:underline"
                      >
                        <p className="font-medium text-slate-800">{r.user.firstName} {r.user.lastName}</p>
                        <p className="text-xs text-slate-400">{r.user.email}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.paymentMethod.name}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{fmtAmt(r)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDrawerId(r.id)}
                          className="rounded-lg px-2.5 py-1 text-xs text-slate-600 border border-slate-200 hover:bg-slate-50"
                        >
                          View
                        </button>
                        {r.status === "pending" && (
                          <>
                            <button
                              onClick={() => setConfirmModal(r)}
                              className="rounded-lg px-2.5 py-1 text-xs text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setRejectModal(r)}
                              className="rounded-lg px-2.5 py-1 text-xs text-red-600 border border-red-200 hover:bg-red-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                const p = i + 1
                return (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={page === p ? "bg-[#1A2CCE] text-white border-[#1A2CCE]" : ""}
                  >
                    {p}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <DepositDetailDrawer
        requestId={drawerId}
        onClose={() => setDrawerId(null)}
        onAction={handleAction}
      />

      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmDepositModal
          open
          onClose={() => setConfirmModal(null)}
          onSuccess={handleAction}
          request={confirmModal}
        />
      )}

      {/* Reject modal */}
      {rejectModal && (
        <RejectDepositModal
          open
          onClose={() => setRejectModal(null)}
          onSuccess={handleAction}
          request={rejectModal}
        />
      )}

      {/* Bulk reject modal */}
      <BulkRejectModal
        open={bulkReject}
        onClose={() => setBulkReject(false)}
        onSuccess={() => { handleAction(); setSelected(new Set()) }}
        requests={selectedRequests}
      />
    </>
  )
}
