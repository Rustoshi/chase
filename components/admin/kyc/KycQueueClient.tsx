"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast }         from "@/components/ui/use-toast"
import { Button }           from "@/components/ui/button"
import { KycReviewDrawer }  from "./KycReviewDrawer"
import { Users, FileCheck, CheckCircle, XCircle, Clock } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface KycQueueItem {
  userId:        string
  userName:      string
  userEmail:     string
  userKycStatus: string
  userKycTier:   number
  userCreatedAt: string
  documents:     Record<string, unknown>[]
  pendingCount:  number
  lastSubmitted: string
  isComplete:    boolean
}

interface KycStats {
  pendingCount:         number
  pendingUsersCount:    number
  approvedToday:        number
  rejectedToday:        number
  avgReviewTimeMinutes: number
  byDocType:            Array<{ docType: string; pendingCount: number }>
}

interface InitialData {
  documents: KycQueueItem[]
  total:     number
  pages:     number
}

interface Props {
  initialData:  InitialData
  initialStats: KycStats
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const KYC_STATUS_STYLES: Record<string, string> = {
  unverified: "bg-gray-100 text-gray-600",
  pending:    "bg-amber-100 text-amber-700",
  verified:   "bg-green-100 text-green-700",
  rejected:   "bg-red-100 text-red-700",
}

const DOC_TYPE_ABBR: Record<string, { abbr: string; label: string }> = {
  passport:        { abbr: "PASS", label: "Passport"         },
  drivers_license: { abbr: "DL",   label: "Driver's License" },
  national_id:     { abbr: "NID",  label: "National ID"      },
  selfie:          { abbr: "SELF", label: "Selfie"           },
  address_proof:   { abbr: "ADDR", label: "Address Proof"    },
  utility_bill:    { abbr: "UTIL", label: "Utility Bill"     },
  ssn_proof:       { abbr: "SSN",  label: "SSN Proof"        },
}

const DOC_TYPE_STATUS_COLOR: Record<string, string> = {
  approved: "bg-green-100 text-green-700 border-green-200",
  pending:  "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-red-100   text-red-700   border-red-200",
}

const TABS = ["all", "pending", "verified", "rejected"] as const
type Tab   = typeof TABS[number]

function relativeDate(d: string): string {
  if (!d) return "—"
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  return `${days}d ago`
}

function accountAge(d: string): string {
  if (!d) return ""
  return `${Math.floor((Date.now() - new Date(d).getTime()) / 86400000)}d ago`
}

// ── Main component ────────────────────────────────────────────────────────────

export function KycQueueClient({ initialData, initialStats }: Props) {
  const { toast }                    = useToast()
  const [items,       setItems]      = useState<KycQueueItem[]>(initialData.documents)
  const [total,       setTotal]      = useState(initialData.total)
  const [stats,       setStats]      = useState<KycStats>(initialStats)
  const [activeTab,   setActiveTab]  = useState<Tab>("all")
  const [docTypeFilter, setDocTypeFilter] = useState("")
  const [sortBy,      setSortBy]     = useState("newest")
  const [page,        setPage]       = useState(1)
  const [pages,       setPages]      = useState(initialData.pages)
  const [loading,     setLoading]    = useState(false)
  const [reviewId,    setReviewId]   = useState<string | null>(null)
  const [selected,    setSelected]   = useState<Set<string>>(new Set())
  const [newBanner,   setNewBanner]  = useState(0)
  const prevPending                  = useRef(initialStats.pendingCount)

  const fetch_ = useCallback(async (tab: Tab, dtype: string, sb: string, pg: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "20", sortBy: sb })
      if (tab !== "all") params.set("status", tab)
      if (dtype) params.set("docType", dtype)
      const res  = await fetch(`/api/admin/kyc?${params}`)
      const data = await res.json() as { documents: KycQueueItem[]; total: number; pages: number; stats: KycStats }
      setItems(data.documents)
      setTotal(data.total)
      setPages(data.pages)
      setStats(data.stats)
      const diff = data.stats.pendingCount - prevPending.current
      if (diff > 0) { setNewBanner(diff); prevPending.current = data.stats.pendingCount }
    } catch {
      toast({ title: "Failed to load", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Auto-refresh every 45s
  useEffect(() => {
    const id = setInterval(() => fetch_(activeTab, docTypeFilter, sortBy, page), 45000)
    return () => clearInterval(id)
  }, [activeTab, docTypeFilter, sortBy, page, fetch_])

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    setPage(1)
    setSelected(new Set())
    fetch_(tab, docTypeFilter, sortBy, 1)
  }

  function handleFilter(dtype: string) {
    setDocTypeFilter(dtype)
    setPage(1)
    fetch_(activeTab, dtype, sortBy, 1)
  }

  function handleSort(sb: string) {
    setSortBy(sb)
    setPage(1)
    fetch_(activeTab, docTypeFilter, sb, 1)
  }

  function handleAction() {
    fetch_(activeTab, docTypeFilter, sortBy, page)
    setReviewId(null)
  }

  function toggleSelect(userId: string, hasPending: boolean) {
    if (!hasPending) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  async function handleBulkApprove() {
    const pendingDocIds: string[] = []
    for (const item of items) {
      if (selected.has(item.userId)) {
        for (const doc of item.documents) {
          if ((doc as Record<string, unknown>).status === "pending") {
            pendingDocIds.push(String((doc as Record<string, unknown>)._id ?? (doc as Record<string, unknown>).id))
          }
        }
      }
    }
    if (pendingDocIds.length === 0) return
    try {
      const res  = await fetch("/api/admin/kyc/documents/bulk-approve", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ documentIds: pendingDocIds }),
      })
      const data = await res.json() as { approved: number; errors: number }
      toast({ title: `Approved ${data.approved} documents${data.errors > 0 ? `, ${data.errors} failed` : ""}` })
      setSelected(new Set())
      fetch_(activeTab, docTypeFilter, sortBy, page)
    } catch {
      toast({ title: "Bulk approve failed", variant: "destructive" })
    }
  }

  const selectedPendingDocCount = Array.from(selected).reduce((sum, uid) => {
    const item = items.find((i) => i.userId === uid)
    return sum + (item?.pendingCount ?? 0)
  }, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">KYC Review</h1>
        <p className="text-sm text-gray-500 mt-1">Review identity documents and verify users</p>
      </div>

      {/* New submissions banner */}
      {newBanner > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <span className="text-sm text-indigo-700">{newBanner} new submission{newBanner !== 1 ? "s" : ""} detected.</span>
          <button onClick={() => { setNewBanner(0); fetch_(activeTab, docTypeFilter, sortBy, page) }}
            className="text-xs text-indigo-600 font-medium hover:underline">Refresh</button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: <Users     className="w-4 h-4" />, label: "Awaiting review",  value: stats.pendingUsersCount, color: stats.pendingUsersCount > 0 ? "text-amber-600" : "text-green-600" },
          { icon: <FileCheck className="w-4 h-4" />, label: "Docs pending",     value: stats.pendingCount,      color: "text-gray-700" },
          { icon: <CheckCircle className="w-4 h-4" />, label: "Approved today", value: stats.approvedToday,     color: "text-green-600" },
          { icon: <XCircle   className="w-4 h-4" />, label: "Rejected today",   value: stats.rejectedToday,     color: "text-red-600" },
          { icon: <Clock     className="w-4 h-4" />, label: "Avg review time",  value: `${stats.avgReviewTimeMinutes.toFixed(0)} min`, color: "text-gray-700" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className={`${color} flex-shrink-0`}>{icon}</span>
            <div>
              <p className={`text-lg font-bold leading-tight ${color}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Doc type breakdown */}
      {stats.byDocType.filter((d) => d.pendingCount > 0).length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
          <span className="text-gray-400">Pending by type:</span>
          {stats.byDocType.filter((d) => d.pendingCount > 0).map((d) => (
            <button
              key={d.docType}
              onClick={() => handleFilter(docTypeFilter === d.docType ? "" : d.docType)}
              className={`px-2 py-0.5 rounded border transition-colors ${docTypeFilter === d.docType ? "bg-[#1A2CCE] text-white border-[#1A2CCE]" : "border-gray-300 hover:border-gray-500"}`}
            >
              {DOC_TYPE_ABBR[d.docType]?.abbr ?? d.docType}: {d.pendingCount}
            </button>
          ))}
          {docTypeFilter && (
            <button onClick={() => handleFilter("")} className="text-gray-400 hover:text-gray-600 text-xs ml-1">Clear ×</button>
          )}
        </div>
      )}

      {/* Tabs + sort (each on its own full row) */}
      <div className="space-y-3">
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 text-sm capitalize whitespace-nowrap flex-shrink-0 transition-colors ${activeTab === tab ? "border-b-2 border-[#1A2CCE] text-[#1A2CCE] font-medium" : "text-gray-500 hover:text-gray-700"}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => handleSort(e.target.value)}
          className="w-full sm:w-56 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="documents">Most documents</option>
        </select>
      </div>

      {/* Bulk action */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <span className="text-sm text-indigo-700">
            {selectedPendingDocCount} document{selectedPendingDocCount !== 1 ? "s" : ""} from {selected.size} user{selected.size !== 1 ? "s" : ""} selected
          </span>
          <Button size="sm" onClick={handleBulkApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            Approve all selected pending
          </Button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-700 ml-auto">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm animate-pulse">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No users in this queue.</div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">KYC</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Documents</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 hidden lg:table-cell">Pending</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Submitted</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.userId}
                  className={`hover:bg-gray-50 transition-colors ${selected.has(item.userId) ? "bg-indigo-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    {item.pendingCount > 0 && (
                      <input
                        type="checkbox"
                        checked={selected.has(item.userId)}
                        onChange={() => toggleSelect(item.userId, item.pendingCount > 0)}
                        className="accent-[#1A2CCE]"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1A2CCE]/10 flex items-center justify-center text-[#1A2CCE] font-semibold text-xs flex-shrink-0">
                        {item.userName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.userName}</p>
                        <p className="text-xs text-gray-500 truncate">{item.userEmail}</p>
                        <p className="text-xs text-gray-400">joined {accountAge(item.userCreatedAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${KYC_STATUS_STYLES[item.userKycStatus] ?? "bg-gray-100 text-gray-600"}`}>
                        {item.userKycStatus}
                      </span>
                      <span className="text-xs text-gray-400">Tier {item.userKycTier}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {item.documents.map((doc, i) => {
                        const d    = doc as Record<string, unknown>
                        const type = String(d.docType)
                        const st   = String(d.status)
                        const info = DOC_TYPE_ABBR[type] ?? { abbr: type.slice(0, 4).toUpperCase(), label: type }
                        return (
                          <span
                            key={i}
                            title={`${info.label} — ${st}`}
                            className={`text-xs px-1.5 py-0.5 rounded border font-mono ${DOC_TYPE_STATUS_COLOR[st] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {info.abbr}
                          </span>
                        )
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {item.pendingCount > 0 ? (
                      <span className="font-bold text-amber-600">{item.pendingCount}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                    {relativeDate(item.lastSubmitted)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" onClick={() => setReviewId(item.userId)}
                        className="text-xs bg-[#1A2CCE] hover:bg-[#1A2CCE]/90 h-7 px-3">
                        Review
                      </Button>
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
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page === 1}
              onClick={() => { const p = page - 1; setPage(p); fetch_(activeTab, docTypeFilter, sortBy, p) }}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page === pages}
              onClick={() => { const p = page + 1; setPage(p); fetch_(activeTab, docTypeFilter, sortBy, p) }}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Review drawer */}
      {reviewId && (
        <KycReviewDrawer
          userId={reviewId}
          open={!!reviewId}
          onClose={() => setReviewId(null)}
          onAction={handleAction}
        />
      )}
    </div>
  )
}
