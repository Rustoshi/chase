"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Receipt, Search, Filter, ChevronDown, Eye, Check, X,
  Clock, CheckCircle2, XCircle, Banknote, Loader2,
  User, FileText, DollarSign, AlertTriangle, Calendar,
} from "lucide-react"
import { PageHeader } from "@/components/admin/PageHeader"
import { StatCard } from "@/components/admin/StatCard"
import { StatusBadge } from "@/components/admin/StatusBadge"

// ── Types ────────────────────────────────────────────────────────────────────

interface TaxRefund {
  _id: string
  userId: string
  userName: string
  userEmail: string
  taxYear: number
  filingType: string
  totalReportedIncome: number
  totalTaxWithheld: number
  refundAmount: number
  ssnLast4: string
  employer: string | null
  status: "pending" | "under_review" | "approved" | "deposited" | "rejected"
  referenceNumber: string
  documents: Array<{ name: string; docUrl: string }>
  filingDate: string
  estimatedDepositDate: string | null
  actualDepositDate: string | null
  adminNote: string | null
  rejectedReason: string | null
}

interface Stats {
  pending: number
  underReview: number
  approved: number
  deposited: number
  rejected: number
  totalAmount: number
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "deposited", label: "Deposited" },
  { value: "rejected", label: "Rejected" },
]

const FILING_TYPE_LABELS: Record<string, string> = {
  single: "Single",
  married_joint: "Married Filing Jointly",
  married_separate: "Married Filing Separately",
  head_of_household: "Head of Household",
}

const fmt = (n: number) => `$${n.toLocaleString()}`
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminTaxRefundsPage() {
  const [refunds, setRefunds] = useState<TaxRefund[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")

  // Modal state
  const [selectedRefund, setSelectedRefund] = useState<TaxRefund | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [adminNote, setAdminNote] = useState("")

  const fetchRefunds = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (statusFilter) params.set("status", statusFilter)
      
      const res = await fetch(`/api/admin/tax-refunds?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRefunds(data.refunds || [])
        setStats(data.stats || null)
        setTotalPages(data.totalPages || 1)
      }
    } catch { /* */ }
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => {
    fetchRefunds()
  }, [fetchRefunds])

  const handleAction = async (action: "review" | "approve" | "reject" | "deposit") => {
    if (!selectedRefund) return
    setActionLoading(true)
    setActionError("")

    try {
      const body: Record<string, unknown> = {
        refundId: selectedRefund._id,
        action,
        note: adminNote || undefined,
      }

      if (action === "reject") {
        if (!rejectReason.trim()) {
          setActionError("Rejection reason is required")
          setActionLoading(false)
          return
        }
        body.reason = rejectReason.trim()
      }

      const res = await fetch("/api/admin/tax-refunds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Action failed")
      }

      setSelectedRefund(null)
      setRejectReason("")
      setAdminNote("")
      fetchRefunds()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed")
    }
    setActionLoading(false)
  }

  const filteredRefunds = refunds.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.referenceNumber.toLowerCase().includes(q) ||
      String(r.taxYear).includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Tax Refunds" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-5 w-5" />} />
          <StatCard label="Under Review" value={stats.underReview} icon={<Eye className="h-5 w-5" />} />
          <StatCard label="Approved" value={stats.approved} icon={<Check className="h-5 w-5" />} />
          <StatCard label="Deposited" value={stats.deposited} icon={<Banknote className="h-5 w-5" />} />
          <StatCard label="Rejected" value={stats.rejected} icon={<X className="h-5 w-5" />} />
          <StatCard label="Total Amount" value={fmt(stats.totalAmount)} icon={<DollarSign className="h-5 w-5" />} />
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
            placeholder="Search by name, email, reference, year..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filteredRefunds.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No tax refunds found</div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Applicant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Tax Year</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Filing Type</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Refund Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Filed</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRefunds.map((refund) => (
                  <tr key={refund._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{refund.userName}</p>
                      <p className="text-xs text-gray-500">{refund.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{refund.taxYear}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {FILING_TYPE_LABELS[refund.filingType] || refund.filingType}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(refund.refundAmount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={refund.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(refund.filingDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedRefund(refund)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Tax Refund Details</h2>
                <p className="text-xs sm:text-sm text-gray-500">{selectedRefund.referenceNumber}</p>
              </div>
              <button
                onClick={() => { setSelectedRefund(null); setActionError(""); setRejectReason(""); setAdminNote("") }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedRefund.status} />
                {selectedRefund.actualDepositDate && (
                  <span className="text-sm text-gray-500">Deposited on {fmtDate(selectedRefund.actualDepositDate)}</span>
                )}
              </div>

              {/* Applicant */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Applicant</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedRefund.userName}</p>
                <p className="text-sm text-gray-500">{selectedRefund.userEmail}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Tax Year</p>
                  <p className="font-medium">{selectedRefund.taxYear}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Filing Type</p>
                  <p className="font-medium">{FILING_TYPE_LABELS[selectedRefund.filingType] || selectedRefund.filingType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">SSN (Last 4)</p>
                  <p className="font-medium">···· {selectedRefund.ssnLast4}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Filed On</p>
                  <p className="font-medium">{fmtDate(selectedRefund.filingDate)}</p>
                </div>
              </div>

              {/* Financial Details */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Financial Summary</p>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Reported Income</span>
                  <span className="font-semibold">{fmt(selectedRefund.totalReportedIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Tax Withheld</span>
                  <span className="font-semibold">{fmt(selectedRefund.totalTaxWithheld)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                  <span className="text-gray-900 dark:text-white font-medium">Refund Amount</span>
                  <span className="font-bold text-lg text-green-600">{fmt(selectedRefund.refundAmount)}</span>
                </div>
              </div>

              {selectedRefund.employer && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Employer</p>
                  <p className="text-gray-700 dark:text-gray-300">{selectedRefund.employer}</p>
                </div>
              )}

              {/* Documents */}
              {selectedRefund.documents.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Documents</p>
                  <div className="space-y-2">
                    {selectedRefund.documents.map((doc, i) => (
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

              {selectedRefund.rejectedReason && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                  <p className="text-xs font-medium text-red-600 uppercase mb-1">Rejection Reason</p>
                  <p className="text-red-700 dark:text-red-400">{selectedRefund.rejectedReason}</p>
                </div>
              )}

              {selectedRefund.adminNote && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                  <p className="text-xs font-medium text-indigo-600 uppercase mb-1">Admin Note</p>
                  <p className="text-indigo-700 dark:text-indigo-400">{selectedRefund.adminNote}</p>
                </div>
              )}

              {/* Action Forms */}
              {(selectedRefund.status === "pending" || selectedRefund.status === "under_review") && (
                <>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  
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
              {selectedRefund.status === "pending" && (
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

              {selectedRefund.status === "under_review" && (
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

              {selectedRefund.status === "approved" && (
                <button
                  onClick={() => handleAction("deposit")}
                  disabled={actionLoading}
                  className="w-full sm:flex-1 py-3 sm:py-2.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                  Deposit Refund
                </button>
              )}

              <button
                onClick={() => { setSelectedRefund(null); setActionError(""); setRejectReason(""); setAdminNote("") }}
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
