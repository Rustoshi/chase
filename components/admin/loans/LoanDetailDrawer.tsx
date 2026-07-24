"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Loader2, AlertTriangle } from "lucide-react"
import { Button }   from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { AmortizationTable }    from "@/components/admin/shared/AmortizationTable"
import { RecordPaymentModal }   from "./RecordPaymentModal"
import type { LoanDetail } from "@/lib/services/loan.service"

interface Props {
  loanId:   string | null
  onClose:  () => void
  onAction: () => void
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-100  text-amber-700",
  active:    "bg-indigo-100   text-indigo-700",
  closed:    "bg-gray-100   text-gray-600",
  defaulted: "bg-red-100    text-red-700",
  rejected:  "bg-red-50     text-red-500",
  approved:  "bg-emerald-100 text-emerald-700",
}

export function LoanDetailDrawer({ loanId, onClose, onAction }: Props) {
  const { toast } = useToast()

  const [loan,          setLoan]          = useState<LoanDetail | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [paymentOpen,   setPaymentOpen]   = useState(false)
  const [confirmAction, setConfirmAction] = useState<"close" | "default" | null>(null)
  const [submitting,    setSubmitting]    = useState(false)

  const fetchLoan = useCallback(async () => {
    if (!loanId) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/loans/${loanId}`)
      const data = await res.json()
      setLoan(data)
    } finally {
      setLoading(false)
    }
  }, [loanId])

  useEffect(() => { fetchLoan() }, [fetchLoan])

  async function handleAction(action: "close" | "default") {
    if (!loan) return
    setSubmitting(true)
    try {
      const res  = await fetch(`/api/admin/loans/${loan.id}/${action}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      toast({ title: action === "close" ? "Loan closed" : "Loan marked as defaulted" })
      setConfirmAction(null)
      onAction()
      onClose()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (!loanId) return null

  const paidPct = loan ? Math.min(100, loan.paidPercent) : 0

  return (
    <>
      <div className="fixed inset-0 z-40 flex">
        <div className="hidden sm:block flex-1 bg-black/40" onClick={onClose} />
        <div className="w-full sm:w-[560px] bg-white flex flex-col h-full shadow-2xl overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Loan details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {!loading && loan && (
            <div className="flex-1 p-5 space-y-5">
              {/* Status + user */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A2CCE] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {loan.userFirstName?.[0]}{loan.userLastName?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{loan.userName}</p>
                  <p className="text-xs text-gray-500">{loan.userEmail}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[loan.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {loan.status}
                </span>
              </div>

              {/* Overdue banner */}
              {loan.isOverdue && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {loan.daysOverdue} day{loan.daysOverdue !== 1 ? "s" : ""} overdue
                </div>
              )}

              {/* Terms */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Loan terms</h3>
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                  <Row label="Amount"          value={fmt(loan.amount)} />
                  <Row label="Purpose"         value={loan.purpose} />
                  <Row label="Interest rate"   value={loan.interestRate != null ? `${loan.interestRate}% APR` : "—"} />
                  <Row label="Term"            value={`${loan.termMonths} months`} />
                  <Row label="Monthly payment" value={loan.monthlyPayment != null ? fmt(loan.monthlyPayment) : "—"} />
                  {loan.approvedAt && <Row label="Approved"  value={new Date(loan.approvedAt).toLocaleDateString()} />}
                  {loan.closedAt   && <Row label="Closed"    value={new Date(loan.closedAt).toLocaleDateString()} />}
                  {loan.adminNote  && <Row label="Admin note" value={loan.adminNote} />}
                </div>
              </div>

              {/* Repayment progress */}
              {["active", "closed", "defaulted"].includes(loan.status) && (
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Repayment progress</span>
                    <span className="font-medium">{paidPct.toFixed(1)}% paid</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${paidPct}%`, backgroundColor: "#12B76A" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-gray-500">
                    <span>Paid: {fmt(loan.totalPaid)}</span>
                    <span>Remaining: {fmt(loan.outstandingBalance ?? 0)}</span>
                  </div>
                </div>
              )}

              {/* Next payment */}
              {loan.status === "active" && loan.nextPaymentDate && (
                <div className={[
                  "rounded-lg px-4 py-3 text-sm",
                  loan.isOverdue ? "bg-red-50 border border-red-200" : "bg-indigo-50 border border-indigo-100",
                ].join(" ")}>
                  <p className="text-xs font-medium mb-0.5 text-gray-500">Next payment due</p>
                  <p className={`font-semibold ${loan.isOverdue ? "text-red-700" : "text-indigo-800"}`}>
                    {new Date(loan.nextPaymentDate).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                    {loan.isOverdue && ` — ${loan.daysOverdue} days overdue`}
                  </p>
                </div>
              )}

              {/* Payment history */}
              {loan.repaymentTransactions.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Payment history</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full min-w-[520px] text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Reference</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {loan.repaymentTransactions.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-600">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-500">{t.reference}</td>
                            <td className="px-3 py-2 text-right font-medium text-emerald-700">
                              {fmt(t.amount / 100)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Amortization schedule */}
              {loan.status === "active" && loan.interestRate != null && loan.monthlyPayment != null && (
                <AmortizationTable
                  principal={loan.outstandingBalance ?? loan.amount}
                  annualRate={loan.interestRate}
                  termMonths={loan.termMonths}
                  startDate={new Date()}
                  maxVisible={6}
                />
              )}

              {/* Confirm action */}
              {confirmAction && (
                <div className={[
                  "rounded-xl p-4 space-y-3",
                  confirmAction === "default" ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200",
                ].join(" ")}>
                  <p className="text-sm font-medium">
                    {confirmAction === "close"
                      ? "Are you sure you want to close this loan?"
                      : "Are you sure you want to mark this loan as defaulted?"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(confirmAction)}
                      disabled={submitting}
                      className={confirmAction === "default" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          {loan && loan.status === "active" && !loading && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 pb-6 sm:pb-4">
              {/* Mobile: Stack buttons vertically */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setPaymentOpen(true)}
                  className="w-full sm:flex-1 bg-[#1A2CCE] hover:bg-[#1A2CCE]/90"
                >
                  Record payment
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmAction("close")}
                    className="flex-1 sm:flex-none text-gray-600"
                  >
                    Close loan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmAction("default")}
                    className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Mark defaulted
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {loan && (
        <RecordPaymentModal
          loan={loan}
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          onSuccess={() => { fetchLoan(); onAction() }}
        />
      )}
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="font-medium text-gray-900 text-right ml-4 break-words max-w-[65%]">{value}</span>
    </div>
  )
}
