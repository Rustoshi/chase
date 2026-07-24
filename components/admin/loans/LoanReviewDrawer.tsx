"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { X, AlertTriangle, Loader2, ExternalLink, Check } from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { AmortizationTable } from "@/components/admin/shared/AmortizationTable"
import type { LoanDetail } from "@/lib/services/loan.service"

interface Props {
  loanId:   string | null
  onClose:  () => void
  onAction: () => void
}

const RATE_PRESETS  = [0, 5, 8, 10, 12, 15, 18, 24]
const TERM_PRESETS  = [6, 12, 24, 36, 60, 120]
const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" })

function calcPayment(principal: number, rate: number, months: number) {
  if (months <= 0 || principal <= 0) return { monthly: 0, total: 0, interest: 0 }
  const r = rate / 100 / 12
  const monthly = rate === 0
    ? principal / months
    : principal * r / (1 - Math.pow(1 + r, -months))
  const total    = monthly * months
  const interest = total - principal
  return {
    monthly:  Math.round(monthly  * 100) / 100,
    total:    Math.round(total    * 100) / 100,
    interest: Math.round(interest * 100) / 100,
  }
}

export function LoanReviewDrawer({ loanId, onClose, onAction }: Props) {
  const { toast } = useToast()

  const [loan,     setLoan]     = useState<LoanDetail | null>(null)
  const [loading,  setLoading]  = useState(false)

  // Calculator state
  const [approvedAmount, setApprovedAmount] = useState("")
  const [interestRate,   setInterestRate]   = useState("10")
  const [termMonths,     setTermMonths]     = useState("12")
  const [adminNote,      setAdminNote]      = useState("")

  // UI state
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [submitting,     setSubmitting]     = useState(false)
  const [rejectMode,     setRejectMode]     = useState(false)
  const [rejectReason,   setRejectReason]   = useState("")

  const fetchLoan = useCallback(async () => {
    if (!loanId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/loans/${loanId}`)
      if (!res.ok) {
        console.error("Failed to fetch loan:", res.status)
        return
      }
      const data = await res.json()
      if (data && !data.error) {
        setLoan(data)
        setApprovedAmount(String(data.amount ?? ""))
        setTermMonths(String(data.termMonths ?? 12))
      }
    } catch (err) {
      console.error("Error fetching loan:", err)
    } finally {
      setLoading(false)
    }
  }, [loanId])

  useEffect(() => { fetchLoan() }, [fetchLoan])

  const calc = useMemo(() => {
    const amt  = parseFloat(approvedAmount)
    const rate = parseFloat(interestRate)
    const term = parseInt(termMonths)
    if (isNaN(amt) || isNaN(rate) || isNaN(term)) return null
    return calcPayment(amt, rate, term)
  }, [approvedAmount, interestRate, termMonths])

  const firstPaymentDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d
  }, [])

  async function handleApprove() {
    if (!loan) return
    setSubmitting(true)
    try {
      const res  = await fetch(`/api/admin/loans/${loan.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedAmount: parseFloat(approvedAmount),
          interestRate:   parseFloat(interestRate),
          termMonths:     parseInt(termMonths),
          adminNote:      adminNote || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      toast({ title: "Loan approved", description: `${fmt(parseFloat(approvedAmount))} disbursed to user account.` })
      onAction()
      onClose()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject() {
    if (!loan || rejectReason.length < 10) return
    setSubmitting(true)
    try {
      const res  = await fetch(`/api/admin/loans/${loan.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      toast({ title: "Application rejected" })
      onAction()
      onClose()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (!loanId) return null

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="hidden sm:block flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full sm:w-[560px] bg-white flex flex-col h-full shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Review loan application</h2>
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
            {/* Applicant card */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A2CCE] text-white flex items-center justify-center font-semibold text-sm">
                  {loan.userFirstName?.[0]}{loan.userLastName?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{loan.userName}</p>
                  <p className="text-xs text-gray-500">{loan.userEmail}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={[
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    loan.userKycStatus === "verified"   ? "bg-emerald-100 text-emerald-700" :
                    loan.userKycStatus === "pending"    ? "bg-amber-100   text-amber-700"   :
                    loan.userKycStatus === "rejected"   ? "bg-red-100     text-red-700"     :
                                                          "bg-gray-100    text-gray-500",
                  ].join(" ")}>KYC: {loan.userKycStatus}</span>
                  {loan.primaryAccount && (
                    <span className="text-xs text-gray-500">
                      Balance: {fmt(loan.primaryAccount.balance)}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={`/admin/users/${loan.userId}`}
                target="_blank"
                className="flex items-center gap-1 text-xs text-[#1A2CCE] hover:underline"
              >
                View user profile <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* KYC warning */}
            {loan.userKycStatus !== "verified" && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  User KYC is not verified. Approving this loan is not recommended.
                </p>
              </div>
            )}

            {/* Application details */}
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Application details</h3>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                <Row label="Requested amount" value={fmt(loan.amount)} />
                <Row label="Purpose" value={loan.purpose} />
                <Row label="Requested term" value={`${loan.termMonths} months`} />
                <Row label="Applied" value={new Date(loan.appliedAt).toLocaleDateString()} />
              </div>
            </div>

            {/* Loan calculator */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Loan calculator</h3>

              <div className="space-y-3">
                {/* Approved amount */}
                <div>
                  <Label className="mb-1 block text-sm">Approved amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <Input
                      type="number"
                      className="pl-7"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Interest rate */}
                <div>
                  <Label className="mb-1 block text-sm">Annual interest rate (%)</Label>
                  <Input
                    type="number"
                    min={0} max={100} step={0.1}
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {RATE_PRESETS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setInterestRate(String(r))}
                        className={[
                          "text-xs px-2 py-0.5 rounded border transition-colors",
                          interestRate === String(r)
                            ? "bg-[#1A2CCE] text-white border-[#1A2CCE]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-400",
                        ].join(" ")}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Term */}
                <div>
                  <Label className="mb-1 block text-sm">Term (months): {termMonths}</Label>
                  <input
                    type="range" min={1} max={360} step={1}
                    value={termMonths}
                    onChange={(e) => setTermMonths(e.target.value)}
                    className="w-full accent-[#1A2CCE]"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {TERM_PRESETS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTermMonths(String(t))}
                        className={[
                          "text-xs px-2 py-0.5 rounded border transition-colors",
                          termMonths === String(t)
                            ? "bg-[#1A2CCE] text-white border-[#1A2CCE]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-400",
                        ].join(" ")}
                      >
                        {t}mo
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculation result box */}
              {calc && (
                <div className="bg-[#1A2CCE]/5 border border-[#1A2CCE]/20 rounded-xl p-4 space-y-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Monthly payment</p>
                    <p className="text-3xl font-bold text-[#1A2CCE]">{fmt(calc.monthly)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1A2CCE]/10">
                    <Stat label="Total repayment" value={fmt(calc.total)} />
                    <Stat label="Total interest"  value={fmt(calc.interest)} />
                    <Stat label="First payment"   value={firstPaymentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                  </div>
                </div>
              )}

              {/* Amortization table */}
              {calc && parseFloat(approvedAmount) > 0 && parseInt(termMonths) > 0 && (
                <AmortizationTable
                  principal={parseFloat(approvedAmount)}
                  annualRate={parseFloat(interestRate)}
                  termMonths={parseInt(termMonths)}
                  startDate={new Date()}
                  maxVisible={6}
                />
              )}
            </div>

            {/* Admin note */}
            <div>
              <Label className="mb-1.5 block text-sm">Admin note (optional)</Label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Internal note for this decision…"
                rows={2}
              />
            </div>

            {/* Reject mode */}
            {rejectMode && (
              <div className="space-y-2 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-medium text-red-700">Rejection reason (required, min 10 chars)</p>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this application is being rejected…"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleReject}
                    disabled={rejectReason.length < 10 || submitting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm rejection"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectMode(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer decision area */}
        {loan && !loading && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 pb-6 sm:pb-4">
            {confirmApprove ? (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-xs text-emerald-800">
                  You are about to approve a loan of <strong>{fmt(parseFloat(approvedAmount) || 0)}</strong> at{" "}
                  <strong>{interestRate}% APR</strong> for <strong>{termMonths} months</strong>.
                  Monthly payment: <strong>{fmt(calc?.monthly ?? 0)}</strong>. Funds will be credited immediately.
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitting
                      ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Approving…</>
                      : <><Check className="w-4 h-4 mr-1" /> Confirm approval</>}
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => setConfirmApprove(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => { setRejectMode(false); setConfirmApprove(true) }}
                  disabled={!calc || parseFloat(approvedAmount) <= 0}
                  className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Approve loan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setConfirmApprove(false); setRejectMode(true) }}
                  className="w-full sm:flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  Reject application
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right max-w-[60%] break-words">{value}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  )
}
