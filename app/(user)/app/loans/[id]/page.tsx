"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import { useRouter, useParams } from "next/navigation"
import {
  Landmark, Home, Car, GraduationCap, Briefcase, User,
  DollarSign, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  ArrowDownLeft, CreditCard, AlertCircle, Lock,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"

// ── Types ────────────────────────────────────────────────────────────────────

interface LoanDetail {
  _id:                string
  loanType:           string
  amount:             number
  purpose:            string
  termMonths:         number
  interestRate:       number | null
  status:             string
  totalPaid:          number
  outstandingBalance: number
  monthlyPayment:     number
  nextPaymentDate:    string | null
  gracePeriodDays:    number
  lateFeePercent:     number
  adminNote:          string | null
  appliedAt:          string
  approvedAt:         string | null
  closedAt:           string | null
  employmentStatus:   string | null
  monthlyIncome:      number | null
}

interface Repayment {
  _id:       string
  amount:    number
  reference: string
  createdAt: string
}

interface Disbursement {
  amount:    number
  reference: string
  createdAt: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const LOAN_TYPE_ICONS: Record<string, React.ElementType> = {
  personal:  User,
  auto:      Car,
  home:      Home,
  education: GraduationCap,
  business:  Briefcase,
}

const LOAN_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  personal:  { color: "#1A2CCE", bg: "#EEF0FE" },
  auto:      { color: "#F79009", bg: "#FFFAEB" },
  home:      { color: "#12B76A", bg: "#ECFDF3" },
  education: { color: "#7A5AF8", bg: "#F4F3FF" },
  business:  { color: "#DD2590", bg: "#FDF2FA" },
}

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: "#F79009", bg: "#FFFAEB", label: "Under Review" },
  approved:  { color: "#12B76A", bg: "#ECFDF3", label: "Approved" },
  active:    { color: "#12B76A", bg: "#ECFDF3", label: "Active" },
  rejected:  { color: "#F04438", bg: "#FEF3F2", label: "Rejected" },
  closed:    { color: "#1A2CCE", bg: "#EEF0FE", label: "Paid Off" },
  defaulted: { color: "#F04438", bg: "#FEF3F2", label: "Defaulted" },
}

// Currency formatting moved to useCurrency hook

function calcMonthly(principal: number, annualRate: number, months: number) {
  if (months <= 0 || principal <= 0) return 0
  if (annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return principal * r / (1 - Math.pow(1 + r, -months))
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function LoanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const loanId = params.id as string
  const { formatAmount, symbol: currencySymbol } = useCurrency()
  const fmt = (n: number) => formatAmount(n)
  const fmtShort = (n: number) => formatAmount(n)

  const [loan, setLoan] = useState<LoanDetail | null>(null)
  const [repayments, setRepayments] = useState<Repayment[]>([])
  const [disbursement, setDisbursement] = useState<Disbursement | null>(null)
  const [accountBalance, setAccountBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Payment state
  const [showPayment, setShowPayment] = useState(false)
  useBodyScrollLock(showPayment)
  const [payAmount, setPayAmount] = useState("")
  const [payPin, setPayPin] = useState("")
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState("")
  const [paySuccess, setPaySuccess] = useState("")

  // Schedule expand
  const [showSchedule, setShowSchedule] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const fetchLoan = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/user/loans/${loanId}`)
      if (!res.ok) { setError("Loan not found"); setLoading(false); return }
      const data = await res.json()
      setLoan(data.loan)
      setRepayments(data.repayments || [])
      setDisbursement(data.disbursement || null)
      setAccountBalance(data.accountBalance || 0)
    } catch {
      setError("Failed to load loan details")
    }
    setLoading(false)
  }, [loanId])

  useEffect(() => { fetchLoan() }, [fetchLoan])

  // ── Amortization schedule ──────────────────────────────────────────────

  const schedule = useMemo(() => {
    if (!loan || !loan.interestRate || loan.status === "pending" || loan.status === "rejected") return []
    const rows: Array<{ month: number; payment: number; principal: number; interest: number; balance: number }> = []
    const r = loan.interestRate / 100 / 12
    const mp = calcMonthly(loan.amount, loan.interestRate, loan.termMonths)
    let balance = loan.amount
    for (let m = 1; m <= loan.termMonths; m++) {
      const interest = r > 0 ? balance * r : 0
      const principal = mp - interest
      balance = Math.max(0, balance - principal)
      rows.push({
        month: m,
        payment: Math.round(mp * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      })
    }
    return rows
  }, [loan])

  // ── Payment handlers ───────────────────────────────────────────────────

  function openPayment(preset?: number) {
    setPayAmount(preset ? preset.toFixed(2) : "")
    setPayPin("")
    setPayError("")
    setPaySuccess("")
    setShowPayment(true)
  }

  async function handlePay() {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) { setPayError("Enter a valid amount"); return }
    if (!payPin || payPin.length < 4) { setPayError("Enter your transfer PIN"); return }

    setPaying(true)
    setPayError("")
    try {
      const res = await fetch(`/api/user/loans/${loanId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, pin: payPin }),
      })
      const data = await res.json()
      if (!res.ok) { setPayError(data.error || "Payment failed"); setPaying(false); return }
      setPaySuccess(data.message)
      fetchLoan()
    } catch {
      setPayError("Network error")
    }
    setPaying(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const tc = LOAN_TYPE_COLORS[loan?.loanType || "personal"] || LOAN_TYPE_COLORS.personal
  const TypeIcon = LOAN_TYPE_ICONS[loan?.loanType || "personal"] || Landmark
  const cfg = STATUS_CFG[loan?.status || "pending"] || STATUS_CFG.pending
  const paidPct = loan && loan.amount > 0 ? Math.min((loan.totalPaid / loan.amount) * 100, 100) : 0

  const cardShadow = "0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)"

  return (
    <div style={{ background: "#F5F6F8", minHeight: "100vh" }}>
      <UserHeader title="Loan Details" showBack onBack={() => router.push("/app/loans")} />

      <div className="px-4 py-5 lg:px-6 max-w-[800px] mx-auto space-y-5">
        {loading ? (
          <div className="space-y-4">
            <div className="h-48 rounded-2xl skeleton-shimmer" />
            <div className="h-32 rounded-2xl skeleton-shimmer" />
          </div>
        ) : error && !loan ? (
          <div className="py-20 text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3" style={{ color: "#F04438" }} />
            <p className="text-[15px] font-semibold" style={{ color: "#101828" }}>{error}</p>
            <button
              onClick={() => router.push("/app/loans")}
              className="mt-4 h-10 rounded-xl px-6 text-[14px] font-medium"
              style={{ background: "#F9FAFB", border: "1px solid #EAECF0", color: "#344054" }}
            >
              Back to Loans
            </button>
          </div>
        ) : loan ? (
          <>
            {/* ── Header Card ──────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: cardShadow }}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: tc.bg }}>
                      <TypeIcon className="h-5 w-5" style={{ color: tc.color }} />
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold" style={{ color: "#101828" }}>{loan.purpose}</p>
                      <p className="text-[12px] capitalize" style={{ color: "#667085" }}>{loan.loanType} loan</p>
                    </div>
                  </div>
                  <span className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Balance section */}
                {(loan.status === "active" || loan.status === "closed") && (
                  <>
                    <div className="text-center py-4">
                      <p className="text-[11px] uppercase tracking-wide" style={{ color: "#98A2B3" }}>Outstanding Balance</p>
                      <p className="text-[32px] font-bold tabular-nums mt-1" style={{ color: "#101828" }}>{fmt(loan.outstandingBalance)}</p>
                      <p className="text-[13px]" style={{ color: "#667085" }}>of {fmtShort(loan.amount)} borrowed</p>
                    </div>

                    {/* Progress */}
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#EAECF0" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${paidPct}%`, background: "#12B76A" }} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[11px] tabular-nums" style={{ color: "#12B76A" }}>{paidPct.toFixed(1)}% repaid</p>
                      <p className="text-[11px] tabular-nums" style={{ color: "#667085" }}>{fmt(loan.totalPaid)} paid</p>
                    </div>
                  </>
                )}

                {/* Pending / rejected amount */}
                {(loan.status === "pending" || loan.status === "rejected") && (
                  <div className="text-center py-4">
                    <p className="text-[11px] uppercase tracking-wide" style={{ color: "#98A2B3" }}>Requested Amount</p>
                    <p className="text-[32px] font-bold tabular-nums mt-1" style={{ color: "#101828" }}>{fmtShort(loan.amount)}</p>
                    <p className="text-[13px]" style={{ color: "#667085" }}>{loan.termMonths} months</p>
                  </div>
                )}
              </div>

              {/* Stats row */}
              {loan.status === "active" && (
                <div className="grid grid-cols-3 divide-x" style={{ borderTop: "1px solid #EAECF0", borderColor: "#EAECF0" }}>
                  <StatCell label="Monthly" value={fmt(loan.monthlyPayment)} />
                  <StatCell label="Rate" value={loan.interestRate ? `${loan.interestRate}% APR` : "—"} />
                  <StatCell label="Next Due" value={loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"} />
                </div>
              )}
            </div>

            {/* ── Make Payment Button ──────────────────────────────── */}
            {loan.status === "active" && (
              <div className="space-y-2">
                <button
                  onClick={() => openPayment(loan.monthlyPayment)}
                  className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{ background: "#12B76A" }}
                >
                  <CreditCard className="h-4 w-4" /> Make a Payment
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => openPayment(loan.monthlyPayment)}
                    className="flex-1 h-10 rounded-xl text-[13px] font-medium transition-all"
                    style={{ background: "#F9FAFB", border: "1px solid #EAECF0", color: "#344054" }}
                  >
                    Monthly ({fmt(loan.monthlyPayment)})
                  </button>
                  <button
                    onClick={() => openPayment(loan.outstandingBalance)}
                    className="flex-1 h-10 rounded-xl text-[13px] font-medium transition-all"
                    style={{ background: "#F9FAFB", border: "1px solid #EAECF0", color: "#344054" }}
                  >
                    Pay in Full ({fmt(loan.outstandingBalance)})
                  </button>
                </div>
              </div>
            )}

            {/* ── Loan Details Card ───────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: cardShadow }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #EAECF0" }}>
                <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "#667085" }}>Loan Details</p>
              </div>
              <div className="divide-y" style={{ borderColor: "#EAECF0" }}>
                <DetailRow label="Loan Type" value={loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)} />
                <DetailRow label="Amount" value={fmtShort(loan.amount)} />
                <DetailRow label="Term" value={`${loan.termMonths} months`} />
                {loan.interestRate != null && <DetailRow label="Interest Rate" value={`${loan.interestRate}% APR`} />}
                {loan.monthlyPayment > 0 && <DetailRow label="Monthly Payment" value={fmt(loan.monthlyPayment)} />}
                <DetailRow label="Applied" value={new Date(loan.appliedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} />
                {loan.approvedAt && <DetailRow label="Approved" value={new Date(loan.approvedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} />}
                {loan.closedAt && <DetailRow label="Closed" value={new Date(loan.closedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} />}
              </div>
            </div>

            {/* ── Admin Note ──────────────────────────────────────── */}
            {loan.adminNote && (
              <div className="rounded-2xl p-4" style={{ background: "#FFFAEB", border: "1px solid #FEDF89" }}>
                <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: "#F79009" }}>Note from Admin</p>
                <p className="text-[13px]" style={{ color: "#667085" }}>{loan.adminNote}</p>
              </div>
            )}

            {/* ── Amortization Schedule ───────────────────────────── */}
            {schedule.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: cardShadow }}>
                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "#667085" }}>
                    Amortization Schedule
                  </p>
                  {showSchedule
                    ? <ChevronUp className="h-4 w-4" style={{ color: "#98A2B3" }} />
                    : <ChevronDown className="h-4 w-4" style={{ color: "#98A2B3" }} />}
                </button>
                {showSchedule && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-5 gap-1 mb-1">
                      {["#", "Payment", "Principal", "Interest", "Balance"].map((h) => (
                        <p key={h} className="text-[9px] font-medium uppercase" style={{ color: "#98A2B3" }}>{h}</p>
                      ))}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-0.5">
                      {schedule.map((row) => (
                        <div key={row.month} className="grid grid-cols-5 gap-1 py-1" style={{ borderTop: "1px solid #F2F4F7" }}>
                          <p className="text-[11px] tabular-nums" style={{ color: "#667085" }}>{row.month}</p>
                          <p className="text-[11px] tabular-nums" style={{ color: "#101828" }}>{fmt(row.payment)}</p>
                          <p className="text-[11px] tabular-nums" style={{ color: "#101828" }}>{fmt(row.principal)}</p>
                          <p className="text-[11px] tabular-nums" style={{ color: "#F79009" }}>{fmt(row.interest)}</p>
                          <p className="text-[11px] tabular-nums" style={{ color: "#101828" }}>{fmt(row.balance)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Payment History ──────────────────────────────────── */}
            {(repayments.length > 0 || disbursement) && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: cardShadow }}>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "#667085" }}>
                    Transaction History ({(disbursement ? 1 : 0) + repayments.length})
                  </p>
                  {showHistory
                    ? <ChevronUp className="h-4 w-4" style={{ color: "#98A2B3" }} />
                    : <ChevronDown className="h-4 w-4" style={{ color: "#98A2B3" }} />}
                </button>
                {showHistory && (
                  <div className="px-4 pb-4 space-y-2">
                    {disbursement && (
                      <div className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid #F2F4F7" }}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#ECFDF3" }}>
                          <ArrowDownLeft className="h-3.5 w-3.5" style={{ color: "#12B76A" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium" style={{ color: "#101828" }}>Loan Disbursement</p>
                          <p className="text-[11px]" style={{ color: "#98A2B3" }}>
                            {new Date(disbursement.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <p className="text-[13px] font-semibold" style={{ color: "#12B76A" }}>+{fmt(disbursement.amount)}</p>
                      </div>
                    )}
                    {repayments.map((tx) => (
                      <div key={tx._id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid #F2F4F7" }}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#EEF0FE" }}>
                          <CreditCard className="h-3.5 w-3.5" style={{ color: "#1A2CCE" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium" style={{ color: "#101828" }}>Loan Repayment</p>
                          <p className="text-[11px]" style={{ color: "#98A2B3" }}>
                            {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {tx.reference}
                          </p>
                        </div>
                        <p className="text-[13px] font-semibold" style={{ color: "#F04438" }}>-{fmt(tx.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Payment Sheet                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {showPayment && loan && (
        <>
          <div className="fixed inset-0 z-50" style={{ background: "rgba(16,24,40,0.5)" }} onClick={() => !paying && setShowPayment(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden"
            style={{
              background: "#FFFFFF",
              borderRadius: "24px 24px 0 0",
              maxHeight: "85vh",
              animation: "slideUp 300ms ease-out",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#D0D5DD" }} />
            </div>

            {paySuccess ? (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#ECFDF3" }}>
                  <CheckCircle2 className="h-8 w-8" style={{ color: "#12B76A" }} />
                </div>
                <p className="text-[17px] font-semibold" style={{ color: "#101828" }}>{paySuccess}</p>
                <button
                  onClick={() => setShowPayment(false)}
                  className="mt-5 w-full h-12 rounded-xl text-[15px] font-semibold text-white"
                  style={{ background: "#1A2CCE" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 pb-6">
                <h2 className="text-[17px] font-semibold py-3" style={{ color: "#101828" }}>Make a Payment</h2>

                <div className="rounded-xl p-3 mb-4" style={{ background: "#F9FAFB", border: "1px solid #EAECF0" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "#667085" }}>Outstanding</span>
                    <span className="text-[13px] font-semibold" style={{ color: "#101828" }}>{fmt(loan.outstandingBalance)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[12px]" style={{ color: "#667085" }}>Your Balance</span>
                    <span className="text-[13px] font-semibold" style={{ color: "#101828" }}>{fmt(accountBalance)}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="block text-[12px] font-medium uppercase tracking-wide mb-2" style={{ color: "#667085" }}>
                    Payment Amount
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium pointer-events-none"
                      style={{ color: payAmount ? "#101828" : "#98A2B3" }}
                    >
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-[52px] pl-8 pr-4 rounded-xl text-[15px] font-medium"
                      style={{
                        background: "#F9FAFB",
                        border: "1px solid #D0D5DD",
                        color: "#101828",
                        outline: "none",
                      }}
                      step="0.01"
                      min="0.01"
                      max={loan.outstandingBalance}
                    />
                  </div>
                </div>

                {/* PIN */}
                <div className="mb-4">
                  <label className="block text-[12px] font-medium uppercase tracking-wide mb-2" style={{ color: "#667085" }}>
                    Transfer PIN
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#98A2B3" }} />
                    <input
                      type="password"
                      value={payPin}
                      onChange={(e) => setPayPin(e.target.value)}
                      placeholder="Enter your 4-digit PIN"
                      className="w-full h-[52px] pl-11 pr-4 rounded-xl text-[15px]"
                      style={{
                        background: "#F9FAFB",
                        border: "1px solid #D0D5DD",
                        color: "#101828",
                        outline: "none",
                      }}
                      maxLength={6}
                    />
                  </div>
                </div>

                {payError && (
                  <div className="rounded-xl p-3 flex items-start gap-2 mb-4" style={{ background: "#FEF3F2", border: "1px solid #FECDCA" }}>
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#F04438" }} />
                    <p className="text-[13px]" style={{ color: "#F04438" }}>{payError}</p>
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={paying || !payAmount || !payPin}
                  className="w-full h-12 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98]"
                  style={{
                    background: payAmount && payPin ? "#12B76A" : "#EAECF0",
                    color: payAmount && payPin ? "#FFFFFF" : "#98A2B3",
                    opacity: payAmount && payPin && !paying ? 1 : 0.5,
                  }}
                >
                  {paying ? "Processing..." : `Pay ${payAmount ? fmt(parseFloat(payAmount) || 0) : `${currencySymbol}0.00`}`}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 text-center">
      <p className="text-[10px] uppercase" style={{ color: "#98A2B3" }}>{label}</p>
      <p className="text-[13px] font-semibold mt-0.5 tabular-nums" style={{ color: "#101828" }}>{value}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[13px]" style={{ color: "#667085" }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: "#101828" }}>{value}</span>
    </div>
  )
}
