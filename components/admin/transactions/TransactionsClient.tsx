"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname }   from "next/navigation"
import {
  Search, Download, RefreshCw, Plus, MoreHorizontal,
  ChevronLeft, ChevronRight, Inbox, SlidersHorizontal, X,
  Copy, Check, ExternalLink,
} from "lucide-react"
import { TransactionVolumeChart }    from "@/components/admin/transactions/TransactionVolumeChart"
import { TransactionDetailDrawer }   from "@/components/admin/transactions/TransactionDetailDrawer"
import { TransactionTypeFilter }     from "@/components/admin/transactions/TransactionTypeFilter"
import { CreateTransactionModal }    from "@/components/admin/transactions/modals/CreateTransactionModal"
import { ReverseTransactionModal }   from "@/components/admin/transactions/modals/ReverseTransactionModal"
import { PageHeader }                from "@/components/admin/PageHeader"
import { StatusBadge }               from "@/components/admin/StatusBadge"
import { UserAvatar }                from "@/components/admin/users/UserAvatar"
import { Button }                    from "@/components/ui/button"
import { Input }                     from "@/components/ui/input"
import { Select, SelectItem }        from "@/components/ui/select"
import { Badge }                     from "@/components/ui/badge"
import { toast }                     from "@/components/ui/use-toast"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TransactionListItem, TransactionSummary, TransactionDetail }
  from "@/lib/services/transaction.service"
import { TYPE_LABELS } from "@/components/admin/transactions/TransactionTypeFilter"

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = ["pending", "processing", "completed", "failed", "reversed"] as const
const CREDIT_TYPES = new Set([
  "deposit", "admin_deposit", "transfer_in", "swap_in", "refund", "loan_disbursement",
])
const NON_REVERSIBLE = new Set(["fee", "loan_repayment"])

const TYPE_COLORS: Record<string, string> = {
  admin_deposit:    "bg-indigo-100 text-indigo-700",
  deposit:          "bg-emerald-100 text-emerald-700",
  withdrawal:       "bg-amber-100 text-amber-700",
  transfer_out:     "bg-orange-100 text-orange-700",
  transfer_in:      "bg-teal-100 text-teal-700",
  swap_in:          "bg-purple-100 text-purple-700",
  swap_out:         "bg-purple-50 text-purple-600",
  fee:              "bg-slate-100 text-slate-600",
  refund:           "bg-emerald-50 text-emerald-600",
  loan_disbursement:"bg-indigo-100 text-indigo-700",
  loan_repayment:   "bg-indigo-50 text-indigo-600",
  fx_conversion:    "bg-pink-100 text-pink-700",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtCurrency = (n: number, currency: string) => {
  // Amount is already in human-readable format from the API (divided by 100 for fiat, 1e8 for BTC)
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "BTC" ? 8 : 2,
    maximumFractionDigits: currency === "BTC" ? 8 : 2,
  }).format(n)
}

const fmtVolume = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_COLORS[type] ?? "bg-slate-100 text-slate-600"}`}>
      {TYPE_LABELS[type] ?? type.replace(/_/g, " ")}
    </span>
  )
}

function exportCurrentPage(transactions: TransactionListItem[]) {
  const header = ["Reference","Type","Status","User","Email","Account","Currency","Amount","Fee","Date"]
  const rows   = transactions.map((t) => [
    t.reference, t.type, t.status,
    t.user ? `${t.user.firstName} ${t.user.lastName}` : "System",
    t.user?.email ?? "",
    t.account.accountNumber, t.currency,
    t.amount, t.feeAmount ?? 0,
    t.createdAt,
  ])
  const csv  = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = `transactions-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FetchResult {
  transactions: TransactionListItem[]
  total:        number
  pages:        number
  summary:      TransactionSummary
}

interface Props { initialData: FetchResult }

// ── Component ─────────────────────────────────────────────────────────────────

export function TransactionsClient({ initialData }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  // ── Filter state (URL-synced) ─────────────────────────────────────────────
  const [search,     setSearch]     = useState(searchParams.get("search")  ?? "")
  const [statuses,   setStatuses]   = useState<string[]>(
    searchParams.get("status")?.split(",").filter(Boolean) ?? []
  )
  const [types,      setTypes]      = useState<string[]>(
    searchParams.get("types")?.split(",").filter(Boolean) ?? []
  )
  const [dateFrom,   setDateFrom]   = useState(searchParams.get("dateFrom") ?? "")
  const [dateTo,     setDateTo]     = useState(searchParams.get("dateTo")   ?? "")
  const [page,       setPage]       = useState(Number(searchParams.get("page") ?? 1))
  const [limit,      setLimit]      = useState(Number(searchParams.get("limit") ?? 25))

  // Advanced filters
  const [advOpen,    setAdvOpen]    = useState(false)
  const [userId,     setUserId]     = useState(searchParams.get("userId")    ?? "")
  const [amountMin,  setAmountMin]  = useState(searchParams.get("amountMin") ?? "")
  const [amountMax,  setAmountMax]  = useState(searchParams.get("amountMax") ?? "")
  const [currency,   setCurrency]   = useState(searchParams.get("currency")  ?? "")
  const [excludeGen, setExcludeGen] = useState(searchParams.get("excludeGenerated") === "true")
  const [sortBy,     setSortBy]     = useState(searchParams.get("sortBy")    ?? "createdAt")
  const [sortOrder,  setSortOrder]  = useState<"asc"|"desc">((searchParams.get("sortOrder") ?? "desc") as "asc"|"desc")

  // ── Data state ────────────────────────────────────────────────────────────
  const [data,        setData]        = useState<FetchResult>(initialData)
  const [loading,     setLoading]     = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [refreshSignal, setRefreshSignal] = useState(0)

  // ── Modals / drawer ───────────────────────────────────────────────────────
  const [drawerId,    setDrawerId]    = useState<string | null>(null)
  const [createOpen,  setCreateOpen]  = useState(false)
  const [reverseTarget, setReverseTarget] = useState<TransactionDetail | null>(null)

  // Copied reference state
  const [copiedRef, setCopiedRef] = useState<string | null>(null)

  // ── Build params from state ───────────────────────────────────────────────
  const buildParams = useCallback((overrides: Record<string, unknown> = {}) => {
    const p = new URLSearchParams()
    const s = String(overrides.search  ?? search)
    const pg = String(overrides.page   ?? page)
    const lm = String(overrides.limit  ?? limit)
    const st = (overrides.statuses ?? statuses) as string[]
    const ty = (overrides.types    ?? types)    as string[]
    const df = String(overrides.dateFrom ?? dateFrom)
    const dt = String(overrides.dateTo   ?? dateTo)
    const uid = String(overrides.userId   ?? userId)
    const amin = String(overrides.amountMin ?? amountMin)
    const amax = String(overrides.amountMax ?? amountMax)
    const cur  = String(overrides.currency ?? currency)
    const xgen = Boolean(overrides.excludeGen ?? excludeGen)
    const sb   = String(overrides.sortBy    ?? sortBy)
    const so   = String(overrides.sortOrder ?? sortOrder)

    if (s)          p.set("search",  s)
    if (st.length)  p.set("status",  st.join(","))
    if (ty.length)  p.set("types",   ty.join(","))
    if (df)         p.set("dateFrom", df)
    if (dt)         p.set("dateTo",   dt)
    if (uid)        p.set("userId",   uid)
    if (amin)       p.set("amountMin", amin)
    if (amax)       p.set("amountMax", amax)
    if (cur)        p.set("currency",  cur)
    if (xgen)       p.set("excludeGenerated", "true")
    p.set("sortBy",    sb)
    p.set("sortOrder", so)
    p.set("page",  pg)
    p.set("limit", lm)
    return p
  }, [search, statuses, types, dateFrom, dateTo, userId, amountMin, amountMax, currency, excludeGen, sortBy, sortOrder, page, limit])

  const fetchData = useCallback(async (overrides: Record<string, unknown> = {}) => {
    setLoading(true)
    const p = buildParams(overrides)
    // map 'types' URL param to 'type' API param
    const apiParams = new URLSearchParams(p)
    const typesVal = apiParams.get("types")
    if (typesVal) { apiParams.delete("types"); apiParams.set("type", typesVal) }
    const isGenVal = apiParams.get("excludeGenerated")
    if (isGenVal === "true") { apiParams.delete("excludeGenerated"); apiParams.set("isGenerated", "false") }

    try {
      const res  = await fetch(`/api/admin/transactions?${apiParams}`)
      const json = await res.json()
      if (res.ok) setData(json)
    } finally {
      setLoading(false)
    }

    // Sync URL
    router.replace(`${pathname}?${p}`, { scroll: false })
  }, [buildParams, pathname, router])

  // Debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchData({ page: 1 }), 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Non-debounced filter changes
  const applyFilter = useCallback((overrides: Record<string, unknown> = {}) => {
    fetchData({ page: 1, ...overrides })
  }, [fetchData])

  // ── Active filter chips ───────────────────────────────────────────────────
  const activeFilters: { key: string; label: string; clear: () => void }[] = []
  statuses.forEach((s) => activeFilters.push({
    key: `status-${s}`, label: `Status: ${s}`,
    clear: () => { const next = statuses.filter((x) => x !== s); setStatuses(next); applyFilter({ statuses: next }) },
  }))
  types.forEach((t) => activeFilters.push({
    key: `type-${t}`, label: `Type: ${TYPE_LABELS[t] ?? t}`,
    clear: () => { const next = types.filter((x) => x !== t); setTypes(next); applyFilter({ types: next }) },
  }))
  if (dateFrom) activeFilters.push({ key: "dateFrom", label: `From: ${dateFrom}`, clear: () => { setDateFrom(""); applyFilter({ dateFrom: "" }) } })
  if (dateTo)   activeFilters.push({ key: "dateTo",   label: `To: ${dateTo}`,     clear: () => { setDateTo("");   applyFilter({ dateTo: "" }) } })
  if (userId)   activeFilters.push({ key: "userId",   label: `User ID: ${userId.slice(0,8)}…`, clear: () => { setUserId(""); applyFilter({ userId: "" }) } })
  if (amountMin)activeFilters.push({ key: "amtMin",   label: `Min: $${amountMin}`, clear: () => { setAmountMin(""); applyFilter({ amountMin: "" }) } })
  if (amountMax)activeFilters.push({ key: "amtMax",   label: `Max: $${amountMax}`, clear: () => { setAmountMax(""); applyFilter({ amountMax: "" }) } })
  if (currency) activeFilters.push({ key: "currency", label: `Currency: ${currency}`, clear: () => { setCurrency(""); applyFilter({ currency: "" }) } })
  if (excludeGen) activeFilters.push({ key: "xgen", label: "Excluding generated", clear: () => { setExcludeGen(false); applyFilter({ excludeGen: false }) } })

  const clearAll = () => {
    setSearch(""); setStatuses([]); setTypes([]); setDateFrom(""); setDateTo("")
    setUserId(""); setAmountMin(""); setAmountMax(""); setCurrency(""); setExcludeGen(false)
    setSortBy("createdAt"); setSortOrder("desc"); setPage(1)
    fetchData({ search: "", statuses: [], types: [], dateFrom: "", dateTo: "", userId: "",
      amountMin: "", amountMax: "", currency: "", excludeGen: false,
      sortBy: "createdAt", sortOrder: "desc", page: 1 })
  }

  const handleAction = () => {
    fetchData()
    setRefreshSignal((n) => n + 1)
  }

  const copyRef = async (ref: string) => {
    await navigator.clipboard.writeText(ref)
    setCopiedRef(ref)
    setTimeout(() => setCopiedRef(null), 1500)
  }

  const handleExportAll = async () => {
    setExportLoading(true)
    const p = buildParams()
    const apiParams = new URLSearchParams(p)
    const typesVal = apiParams.get("types")
    if (typesVal) { apiParams.delete("types"); apiParams.set("type", typesVal) }
    const isGenVal = apiParams.get("excludeGenerated")
    if (isGenVal === "true") { apiParams.delete("excludeGenerated"); apiParams.set("isGenerated", "false") }
    apiParams.delete("page"); apiParams.delete("limit")

    try {
      const res = await fetch(`/api/admin/transactions/export?${apiParams}`)
      if (!res.ok) { toast({ title: "Export failed", variant: "destructive" }); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = `novapay-transactions-${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: "Export failed", variant: "destructive" })
    } finally {
      setExportLoading(false)
    }
  }

  const isReversible = (t: TransactionListItem) =>
    t.status === "completed" && !NON_REVERSIBLE.has(t.type)

  const canUpdateStatus = (t: TransactionListItem) =>
    t.status === "pending" || t.status === "processing"

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Transactions"
          subtitle="Full ledger of every money movement on the platform"
          actions={
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-[#1A2CCE] hover:bg-[#1A2CCE]/90 text-white gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Create transaction
            </Button>
          }
        />

        {/* Volume chart */}
        <TransactionVolumeChart refreshSignal={refreshSignal} />

        {/* Filter row 1 */}
        <div className="space-y-3">
          {/* Search row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Reference, description, user name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => fetchData()} className="shrink-0">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Filters row - scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
            {/* Status multi-select */}
            <StatusMultiSelect selected={statuses} onChange={(v) => { setStatuses(v); applyFilter({ statuses: v }) }} />

            {/* Type multi-select */}
            <TransactionTypeFilter
              selected={types}
              onChange={(v) => { setTypes(v); applyFilter({ types: v }) }}
            />

            {/* Date range */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); applyFilter({ dateFrom: e.target.value }) }}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A2CCE]/20 shrink-0"
              title="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); applyFilter({ dateTo: e.target.value }) }}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A2CCE]/20 shrink-0"
              title="To date"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdvOpen((o) => !o)}
              className={`shrink-0 ${advOpen ? "border-[#1A2CCE] text-[#1A2CCE]" : ""}`}
            >
              <SlidersHorizontal className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Filters</span>
            </Button>

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5 shrink-0" disabled={exportLoading}>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">{exportLoading ? "Exporting…" : "Export"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportCurrentPage(data.transactions)}>
                  Export current page ({data.transactions.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportAll}>
                  Export all matching ({data.total.toLocaleString()})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Advanced filters (collapsible) */}
        {advOpen && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">User ID or email</label>
              <Input
                value={userId}
                placeholder="User ID…"
                onChange={(e) => setUserId(e.target.value)}
                onBlur={() => applyFilter({ userId })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Min amount ($)</label>
              <Input
                type="number"
                value={amountMin}
                placeholder="0"
                onChange={(e) => setAmountMin(e.target.value)}
                onBlur={() => applyFilter({ amountMin })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Max amount ($)</label>
              <Input
                type="number"
                value={amountMax}
                placeholder="∞"
                onChange={(e) => setAmountMax(e.target.value)}
                onBlur={() => applyFilter({ amountMax })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Currency</label>
              <Select value={currency || "all"} onValueChange={(v) => { const c = v === "all" ? "" : v; setCurrency(c); applyFilter({ currency: c }) }}>
                <SelectItem value="all">All currencies</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="BTC">BTC</SelectItem>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Sort by</label>
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); applyFilter({ sortBy: v }) }}>
                <SelectItem value="createdAt">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="reference">Reference</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Sort direction</label>
              <Select value={sortOrder} onValueChange={(v) => { setSortOrder(v as "asc"|"desc"); applyFilter({ sortOrder: v }) }}>
                <SelectItem value="desc">Newest first</SelectItem>
                <SelectItem value="asc">Oldest first</SelectItem>
              </Select>
            </div>
            <div className="col-span-full flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeGen}
                  onChange={(e) => { setExcludeGen(e.target.checked); applyFilter({ excludeGen: e.target.checked }) }}
                  className="rounded border-slate-300"
                />
                <span className="text-slate-700">Exclude simulated/generated transactions</span>
              </label>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={f.clear}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                {f.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-600 underline ml-1">
              Clear all
            </button>
          </div>
        )}

        {/* Summary bar */}
        <div className="relative rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:pr-40">
            <span><strong className="text-slate-900">{data.summary.totalCount.toLocaleString()}</strong> transactions</span>
            <span className="text-emerald-600"><strong>{data.summary.completedCount.toLocaleString()}</strong> completed</span>
            <span className="text-amber-600"><strong>{data.summary.pendingCount.toLocaleString()}</strong> pending</span>
            <span className="text-red-600 hidden sm:inline"><strong>{data.summary.failedCount.toLocaleString()}</strong> failed</span>
            <span className="text-slate-500 hidden sm:inline"><strong>{data.summary.reversedCount.toLocaleString()}</strong> reversed</span>
          </div>
          <div className="mt-1 sm:mt-0 sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2 font-medium text-slate-700">
            Total: {fmtVolume(data.summary.totalVolume)}
          </div>
        </div>

        {/* Limit selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Show:</span>
            {[25, 50, 100].map((l) => (
              <button
                key={l}
                onClick={() => { setLimit(l); applyFilter({ limit: l, page: 1 }) }}
                className={`rounded-md px-2.5 py-1 text-sm border transition-colors ${
                  limit === l
                    ? "bg-[#1A2CCE] text-white border-[#1A2CCE]"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            {data.total === 0 ? "No results" :
              `${(page - 1) * limit + 1}–${Math.min(page * limit, data.total)} of ${data.total.toLocaleString()}`}
          </p>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : data.transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Inbox className="h-8 w-8" />
              <p className="text-sm">No transactions found</p>
              {activeFilters.length > 0 && (
                <button onClick={clearAll} className="text-xs text-[#1A2CCE] underline">Clear filters</button>
              )}
            </div>
          ) : (
            <>
            {/* Desktop Table */}
            <div className="overflow-x-auto scrollbar-hide hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">Reference</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">User</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Account</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Type</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Amount</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Fee</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.transactions.map((t) => {
                    const isReversed = t.status === "reversed"
                    const isFailed   = t.status === "failed"
                    const isCredit   = CREDIT_TYPES.has(t.type)
                    const amtColor   = isCredit ? "text-emerald-600" : "text-red-600"
                    const prefix     = isCredit ? "+" : "−"

                    return (
                      <tr
                        key={t.id}
                        className={`transition-colors hover:bg-slate-50 ${
                          isFailed   ? "border-l-4 border-l-red-400" :
                          isReversed ? "opacity-60" : ""
                        }`}
                      >
                        {/* Reference */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setDrawerId(t.id)}
                              className={`font-mono text-xs font-semibold hover:underline ${
                                isReversed ? "line-through text-slate-400" : "text-slate-700"
                              }`}
                            >
                              {t.reference}
                            </button>
                            {t.isGenerated && (
                              <span className="rounded-full bg-slate-200 px-1.5 py-px text-[9px] font-medium text-slate-500 uppercase">
                                sim
                              </span>
                            )}
                            <button
                              onClick={() => copyRef(t.reference)}
                              className="text-slate-300 hover:text-slate-500"
                              title="Copy reference"
                            >
                              {copiedRef === t.reference
                                ? <Check className="h-3 w-3 text-emerald-500" />
                                : <Copy className="h-3 w-3" />
                              }
                            </button>
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-4 py-3">
                          {t.user ? (
                            <div className="flex items-center gap-2">
                              <UserAvatar
                                firstName={t.user.firstName}
                                lastName={t.user.lastName}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <a
                                  href={`/admin/users/${t.user.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-sm font-medium text-slate-800 hover:underline truncate max-w-32"
                                >
                                  {t.user.firstName} {t.user.lastName}
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">System</span>
                          )}
                        </td>

                        {/* Account */}
                        <td className="px-4 py-3">
                          <code className="text-xs text-slate-600">{t.account.accountNumber}</code>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-slate-400 uppercase">{t.account.walletType}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">{t.account.currency}</Badge>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3"><TypeBadge type={t.type} /></td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${amtColor}`}>
                            {prefix}{fmtCurrency(t.amount, t.currency)}
                          </span>
                          <span className="ml-1 text-xs text-slate-400">{t.currency}</span>
                        </td>

                        {/* Fee */}
                        <td className="px-4 py-3 text-right">
                          {t.feeAmount && t.feeAmount > 0 ? (
                            <span className="text-xs text-slate-500">
                              {fmtCurrency(t.feeAmount, t.currency)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>

                        {/* Date */}
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                          {fmtDate(t.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDrawerId(t.id)}>
                                View details
                              </DropdownMenuItem>
                              {isReversible(t) && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const res  = await fetch(`/api/admin/transactions/${t.id}`)
                                    const data = await res.json()
                                    if (res.ok) setReverseTarget(data.transaction)
                                  }}
                                  className="text-red-600"
                                >
                                  Reverse transaction
                                </DropdownMenuItem>
                              )}
                              {canUpdateStatus(t) && (
                                <DropdownMenuItem onClick={() => setDrawerId(t.id)}>
                                  Update status
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {t.user && (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={`/admin/users/${t.user.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    View user
                                  </a>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {data.transactions.map((t) => {
                const isCredit = CREDIT_TYPES.has(t.type)
                const amtColor = isCredit ? "text-emerald-600" : "text-red-600"
                const prefix = isCredit ? "+" : "−"

                return (
                  <div key={t.id} className="p-4 space-y-2">
                    {/* Header: Reference + Actions */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setDrawerId(t.id)}
                        className="font-mono text-xs font-semibold text-slate-700 hover:underline"
                      >
                        {t.reference}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDrawerId(t.id)}>
                            View details
                          </DropdownMenuItem>
                          {isReversible(t) && (
                            <DropdownMenuItem
                              onClick={async () => {
                                const res = await fetch(`/api/admin/transactions/${t.id}`)
                                const data = await res.json()
                                if (res.ok) setReverseTarget(data.transaction)
                              }}
                              className="text-red-600"
                            >
                              Reverse
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* User */}
                    {t.user && (
                      <div className="flex items-center gap-2">
                        <UserAvatar firstName={t.user.firstName} lastName={t.user.lastName} size="sm" />
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {t.user.firstName} {t.user.lastName}
                        </span>
                      </div>
                    )}

                    {/* Type + Status */}
                    <div className="flex items-center justify-between">
                      <TypeBadge type={t.type} />
                      <StatusBadge status={t.status} />
                    </div>

                    {/* Amount + Date */}
                    <div className="flex items-center justify-between pt-1">
                      <span className={`font-semibold ${amtColor}`}>
                        {prefix}{fmtCurrency(t.amount, t.currency)} <span className="text-xs text-slate-400">{t.currency}</span>
                      </span>
                      <span className="text-xs text-slate-500">{fmtDate(t.createdAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {data.pages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-500 order-2 sm:order-1">
              Page {page} of {data.pages}
            </p>
            <div className="flex items-center gap-1 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { const p = page - 1; setPage(p); fetchData({ page: p }) }}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {/* Show fewer page numbers on mobile */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                  const p = i + 1
                  return (
                    <Button
                      key={p}
                      variant={page === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setPage(p); fetchData({ page: p }) }}
                      className={page === p ? "bg-[#1A2CCE] text-white border-[#1A2CCE]" : ""}
                    >
                      {p}
                    </Button>
                  )
                })}
                {data.pages > 7 && page < data.pages - 3 && (
                  <>
                    <span className="px-1 text-slate-400">…</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setPage(data.pages); fetchData({ page: data.pages }) }}
                    >
                      {data.pages}
                    </Button>
                  </>
                )}
              </div>
              {/* Mobile: just show current page */}
              <span className="sm:hidden text-sm text-slate-600 min-w-[80px] text-center">
                {page} / {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { const p = page + 1; setPage(p); fetchData({ page: p }) }}
                disabled={page >= data.pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <TransactionDetailDrawer
        transactionId={drawerId}
        onClose={() => setDrawerId(null)}
        onAction={handleAction}
      />

      {/* Reverse modal (from row dropdown) */}
      {reverseTarget && (
        <ReverseTransactionModal
          open={!!reverseTarget}
          onClose={() => setReverseTarget(null)}
          onSuccess={() => { setReverseTarget(null); handleAction() }}
          transaction={reverseTarget}
        />
      )}

      {/* Create modal */}
      <CreateTransactionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleAction}
      />
    </>
  )
}

// ── StatusMultiSelect ─────────────────────────────────────────────────────────

function StatusMultiSelect({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const toggle = (s: string) =>
    onChange(selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors
          ${selected.length > 0 ? "border-[#1A2CCE] bg-[#1A2CCE]/5 text-[#1A2CCE]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
      >
        Status
        {selected.length > 0 && (
          <span className="rounded-full bg-[#1A2CCE] px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
            {selected.length}
          </span>
        )}
        <ChevronLeft className="h-3.5 w-3.5 -rotate-90" />
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-50 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {STATUSES.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selected.includes(s)}
                onChange={() => toggle(s)}
                className="rounded border-slate-300"
              />
              <span className="text-sm capitalize text-slate-700">{s}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
