"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Landmark, Plus, Clock, CheckCircle2, XCircle, ChevronRight, ChevronLeft,
  Home, Car, GraduationCap, Briefcase, User, DollarSign, Calculator,
  AlertCircle, Shield, ArrowRight,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"

// ── Types ────────────────────────────────────────────────────────────────────

interface LoanData {
  _id:               string
  loanType:          string
  amount:            number
  purpose:           string
  termMonths:        number
  interestRate:      number | null
  status:            string
  totalPaid:         number
  outstandingBalance: number
  monthlyPayment:    number
  nextPaymentDate:   string | null
  adminNote:         string | null
  appliedAt:         string
  approvedAt:        string | null
}

interface LoanProduct {
  type:      string
  label:     string
  minRate:   number
  maxRate:   number
  minTerm:   number
  maxTerm:   number
  minAmount: number
  maxAmount: number
}

interface Eligibility {
  eligible: boolean
  reasons:  string[]
  products: LoanProduct[]
  limits:   {
    maxActiveLoans:    number
    activeLoans:       number
    lifetimeLimit:     number
    lifetimeBorrowed:  number
    remainingLifetime: number
    cooldownDays:      number
    cooldownRemaining: number
    minAccountAgeDays: number
    accountAgeDays:    number
  }
}

type View = "list" | "apply"
type Step = 1 | 2 | 3 | 4 | 5

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending:   { icon: Clock,        color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: "Under Review" },
  approved:  { icon: CheckCircle2, color: "#00C896", bg: "rgba(0,200,150,0.12)",  label: "Approved" },
  active:    { icon: CheckCircle2, color: "#00C896", bg: "rgba(0,200,150,0.12)",  label: "Active" },
  rejected:  { icon: XCircle,      color: "#EF4444", bg: "rgba(239,68,68,0.12)",  label: "Rejected" },
  closed:    { icon: CheckCircle2, color: "#3B9EFF", bg: "rgba(59,158,255,0.12)", label: "Paid Off" },
  defaulted: { icon: XCircle,      color: "#EF4444", bg: "rgba(239,68,68,0.12)",  label: "Defaulted" },
}

const LOAN_TYPE_ICONS: Record<string, React.ElementType> = {
  personal:  User,
  auto:      Car,
  home:      Home,
  education: GraduationCap,
  business:  Briefcase,
}

const LOAN_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  personal:  { color: "#3B9EFF", bg: "rgba(59,158,255,0.12)" },
  auto:      { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  home:      { color: "#00C896", bg: "rgba(0,200,150,0.12)" },
  education: { color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  business:  { color: "#F472B6", bg: "rgba(244,114,182,0.12)" },
}

const EMPLOYMENT_OPTIONS = [
  { value: "employed",      label: "Employed" },
  { value: "self_employed",  label: "Self-Employed" },
  { value: "retired",       label: "Retired" },
  { value: "student",       label: "Student" },
  { value: "other",         label: "Other" },
]

// Currency formatting moved to useCurrency hook

function calcMonthly(principal: number, annualRate: number, months: number) {
  if (months <= 0 || principal <= 0) return 0
  if (annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return principal * r / (1 - Math.pow(1 + r, -months))
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function LoansPage() {
  const router = useRouter()
  const colors = useThemeColors()
  const { formatAmount, symbol: currencySymbol } = useCurrency()
  const fmt = (n: number) => formatAmount(n)
  const fmtExact = (n: number) => formatAmount(n)
  const [view, setView] = useState<View>("list")

  // List state
  const [loans, setLoans] = useState<LoanData[]>([])
  const [loading, setLoading] = useState(true)

  // Eligibility
  const [elig, setElig] = useState<Eligibility | null>(null)
  const [eligLoading, setEligLoading] = useState(false)

  // Apply wizard state
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState({
    loanType:         "",
    amount:           "",
    termMonths:       12,
    purpose:          "",
    employmentStatus: "",
    employer:         "",
    monthlyIncome:    "",
  })
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState("")
  const [successId, setSuccessId] = useState("")

  // ── Data fetching ──────────────────────────────────────────────────────

  const fetchLoans = useCallback(async () => {
    try {
      const res = await fetch("/api/user/loans")
      if (res.ok) {
        const data = await res.json()
        setLoans(data.loans)
      }
    } catch { /* */ }
    setLoading(false)
  }, [])

  const fetchEligibility = useCallback(async () => {
    setEligLoading(true)
    try {
      const res = await fetch("/api/user/loans/eligibility")
      if (res.ok) setElig(await res.json())
    } catch { /* */ }
    setEligLoading(false)
  }, [])

  useEffect(() => { fetchLoans() }, [fetchLoans])

  // ── Derived ────────────────────────────────────────────────────────────

  const selectedProduct = useMemo(
    () => elig?.products.find((p) => p.type === form.loanType) ?? null,
    [elig, form.loanType],
  )

  const estRate = useMemo(
    () => selectedProduct ? (selectedProduct.minRate + selectedProduct.maxRate) / 2 : 10,
    [selectedProduct],
  )

  const estMonthly = useMemo(() => {
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0 || !form.termMonths) return 0
    return calcMonthly(amt, estRate, form.termMonths)
  }, [form.amount, form.termMonths, estRate])

  const estTotal = estMonthly * form.termMonths
  const estInterest = estTotal - (parseFloat(form.amount) || 0)

  const activeLoans = loans.filter((l) => l.status === "active" || l.status === "approved")
  const otherLoans = loans.filter((l) => l.status !== "active" && l.status !== "approved")

  // ── Actions ────────────────────────────────────────────────────────────

  function startApply() {
    setForm({ loanType: "", amount: "", termMonths: 12, purpose: "", employmentStatus: "", employer: "", monthlyIncome: "" })
    setStep(1)
    setError("")
    setSuccessId("")
    setView("apply")
    fetchEligibility()
  }

  async function handleSubmit() {
    setApplying(true)
    setError("")
    try {
      const res = await fetch("/api/user/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanType:         form.loanType,
          amount:           parseFloat(form.amount),
          termMonths:       form.termMonths,
          purpose:          form.purpose,
          employmentStatus: form.employmentStatus || undefined,
          employer:         form.employer || undefined,
          monthlyIncome:    form.monthlyIncome ? parseFloat(form.monthlyIncome) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to apply"); setApplying(false); return }
      setSuccessId(data.loan._id)
      setStep(5)
      fetchLoans()
    } catch {
      setError("Network error")
    }
    setApplying(false)
  }

  // ── Term options for selected product ──────────────────────────────────

  const termOptions = useMemo(() => {
    if (!selectedProduct) return [6, 12, 24, 36, 48, 60]
    const opts: number[] = []
    const presets = [3, 6, 12, 18, 24, 36, 48, 60, 84, 120, 180, 240, 360]
    for (const t of presets) {
      if (t >= selectedProduct.minTerm && t <= selectedProduct.maxTerm) opts.push(t)
    }
    if (opts.length === 0) opts.push(selectedProduct.minTerm)
    return opts
  }, [selectedProduct])

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER — LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════

  if (view === "list") {
    return (
      <>
        <UserHeader
          title="Loans"
          showBack
          rightElement={
            <button
              onClick={startApply}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: colors.blueBg }}
            >
              <Plus className="h-4 w-4" style={{ color: colors.blue }} />
            </button>
          }
        />

        <div className="px-4 py-5 lg:px-6 space-y-5 max-w-[800px] mx-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 rounded-2xl" style={{ background: colors.bgElevated }} />
              ))}
            </div>
          ) : loans.length === 0 ? (
            /* ── Empty state ──────────────────────────────────────────── */
            <div className="py-20 text-center">
              <div
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: colors.blueBg }}
              >
                <Landmark className="h-9 w-9" style={{ color: colors.blue }} />
              </div>
              <p className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>No loans yet</p>
              <p className="mt-1 text-[14px]" style={{ color: colors.textTertiary }}>
                Apply for a loan and get funds in your account
              </p>
              <button
                onClick={startApply}
                className="mt-5 h-11 rounded-xl px-6 text-[14px] font-semibold text-white transition-all active:scale-[0.97]"
                style={{ background: colors.blue }}
              >
                Apply for a loan
              </button>
            </div>
          ) : (
            <>
              {/* ── Active loans ──────────────────────────────────────── */}
              {activeLoans.map((loan) => (
                <ActiveLoanCard key={loan._id} loan={loan} onTap={() => router.push(`/app/loans/${loan._id}`)} colors={colors} fmt={fmt} />
              ))}

              {/* ── Applications ──────────────────────────────────────── */}
              {otherLoans.length > 0 && (
                <div>
                  <p className="text-[13px] font-medium uppercase tracking-[0.06em] mb-3" style={{ color: colors.textTertiary }}>
                    Applications
                  </p>
                  <div className="space-y-2">
                    {otherLoans.map((loan) => {
                      const cfg = STATUS_CFG[loan.status] || STATUS_CFG.pending
                      const Icon = cfg.icon
                      const TypeIcon = LOAN_TYPE_ICONS[loan.loanType] || Landmark
                      const tc = LOAN_TYPE_COLORS[loan.loanType] || LOAN_TYPE_COLORS.personal
                      return (
                        <div
                          key={loan._id}
                          className="flex items-center gap-3 rounded-2xl p-4"
                          style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: tc.bg }}>
                            <TypeIcon className="h-[18px] w-[18px]" style={{ color: tc.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium truncate" style={{ color: colors.textPrimary }}>
                              {fmt(loan.amount)} — {loan.purpose}
                            </p>
                            <p className="text-[12px] mt-0.5" style={{ color: colors.textTertiary }}>
                              {loan.termMonths} months · Applied {new Date(loan.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Apply button at bottom ────────────────────────────── */}
              <button
                onClick={startApply}
                className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: colors.blue }}
              >
                <Plus className="h-4 w-4" /> Apply for a new loan
              </button>
            </>
          )}
        </div>
      </>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER — APPLY WIZARD
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <>
      <UserHeader
        title={step === 5 ? "Application Submitted" : "Apply for a Loan"}
        showBack
        onBack={() => {
          if (step === 5 || step === 1) { setView("list"); return }
          setStep((s) => (s - 1) as Step)
        }}
      />

      {/* Progress bar */}
      {step < 5 && (
        <div className="px-4 pt-2 pb-4 max-w-[800px] mx-auto">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ background: s <= step ? colors.blue : colors.border }}
              />
            ))}
          </div>
          <p className="text-[11px] mt-2" style={{ color: colors.textMuted }}>
            Step {step} of 4
          </p>
        </div>
      )}

      <div className="px-4 lg:px-6 max-w-[800px] mx-auto pb-10">
        {/* ── Loading eligibility ─────────────────────────────────────── */}
        {eligLoading && step === 1 && (
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${colors.blue}4D`, borderTopColor: "transparent" }} />
            <p className="text-[13px] mt-3" style={{ color: colors.textTertiary }}>Checking eligibility...</p>
          </div>
        )}

        {/* ── Not eligible ────────────────────────────────────────────── */}
        {!eligLoading && elig && !elig.eligible && step === 1 && (
          <div className="py-10">
            <div className="rounded-2xl p-5" style={{ background: colors.redBg, border: `1px solid ${colors.red}1F` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: colors.redBg }}>
                  <Shield className="h-5 w-5" style={{ color: colors.red }} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>Not Eligible</p>
                  <p className="text-[12px]" style={{ color: colors.textTertiary }}>Please resolve the following before applying</p>
                </div>
              </div>
              <div className="space-y-2">
                {elig.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.red }} />
                    <p className="text-[13px]" style={{ color: colors.textSecondary }}>{r}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setView("list")}
              className="w-full h-12 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] mt-5"
              style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
            >
              Back to Loans
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  STEP 1 — Loan Type                                          */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {!eligLoading && elig?.eligible && step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>Choose loan type</h3>
              <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>
                Select the type of loan that fits your needs
              </p>
            </div>

            <div className="space-y-3">
              {elig.products.map((product) => {
                const Icon = LOAN_TYPE_ICONS[product.type] || Landmark
                const typeColors = LOAN_TYPE_COLORS[product.type] || LOAN_TYPE_COLORS.personal
                const selected = form.loanType === product.type
                return (
                  <button
                    key={product.type}
                    onClick={() => {
                      setForm((f) => ({ ...f, loanType: product.type, amount: "", termMonths: product.minTerm >= 12 ? 12 : product.minTerm }))
                    }}
                    className="w-full text-left rounded-2xl p-4 transition-all"
                    style={{
                      background: selected ? `${typeColors.bg.replace("0.12", "0.18")}` : colors.bgElevated,
                      border: selected ? `1.5px solid ${typeColors.color}40` : `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: typeColors.bg }}>
                        <Icon className="h-5 w-5" style={{ color: typeColors.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>{product.label}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: colors.textTertiary }}>
                          {fmt(product.minAmount)} – {fmt(product.maxAmount)} · {product.minRate}–{product.maxRate}% APR
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: selected ? typeColors.color : colors.textMuted }} />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Limits info */}
            <div className="rounded-xl p-3" style={{ background: colors.bgHover, border: `1px solid ${colors.border}` }}>
              <p className="text-[11px] font-medium uppercase tracking-wide mb-2" style={{ color: colors.textMuted }}>Your Limits</p>
              <div className="grid grid-cols-2 gap-2">
                <LimitRow label="Active loans" value={`${elig.limits.activeLoans} / ${elig.limits.maxActiveLoans}`} colors={colors} />
                <LimitRow label="Available to borrow" value={fmt(elig.limits.remainingLifetime)} colors={colors} />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.loanType}
              className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: form.loanType ? colors.blue : colors.bgHover,
                opacity: form.loanType ? 1 : 0.5,
              }}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  STEP 2 — Amount & Term                                      */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {step === 2 && selectedProduct && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>Amount & Term</h3>
              <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>
                {selectedProduct.label} · {fmt(selectedProduct.minAmount)} – {fmt(selectedProduct.maxAmount)}
              </p>
            </div>

            {/* Amount input */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Loan Amount (USD)
              </label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.textMuted }} />
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder={`${currencySymbol}${selectedProduct.minAmount.toLocaleString()} – ${currencySymbol}${selectedProduct.maxAmount.toLocaleString()}`}
                  className="w-full h-11 rounded-xl px-4 pl-9 text-[14px] outline-none"
                  style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                  min={selectedProduct.minAmount}
                  max={selectedProduct.maxAmount}
                />
              </div>
              {form.amount && (parseFloat(form.amount) < selectedProduct.minAmount || parseFloat(form.amount) > selectedProduct.maxAmount) && (
                <p className="text-[11px] mt-1" style={{ color: colors.red }}>
                  Amount must be between {fmt(selectedProduct.minAmount)} and {fmt(selectedProduct.maxAmount)}
                </p>
              )}
            </div>

            {/* Purpose */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Purpose
              </label>
              <input
                type="text"
                value={form.purpose}
                onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                placeholder="e.g. Home renovation, Vehicle purchase"
                className="w-full h-11 rounded-xl px-4 text-[14px] outline-none mt-1.5"
                style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
              />
            </div>

            {/* Term */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Repayment Term
              </label>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {termOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, termMonths: t }))}
                    className="h-9 rounded-lg px-4 text-[13px] font-medium transition-all"
                    style={{
                      background: form.termMonths === t ? colors.blueBg : colors.bgHover,
                      border: form.termMonths === t ? `1px solid ${colors.blue}4D` : `1px solid ${colors.border}`,
                      color: form.termMonths === t ? colors.blue : colors.textSecondary,
                    }}
                  >
                    {t >= 12 ? `${t / 12}yr${t > 12 ? "s" : ""}` : `${t}mo`}
                  </button>
                ))}
              </div>
            </div>

            {/* Live calculator */}
            {parseFloat(form.amount) > 0 && (
              <div className="rounded-2xl p-4" style={{ background: colors.blueBg, border: `1px solid ${colors.blue}1F` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4" style={{ color: colors.blue }} />
                  <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.blue }}>Estimated Payment</p>
                </div>
                <div className="text-center mb-3">
                  <p className="text-[28px] font-bold tabular-nums" style={{ color: colors.textPrimary }}>{fmtExact(estMonthly)}</p>
                  <p className="text-[12px]" style={{ color: colors.textTertiary }}>per month (est.)</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[10px] uppercase" style={{ color: colors.textTertiary }}>Total Repayment</p>
                    <p className="text-[13px] font-semibold mt-0.5" style={{ color: colors.textPrimary }}>{fmtExact(estTotal)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase" style={{ color: colors.textTertiary }}>Est. Interest</p>
                    <p className="text-[13px] font-semibold mt-0.5" style={{ color: colors.yellow || "#F59E0B" }}>{fmtExact(Math.max(0, estInterest))}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase" style={{ color: colors.textTertiary }}>Est. Rate</p>
                    <p className="text-[13px] font-semibold mt-0.5" style={{ color: colors.textPrimary }}>{estRate.toFixed(1)}% APR</p>
                  </div>
                </div>
                <p className="text-[10px] text-center mt-3" style={{ color: colors.textMuted }}>
                  Final rate is determined upon approval. Range: {selectedProduct.minRate}–{selectedProduct.maxRate}%
                </p>
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              disabled={!form.amount || !form.purpose || parseFloat(form.amount) < selectedProduct.minAmount || parseFloat(form.amount) > selectedProduct.maxAmount}
              className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: form.amount && form.purpose ? colors.blue : colors.bgHover,
                opacity: form.amount && form.purpose ? 1 : 0.5,
              }}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  STEP 3 — Income & Employment                                */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>Financial Information</h3>
              <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>
                This helps us assess your application faster
              </p>
            </div>

            {/* Employment status */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Employment Status
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {EMPLOYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((f) => ({ ...f, employmentStatus: opt.value }))}
                    className="h-10 rounded-xl text-[13px] font-medium transition-all"
                    style={{
                      background: form.employmentStatus === opt.value ? colors.blueBg : colors.bgHover,
                      border: form.employmentStatus === opt.value ? `1px solid ${colors.blue}4D` : `1px solid ${colors.border}`,
                      color: form.employmentStatus === opt.value ? colors.blue : colors.textSecondary,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Employer */}
            {(form.employmentStatus === "employed" || form.employmentStatus === "self_employed") && (
              <div>
                <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                  {form.employmentStatus === "self_employed" ? "Business Name" : "Employer"}
                </label>
                <input
                  type="text"
                  value={form.employer}
                  onChange={(e) => setForm((f) => ({ ...f, employer: e.target.value }))}
                  placeholder={form.employmentStatus === "self_employed" ? "Your business name" : "Company name"}
                  className="w-full h-11 rounded-xl px-4 text-[14px] outline-none mt-1.5"
                  style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
              </div>
            )}

            {/* Monthly income */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Monthly Income (USD)
              </label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.textMuted }} />
                <input
                  type="number"
                  value={form.monthlyIncome}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyIncome: e.target.value }))}
                  placeholder="e.g. 5000"
                  className="w-full h-11 rounded-xl px-4 pl-9 text-[14px] outline-none"
                  style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!form.employmentStatus}
              className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: form.employmentStatus ? colors.blue : colors.bgHover,
                opacity: form.employmentStatus ? 1 : 0.5,
              }}
            >
              Review Application <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  STEP 4 — Review                                             */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {step === 4 && selectedProduct && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>Review Your Application</h3>
              <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>
                Please confirm the details below
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
              {/* Loan type header */}
              {(() => {
                const Icon = LOAN_TYPE_ICONS[form.loanType] || Landmark
                const typeColors = LOAN_TYPE_COLORS[form.loanType] || LOAN_TYPE_COLORS.personal
                return (
                  <div className="p-4 flex items-center gap-3" style={{ background: typeColors.bg }}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.12)" }}>
                      <Icon className="h-5 w-5" style={{ color: typeColors.color }} />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>{selectedProduct.label}</p>
                      <p className="text-[12px]" style={{ color: colors.textSecondary }}>{selectedProduct.minRate}–{selectedProduct.maxRate}% APR</p>
                    </div>
                  </div>
                )
              })()}

              <div className="divide-y" style={{ borderColor: colors.border }}>
                <ReviewRow label="Amount" value={fmt(parseFloat(form.amount) || 0)} colors={colors} />
                <ReviewRow label="Term" value={`${form.termMonths} months`} colors={colors} />
                <ReviewRow label="Purpose" value={form.purpose} colors={colors} />
                <ReviewRow label="Est. Monthly Payment" value={fmtExact(estMonthly)} highlight colors={colors} />
                <ReviewRow label="Est. Total Repayment" value={fmtExact(estTotal)} colors={colors} />
                <ReviewRow label="Est. Interest" value={fmtExact(Math.max(0, estInterest))} colors={colors} />
                {form.employmentStatus && (
                  <ReviewRow label="Employment" value={EMPLOYMENT_OPTIONS.find((o) => o.value === form.employmentStatus)?.label || form.employmentStatus} colors={colors} />
                )}
                {form.employer && <ReviewRow label="Employer" value={form.employer} colors={colors} />}
                {form.monthlyIncome && <ReviewRow label="Monthly Income" value={fmt(parseFloat(form.monthlyIncome))} colors={colors} />}
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: colors.yellowBg || "rgba(245,158,11,0.06)", border: `1px solid ${colors.yellow || "#F59E0B"}1A` }}>
              <p className="text-[11px]" style={{ color: colors.textSecondary }}>
                By submitting this application you agree to the terms and conditions. The final interest rate and approval are subject to review. Estimated payments are based on the midpoint rate and may change.
              </p>
            </div>

            {error && (
              <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: colors.redBg, border: `1px solid ${colors.red}26` }}>
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.red }} />
                <p className="text-[13px]" style={{ color: colors.red }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={applying}
              className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: colors.blue, opacity: applying ? 0.6 : 1 }}
            >
              {applying ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  STEP 5 — Success                                            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div className="py-10 text-center">
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: colors.greenBg }}
            >
              <CheckCircle2 className="h-10 w-10" style={{ color: colors.green }} />
            </div>
            <h3 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>Application Submitted</h3>
            <p className="text-[14px] mt-2 max-w-[320px] mx-auto" style={{ color: colors.textSecondary }}>
              Your loan application is under review. You will be notified once a decision is made.
            </p>
            {successId && (
              <p className="text-[12px] mt-3 font-mono" style={{ color: colors.textMuted }}>
                Ref: {successId.slice(-8).toUpperCase()}
              </p>
            )}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => { setView("list"); fetchLoans() }}
                className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
                style={{ background: colors.blue }}
              >
                Back to Loans
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface CardColors {
  bgElevated: string
  bgHover: string
  border: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  textMuted: string
  green: string
  greenBg: string
  blue: string
  blueBg: string
  red: string
  redBg: string
  yellow?: string
  yellowBg?: string
  isDark: boolean
}

function ActiveLoanCard({ loan, onTap, colors, fmt }: { loan: LoanData; onTap: () => void; colors: CardColors; fmt: (n: number) => string }) {
  const paidPct = loan.amount > 0 ? Math.min((loan.totalPaid / loan.amount) * 100, 100) : 0
  const TypeIcon = LOAN_TYPE_ICONS[loan.loanType] || Landmark
  const tc = LOAN_TYPE_COLORS[loan.loanType] || LOAN_TYPE_COLORS.personal

  return (
    <button
      onClick={onTap}
      className="w-full text-left rounded-2xl p-5 transition-all active:scale-[0.99]"
      style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: tc.bg }}>
            <TypeIcon className="h-[16px] w-[16px]" style={{ color: tc.color }} />
          </div>
          <div>
            <p className="text-[14px] font-medium" style={{ color: colors.textPrimary }}>{loan.purpose}</p>
            <p className="text-[12px]" style={{ color: colors.textTertiary }}>{loan.termMonths} months · {loan.loanType}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: colors.greenBg, color: colors.green }}>
            Active
          </span>
          <ChevronRight className="h-4 w-4" style={{ color: colors.textMuted }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-[10px] uppercase" style={{ color: colors.textTertiary }}>Total</p>
          <p className="text-[16px] font-bold tabular-nums mt-0.5" style={{ color: colors.textPrimary }}>{fmt(loan.amount)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase" style={{ color: colors.textTertiary }}>Paid</p>
          <p className="text-[16px] font-bold tabular-nums mt-0.5" style={{ color: colors.green }}>{fmt(loan.totalPaid)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase" style={{ color: colors.textTertiary }}>Remaining</p>
          <p className="text-[16px] font-bold tabular-nums mt-0.5" style={{ color: colors.textPrimary }}>{fmt(loan.outstandingBalance)}</p>
        </div>
      </div>

      <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.border }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${paidPct}%`, background: colors.green }} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[11px] tabular-nums" style={{ color: colors.textTertiary }}>{paidPct.toFixed(1)}% repaid</p>
        {loan.nextPaymentDate && (
          <p className="text-[11px]" style={{ color: colors.textTertiary }}>
            Next: {new Date(loan.nextPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>

      {loan.interestRate && loan.interestRate > 0 && (
        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${colors.border}` }}>
          <span className="text-[12px]" style={{ color: colors.textTertiary }}>Interest rate</span>
          <span className="text-[12px] font-semibold" style={{ color: colors.textPrimary }}>{loan.interestRate}% APR</span>
        </div>
      )}
    </button>
  )
}

interface RowColors {
  textPrimary: string
  textTertiary: string
  textMuted: string
  blue: string
}

function ReviewRow({ label, value, highlight, colors }: { label: string; value: string; highlight?: boolean; colors: RowColors }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[13px]" style={{ color: colors.textTertiary }}>{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: highlight ? colors.blue : colors.textPrimary }}>
        {value}
      </span>
    </div>
  )
}

function LimitRow({ label, value, colors }: { label: string; value: string; colors: RowColors }) {
  return (
    <div>
      <p className="text-[10px] uppercase" style={{ color: colors.textMuted }}>{label}</p>
      <p className="text-[13px] font-semibold mt-0.5" style={{ color: colors.textPrimary }}>{value}</p>
    </div>
  )
}
