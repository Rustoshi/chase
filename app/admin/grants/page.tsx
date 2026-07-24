"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Gift, Search, Filter, ChevronDown, Eye, Check, X,
  Clock, CheckCircle2, XCircle, Banknote, Loader2,
  User, FileText, DollarSign, Bitcoin, AlertTriangle,
  Briefcase, GraduationCap, Home, Heart, Zap,
} from "lucide-react"
import { PageHeader } from "@/components/admin/PageHeader"
import { StatCard } from "@/components/admin/StatCard"
import { StatusBadge } from "@/components/admin/StatusBadge"

// ── Types ────────────────────────────────────────────────────────────────────

interface DepositAccount {
  _id: string
  accountNumber: string
  walletType: "fiat" | "bitcoin"
  currency: string
}

interface Grant {
  _id: string
  userId: string
  userName: string
  userEmail: string
  grantType: string
  grantTypeLabel: string
  amount: number
  approvedAmount: number | null
  purpose: string
  supportingInfo: string | null
  documents: Array<{ name: string; docUrl: string }>
  status: "pending" | "under_review" | "approved" | "disbursed" | "rejected"
  referenceNumber: string
  adminNote: string | null
  rejectedReason: string | null
  appliedAt: string
  reviewedAt: string | null
  disbursedAt: string | null
  depositAccount: DepositAccount | null
}

interface Stats {
  pending: number
  underReview: number
  approved: number
  disbursed: number
  rejected: number
  totalAmount: number
}

// ── Constants ────────────────────────────────────────────────────────────────

const GRANT_TYPE_ICONS: Record<string, React.ElementType> = {
  personal: User,
  business: Briefcase,
  education: GraduationCap,
  housing: Home,
  medical: Heart,
  emergency: Zap,
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "disbursed", label: "Disbursed" },
  { value: "rejected", label: "Rejected" },
]

const fmt = (n: number) => `$${n.toLocaleString()}`
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminGrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")

  // Modal state
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")
  const [approvedAmount, setApprovedAmount] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [adminNote, setAdminNote] = useState("")

  const fetchGrants = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (statusFilter) params.set("status", statusFilter)
      
      const res = await fetch(`/api/admin/grants?${params}`)
      if (res.ok) {
        const data = await res.json()
        setGrants(data.grants || [])
        setStats(data.stats || null)
        setTotalPages(data.totalPages || 1)
      }
    } catch { /* */ }
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => {
    fetchGrants()
  }, [fetchGrants])

  const handleAction = async (action: "review" | "approve" | "reject" | "disburse") => {
    if (!selectedGrant) return
    setActionLoading(true)
    setActionError("")

    try {
      const body: Record<string, unknown> = {
        grantId: selectedGrant._id,
        action,
        note: adminNote || undefined,
      }

      if (action === "approve" && approvedAmount) {
        body.approvedAmount = parseFloat(approvedAmount)
      }
      if (action === "reject") {
        if (!rejectReason.trim()) {
          setActionError("Rejection reason is required")
          setActionLoading(false)
          return
        }
        body.reason = rejectReason.trim()
      }

      const res = await fetch("/api/admin/grants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Action failed")
      }

      setSelectedGrant(null)
      setApprovedAmount("")
      setRejectReason("")
      setAdminNote("")
      fetchGrants()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed")
    }
    setActionLoading(false)
  }

  const filteredGrants = grants.filter((g) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      g.userName.toLowerCase().includes(q) ||
      g.userEmail.toLowerCase().includes(q) ||
      g.referenceNumber.toLowerCase().includes(q) ||
      g.purpose.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Grant Applications" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-5 w-5" />} />
          <StatCard label="Under Review" value={stats.underReview} icon={<Eye className="h-5 w-5" />} />
          <StatCard label="Approved" value={stats.approved} icon={<Check className="h-5 w-5" />} />
          <StatCard label="Disbursed" value={stats.disbursed} icon={<Banknote className="h-5 w-5" />} />
          <StatCard label="Rejected" value={stats.rejected} icon={<X className="h-5 w-5" />} />
          <StatCard label="Total Requested" value={fmt(stats.totalAmount)} icon={<DollarSign className="h-5 w-5" />} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, reference..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : filteredGrants.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No grant applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Applicant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Applied</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredGrants.map((g) => {
                  const TypeIcon = GRANT_TYPE_ICONS[g.grantType] || Gift
                  return (
                    <tr key={g._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{g.userName}</p>
                        <p className="text-xs text-gray-500">{g.userEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-gray-400" />
                          <span>{g.grantTypeLabel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{fmt(g.amount)}</p>
                        {g.approvedAmount && g.approvedAmount !== g.amount && (
                          <p className="text-xs text-green-600">Approved: {fmt(g.approvedAmount)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={g.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {fmtDate(g.appliedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedGrant(g)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedGrant && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Grant Application</h2>
                <p className="text-xs sm:text-sm text-gray-500">{selectedGrant.referenceNumber}</p>
              </div>
              <button
                onClick={() => { setSelectedGrant(null); setActionError(""); setApprovedAmount(""); setRejectReason(""); setAdminNote("") }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedGrant.status} />
                {selectedGrant.disbursedAt && (
                  <span className="text-sm text-gray-500">Disbursed on {fmtDate(selectedGrant.disbursedAt)}</span>
                )}
              </div>

              {/* Applicant */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Applicant</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedGrant.userName}</p>
                <p className="text-sm text-gray-500">{selectedGrant.userEmail}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Grant Type</p>
                  <p className="font-medium">{selectedGrant.grantTypeLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Requested Amount</p>
                  <p className="font-semibold text-base sm:text-lg">{fmt(selectedGrant.amount)}</p>
                </div>
                {selectedGrant.approvedAmount && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Approved Amount</p>
                    <p className="font-semibold text-base sm:text-lg text-green-600">{fmt(selectedGrant.approvedAmount)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Applied On</p>
                  <p className="font-medium">{fmtDate(selectedGrant.appliedAt)}</p>
                </div>
              </div>

              {/* Deposit Account */}
              {selectedGrant.depositAccount && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Deposit Account</p>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      selectedGrant.depositAccount.walletType === "bitcoin" 
                        ? "bg-orange-100 dark:bg-orange-900/30" 
                        : "bg-indigo-100 dark:bg-indigo-900/30"
                    }`}>
                      {selectedGrant.depositAccount.walletType === "bitcoin" ? (
                        <Bitcoin className="h-5 w-5 text-orange-500" />
                      ) : (
                        <DollarSign className="h-5 w-5 text-indigo-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedGrant.depositAccount.walletType === "bitcoin" ? "Bitcoin Wallet" : `${selectedGrant.depositAccount.currency} Account`}
                      </p>
                      <p className="text-sm text-gray-500">····{selectedGrant.depositAccount.accountNumber.slice(-4)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Purpose */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Purpose</p>
                <p className="text-gray-700 dark:text-gray-300">{selectedGrant.purpose}</p>
              </div>

              {selectedGrant.supportingInfo && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Supporting Information</p>
                  <p className="text-gray-700 dark:text-gray-300">{selectedGrant.supportingInfo}</p>
                </div>
              )}

              {/* Documents */}
              {selectedGrant.documents.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Documents</p>
                  <div className="space-y-2">
                    {selectedGrant.documents.map((doc, i) => (
                      <a
                        key={i}
                        href={doc.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600">{doc.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedGrant.rejectedReason && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                  <p className="text-xs font-medium text-red-600 uppercase mb-1">Rejection Reason</p>
                  <p className="text-red-700 dark:text-red-400">{selectedGrant.rejectedReason}</p>
                </div>
              )}

              {selectedGrant.adminNote && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                  <p className="text-xs font-medium text-indigo-600 uppercase mb-1">Admin Note</p>
                  <p className="text-indigo-700 dark:text-indigo-400">{selectedGrant.adminNote}</p>
                </div>
              )}

              {/* Action Forms */}
              {(selectedGrant.status === "pending" || selectedGrant.status === "under_review") && (
                <>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  
                  {/* Approve Amount */}
                  {selectedGrant.status === "under_review" && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                        Approved Amount (optional, defaults to requested)
                      </label>
                      <input
                        type="number"
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                        placeholder={String(selectedGrant.amount)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                  )}

                  {/* Reject Reason */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                      Rejection Reason (required if rejecting)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none"
                    />
                  </div>

                  {/* Admin Note */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                      Admin Note (optional)
                    </label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Internal note..."
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none"
                    />
                  </div>
                </>
              )}

              {actionError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{actionError}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 pb-6 sm:pb-5">
              {selectedGrant.status === "pending" && (
                <>
                  <button
                    onClick={() => handleAction("review")}
                    disabled={actionLoading}
                    className="w-full sm:flex-1 py-3 sm:py-2.5 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    Start Review
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    disabled={actionLoading}
                    className="w-full sm:flex-1 py-3 sm:py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </button>
                </>
              )}

              {selectedGrant.status === "under_review" && (
                <>
                  <button
                    onClick={() => handleAction("approve")}
                    disabled={actionLoading}
                    className="w-full sm:flex-1 py-3 sm:py-2.5 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    disabled={actionLoading}
                    className="w-full sm:flex-1 py-3 sm:py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </button>
                </>
              )}

              {selectedGrant.status === "approved" && (
                <button
                  onClick={() => handleAction("disburse")}
                  disabled={actionLoading}
                  className="w-full sm:flex-1 py-3 sm:py-2.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                  Disburse Funds
                </button>
              )}

              <button
                onClick={() => { setSelectedGrant(null); setActionError(""); setApprovedAmount(""); setRejectReason(""); setAdminNote("") }}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
