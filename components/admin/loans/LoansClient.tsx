"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  MoreHorizontal, CheckCircle2, Search, Filter, ChevronLeft, ChevronRight,
} from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { LoanReviewDrawer } from "./LoanReviewDrawer"
import { LoanDetailDrawer } from "./LoanDetailDrawer"
import type { LoanListItem, LoanStats } from "@/lib/services/loan.service"

interface InitialData {
  loans: LoanListItem[]
  total: number
  pages: number
  stats: LoanStats
}

const TABS = ["pending", "active", "closed", "rejected", "defaulted", "all"] as const
type Tab   = typeof TABS[number]

const STATUS_PILL: Record<string, string> = {
  pending:   "bg-amber-100  text-amber-700",
  active:    "bg-indigo-100   text-indigo-700",
  closed:    "bg-gray-100   text-gray-600",
  defaulted: "bg-red-100    text-red-700",
  rejected:  "bg-red-50     text-red-500",
  approved:  "bg-emerald-100 text-emerald-700",
}

const KYC_PILL: Record<string, string> = {
  verified:   "bg-emerald-100 text-emerald-700",
  pending:    "bg-amber-100   text-amber-700",
  rejected:   "bg-red-100     text-red-700",
  unverified: "bg-gray-100    text-gray-500",
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 30)  return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function LoansClient({ initialData }: { initialData: InitialData }) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { toast }    = useToast()

  const [data,        setData]        = useState(initialData)
  const [loading,     setLoading]     = useState(false)
  const [reviewId,    setReviewId]    = useState<string | null>(null)
  const [detailId,    setDetailId]    = useState<string | null>(null)
  const [newBanner,   setNewBanner]   = useState(false)
  const prevCountRef                   = useRef(initialData.stats.pendingCount)

  const activeTab   = (searchParams.get("tab")    as Tab)    ?? "pending"
  const search      = searchParams.get("search")   ?? ""
  const page        = Number(searchParams.get("page") ?? 1)
  const sortBy      = searchParams.get("sortBy")  ?? "appliedAt"
  const sortOrder   = searchParams.get("sortOrder") ?? "desc"
  const dateFrom    = searchParams.get("dateFrom") ?? ""
  const dateTo      = searchParams.get("dateTo")   ?? ""
  const amountMin   = searchParams.get("amountMin") ?? ""
  const amountMax   = searchParams.get("amountMax") ?? ""

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== "page") params.set("page", "1")
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: "20",
        sortBy, sortOrder,
        ...(activeTab !== "all" ? { status: activeTab } : {}),
        ...(search    ? { search }    : {}),
        ...(dateFrom  ? { dateFrom }  : {}),
        ...(dateTo    ? { dateTo }    : {}),
        ...(amountMin ? { amountMin } : {}),
        ...(amountMax ? { amountMax } : {}),
      })
      const res  = await fetch(`/api/admin/loans?${params}`, { signal })
      if (!res.ok) return
      const json = await res.json()
      setData(json)
      if (activeTab === "pending") {
        const curr = json.stats.pendingCount as number
        if (curr > prevCountRef.current) setNewBanner(true)
        prevCountRef.current = curr
      }
    } catch (err) {
      // Ignore abort errors - these are expected during cleanup
      if (err instanceof Error && err.name === "AbortError") return
      throw err
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, page, sortBy, sortOrder, dateFrom, dateTo, amountMin, amountMax])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchData(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchData])

  // Auto-refresh pending tab every 60s
  useEffect(() => {
    if (activeTab !== "pending") return
    const id = setInterval(() => fetchData(), 60_000)
    return () => clearInterval(id)
  }, [activeTab, fetchData])

  function handleSearchChange(val: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setParam("search", val), 400)
  }

  const statsBar = [
    { label: "Pending",     value: data.stats.pendingCount,     highlight: data.stats.pendingCount > 0 ? "amber" : "" },
    { label: "Active",      value: data.stats.activeCount,      highlight: "" },
    { label: "Rejected",    value: data.stats.rejectedCount,    highlight: "" },
    { label: "Defaulted",   value: data.stats.defaultedCount,   highlight: data.stats.defaultedCount > 0 ? "red" : "" },
    { label: "Disbursed",   value: fmt(data.stats.totalDisbursed),   highlight: "" },
    { label: "Outstanding", value: fmt(data.stats.totalOutstanding), highlight: "" },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Loan Applications</h1>
        <p className="text-sm text-gray-500 mt-1">Review, approve, and manage user loan applications</p>
      </div>

      {/* New banner */}
      {newBanner && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <span className="text-sm text-amber-700">New pending applications arrived.</span>
          <button onClick={() => { setNewBanner(false); fetchData() }} className="text-xs text-amber-600 underline ml-auto">
            Refresh
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {statsBar.map((s) => (
          <div key={s.label} className={[
            "rounded-xl border p-2.5 sm:p-3 text-center",
            s.highlight === "amber" ? "border-amber-200 bg-amber-50" :
            s.highlight === "red"   ? "border-red-200   bg-red-50"   :
            "border-gray-200 bg-white",
          ].join(" ")}>
            <p className={[
              "text-base sm:text-lg font-semibold truncate",
              s.highlight === "amber" ? "text-amber-700" :
              s.highlight === "red"   ? "text-red-600"   : "text-gray-900",
            ].join(" ")}>{s.value}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs - horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex gap-1 border-b border-gray-200 min-w-max sm:min-w-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setParam("tab", tab)}
              className={[
                "px-3 py-2 text-xs sm:text-sm rounded-t capitalize transition-colors whitespace-nowrap",
                activeTab === tab
                  ? "border-b-2 border-[#1A2CCE] text-[#1A2CCE] font-medium"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filters - collapsible on mobile */}
      <div className="space-y-2">
        {/* Search always visible */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            className="pl-8 h-9 sm:h-8 text-sm w-full sm:w-48"
            placeholder="Search loans…"
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        {/* Other filters - wrap on mobile */}
        <div className="flex flex-wrap gap-2 items-center">
          <input type="date" value={dateFrom} onChange={(e) => setParam("dateFrom", e.target.value)}
            className="h-9 sm:h-8 px-2 text-xs border border-gray-200 rounded-md bg-white flex-1 min-w-[120px] sm:flex-none sm:min-w-0" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setParam("dateTo", e.target.value)}
            className="h-9 sm:h-8 px-2 text-xs border border-gray-200 rounded-md bg-white flex-1 min-w-[120px] sm:flex-none sm:min-w-0" />
          <input type="number" placeholder="Min $" value={amountMin} onChange={(e) => setParam("amountMin", e.target.value)}
            className="h-9 sm:h-8 px-2 text-xs border border-gray-200 rounded-md bg-white w-[calc(50%-4px)] sm:w-20" />
          <input type="number" placeholder="Max $" value={amountMax} onChange={(e) => setParam("amountMax", e.target.value)}
            className="h-9 sm:h-8 px-2 text-xs border border-gray-200 rounded-md bg-white w-[calc(50%-4px)] sm:w-20" />
          <select value={sortBy} onChange={(e) => setParam("sortBy", e.target.value)}
            className="h-9 sm:h-8 px-2 text-xs border border-gray-200 rounded-md bg-white flex-1 sm:flex-none">
            <option value="appliedAt">Date</option>
            <option value="amount">Amount</option>
            <option value="termMonths">Term</option>
          </select>
          <button
            onClick={() => setParam("sortOrder", sortOrder === "asc" ? "desc" : "asc")}
            className="h-9 sm:h-8 px-3 text-xs border border-gray-200 rounded-md bg-white"
          >
            {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading && (
          <div className="h-1 bg-[#1A2CCE] animate-pulse" />
        )}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Applicant", "Requested", "Term", "Status", "Rate", "Monthly", "Outstanding", "Applied", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.loans.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-400 text-sm">
                      {activeTab === "pending" ? "No pending applications. All caught up." : `No ${activeTab} loans.`}
                    </p>
                  </td>
                </tr>
              )}
              {data.loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  {/* Applicant */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1A2CCE]/10 text-[#1A2CCE] flex items-center justify-center text-xs font-semibold">
                        {loan.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-xs">{loan.userName}</p>
                        <p className="text-gray-400 text-xs">{loan.userEmail}</p>
                      </div>
                      <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${KYC_PILL[loan.userKycStatus] ?? "bg-gray-100 text-gray-500"}`}>
                        {loan.userKycStatus}
                      </span>
                    </div>
                  </td>
                  {/* Requested */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{fmt(loan.amount)}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[140px]">{loan.purpose}</p>
                  </td>
                  {/* Term */}
                  <td className="px-4 py-3 text-gray-600">{loan.termMonths}mo</td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[loan.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {loan.status}
                    </span>
                    {loan.isOverdue && (
                      <p className="text-xs text-red-500 mt-0.5">{loan.daysOverdue}d overdue</p>
                    )}
                  </td>
                  {/* Rate */}
                  <td className="px-4 py-3 text-gray-600">
                    {loan.interestRate != null ? `${loan.interestRate}%` : "—"}
                  </td>
                  {/* Monthly */}
                  <td className="px-4 py-3 text-gray-600">
                    {loan.monthlyPayment != null ? fmt(loan.monthlyPayment) : "—"}
                  </td>
                  {/* Outstanding */}
                  <td className="px-4 py-3" style={{ minWidth: 140 }}>
                    {loan.status === "active" && loan.outstandingBalance != null ? (
                      <div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1" style={{ width: 100 }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${loan.paidPercent}%`, backgroundColor: "#12B76A" }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">{fmt(loan.outstandingBalance)} left</p>
                      </div>
                    ) : "—"}
                  </td>
                  {/* Applied */}
                  <td className="px-4 py-3 text-xs text-gray-400">{relativeDate(loan.appliedAt)}</td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    {loan.status === "pending" ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 text-xs bg-[#1A2CCE] hover:bg-[#1A2CCE]/90"
                          onClick={() => setReviewId(loan.id)}>
                          Review
                        </Button>
                        <Button size="sm" variant="outline"
                          className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={async () => {
                            const reason = prompt("Rejection reason (min 10 chars):")
                            if (!reason || reason.length < 10) return
                            const res = await fetch(`/api/admin/loans/${loan.id}/reject`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ reason }),
                            })
                            if (res.ok) { toast({ title: "Rejected" }); fetchData() }
                            else toast({ title: "Error", variant: "destructive" })
                          }}>
                          Reject
                        </Button>
                      </div>
                    ) : loan.status === "active" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailId(loan.id)}>View details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setDetailId(loan.id) }}>Record payment</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={async () => {
                              if (!confirm("Mark this loan as defaulted?")) return
                              const res = await fetch(`/api/admin/loans/${loan.id}/default`, { method: "POST" })
                              if (res.ok) { toast({ title: "Marked defaulted" }); fetchData() }
                            }}>
                            Mark defaulted
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-500"
                        onClick={() => setDetailId(loan.id)}>
                        View
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Desktop */}
        {data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total} loans
            </p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="flex items-center px-3 text-xs">{page} / {data.pages}</span>
              <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setParam("page", String(page + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {loading && (
          <div className="h-1 bg-[#1A2CCE] animate-pulse rounded-full" />
        )}
        {data.loans.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-12 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400 text-sm">
              {activeTab === "pending" ? "No pending applications. All caught up." : `No ${activeTab} loans.`}
            </p>
          </div>
        )}
        {data.loans.map((loan) => (
          <div key={loan.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            {/* Header: Applicant + Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#1A2CCE]/10 text-[#1A2CCE] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {loan.userName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{loan.userName}</p>
                  <p className="text-gray-400 text-xs truncate">{loan.userEmail}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[loan.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {loan.status}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${KYC_PILL[loan.userKycStatus] ?? "bg-gray-100 text-gray-500"}`}>
                  {loan.userKycStatus}
                </span>
              </div>
            </div>

            {/* Amount + Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Requested</p>
                <p className="font-semibold text-gray-900">{fmt(loan.amount)}</p>
                <p className="text-xs text-gray-400 truncate">{loan.purpose}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Term</p>
                  <p className="text-gray-700 font-medium">{loan.termMonths}mo</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Rate</p>
                  <p className="text-gray-700 font-medium">{loan.interestRate != null ? `${loan.interestRate}%` : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Monthly</p>
                  <p className="text-gray-700 font-medium">{loan.monthlyPayment != null ? fmt(loan.monthlyPayment) : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Applied</p>
                  <p className="text-gray-700 font-medium">{relativeDate(loan.appliedAt)}</p>
                </div>
              </div>
            </div>

            {/* Outstanding progress (if active) */}
            {loan.status === "active" && loan.outstandingBalance != null && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Outstanding</span>
                  <span className="text-gray-700 font-medium">{fmt(loan.outstandingBalance)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${loan.paidPercent}%`, backgroundColor: "#12B76A" }}
                  />
                </div>
                {loan.isOverdue && (
                  <p className="text-xs text-red-500 mt-1">{loan.daysOverdue} days overdue</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {loan.status === "pending" ? (
                <>
                  <Button size="sm" className="flex-1 h-9 text-xs bg-[#1A2CCE] hover:bg-[#1A2CCE]/90"
                    onClick={() => setReviewId(loan.id)}>
                    Review
                  </Button>
                  <Button size="sm" variant="outline"
                    className="flex-1 h-9 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={async () => {
                      const reason = prompt("Rejection reason (min 10 chars):")
                      if (!reason || reason.length < 10) return
                      const res = await fetch(`/api/admin/loans/${loan.id}/reject`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reason }),
                      })
                      if (res.ok) { toast({ title: "Rejected" }); fetchData() }
                      else toast({ title: "Error", variant: "destructive" })
                    }}>
                    Reject
                  </Button>
                </>
              ) : loan.status === "active" ? (
                <div className="flex gap-2 w-full">
                  <Button size="sm" variant="outline" className="flex-1 h-9 text-xs"
                    onClick={() => setDetailId(loan.id)}>
                    View Details
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="h-9 w-9 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setDetailId(loan.id) }}>Record payment</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={async () => {
                          if (!confirm("Mark this loan as defaulted?")) return
                          const res = await fetch(`/api/admin/loans/${loan.id}/default`, { method: "POST" })
                          if (res.ok) { toast({ title: "Marked defaulted" }); fetchData() }
                        }}>
                        Mark defaulted
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="w-full h-9 text-xs"
                  onClick={() => setDetailId(loan.id)}>
                  View Details
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Pagination - Mobile */}
        {data.pages > 1 && (
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500">
              {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="flex items-center px-2 text-xs">{page}/{data.pages}</span>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={page >= data.pages} onClick={() => setParam("page", String(page + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawers */}
      <LoanReviewDrawer
        loanId={reviewId}
        onClose={() => setReviewId(null)}
        onAction={fetchData}
      />
      <LoanDetailDrawer
        loanId={detailId}
        onClose={() => setDetailId(null)}
        onAction={fetchData}
      />
    </div>
  )
}
