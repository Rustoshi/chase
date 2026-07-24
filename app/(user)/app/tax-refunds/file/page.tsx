"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Receipt, CheckCircle2, AlertCircle, Shield, ArrowRight,
  DollarSign, Building, Calendar,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"

// ── Types ────────────────────────────────────────────────────────────────────

interface AccountOption {
  _id:           string
  accountNumber: string
  accountType:   string
  currency:      string
}

interface Eligibility {
  eligible:       boolean
  reasons:        string[]
  eligibleYears:  number[]
  availableYears: number[]
  filedYears:     number[]
  maxAmount:      number
  processingDays: number
  accounts:       AccountOption[]
  userInfo:       { firstName: string; lastName: string; hasAddress: boolean }
}

type Step = 1 | 2 | 3 | 4 | 5

const FILING_TYPES = [
  { value: "individual", label: "Individual", desc: "Filing as an individual taxpayer" },
  { value: "joint",      label: "Joint",      desc: "Filing jointly with a spouse" },
  { value: "business",   label: "Business",   desc: "Filing for a business entity" },
]

// ── Main Component ─────────────────────────────────────────────────────────────

export default function FileTaxRefundPage() {
  const router = useRouter()
  const colors = useThemeColors()
  const { formatAmount, symbol: currencySymbol } = useCurrency()
  const fmt = (n: number) => formatAmount(n)
  const fmtShort = (n: number) => formatAmount(n)

  const [step, setStep] = useState<Step>(1)
  const [elig, setElig] = useState<Eligibility | null>(null)
  const [eligLoading, setEligLoading] = useState(true)
  const [form, setForm] = useState({
    taxYear:              0,
    filingType:           "",
    totalReportedIncome:  "",
    totalTaxWithheld:     "",
    employer:             "",
    ssnLast4:             "",
    depositAccountId:     "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successRef, setSuccessRef] = useState("")

  const fetchElig = useCallback(async () => {
    setEligLoading(true)
    try {
      const res = await fetch("/api/user/tax-refunds/eligibility")
      if (res.ok) setElig(await res.json())
    } catch { /* */ }
    setEligLoading(false)
  }, [])

  useEffect(() => { fetchElig() }, [fetchElig])

  // Auto-select first account
  useEffect(() => {
    if (elig && elig.accounts.length > 0 && !form.depositAccountId) {
      setForm((f) => ({ ...f, depositAccountId: elig.accounts[0]._id }))
    }
  }, [elig, form.depositAccountId])

  // Computed refund amount
  const income = parseFloat(form.totalReportedIncome) || 0
  const withheld = parseFloat(form.totalTaxWithheld) || 0
  const estimatedTax = income * 0.2 // simplified ~20% effective rate
  const refundAmount = Math.max(0, withheld - estimatedTax)

  async function handleSubmit() {
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/user/tax-refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxYear:             form.taxYear,
          filingType:          form.filingType,
          totalReportedIncome: income,
          totalTaxWithheld:    withheld,
          refundAmount:        Math.round(refundAmount * 100) / 100,
          ssnLast4:            form.ssnLast4,
          employer:            form.employer || undefined,
          depositAccountId:    form.depositAccountId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to submit"); setSubmitting(false); return }
      setSuccessRef(data.refund.referenceNumber)
      setStep(5)
    } catch {
      setError("Network error")
    }
    setSubmitting(false)
  }

  const canProceedStep1 = form.taxYear > 0 && form.filingType
  const canProceedStep2 = income > 0 && withheld > 0 && form.ssnLast4.length === 4
  const canProceedStep3 = form.depositAccountId
  const selectedAccount = elig?.accounts.find((a) => a._id === form.depositAccountId)

  return (
    <>
      <UserHeader
        title={step === 5 ? "Refund Filed" : "File Tax Refund"}
        showBack
        onBack={() => {
          if (step === 5 || step === 1) { router.push("/app/tax-refunds"); return }
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
        {/* ── Loading ──────────────────────────────────────────────── */}
        {eligLoading && step === 1 && (
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${colors.blue}4D`, borderTopColor: "transparent" }} />
            <p className="text-[13px] mt-3" style={{ color: colors.textTertiary }}>Checking eligibility...</p>
          </div>
        )}

        {/* ── Not eligible ─────────────────────────────────────────── */}
        {!eligLoading && elig && !elig.eligible && step === 1 && (
          <div className="py-10">
            <div className="rounded-2xl p-5" style={{ background: colors.redBg, border: `1px solid ${colors.red}1F` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: colors.redBg }}>
                  <Shield className="h-5 w-5" style={{ color: colors.red }} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>Not Eligible</p>
                  <p className="text-[12px]" style={{ color: colors.textTertiary }}>Please resolve the following before filing</p>
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
              onClick={() => router.push("/app/tax-refunds")}
              className="w-full h-12 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] mt-5"
              style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
            >
              Back to Tax Refunds
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/*  STEP 1 — Tax Year & Filing Type                         */}
        {/* ══════════════════════════════════════════════════════════ */}
        {!eligLoading && elig?.eligible && step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>Tax Year & Filing Type</h3>
              <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>
                Select the tax year and how you filed
              </p>
            </div>

            {/* Year selection */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Tax Year
              </label>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {elig.availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setForm((f) => ({ ...f, taxYear: year }))}
                    className="h-11 rounded-xl px-5 text-[14px] font-semibold transition-all flex items-center gap-2"
                    style={{
                      background: form.taxYear === year ? colors.blueBg : colors.bgHover,
                      border: form.taxYear === year ? `1px solid ${colors.blue}4D` : `1px solid ${colors.border}`,
                      color: form.taxYear === year ? colors.blue : colors.textSecondary,
                    }}
                  >
                    <Calendar className="h-3.5 w-3.5" /> {year}
                  </button>
                ))}
              </div>
              {elig.filedYears.length > 0 && (
                <p className="text-[11px] mt-2" style={{ color: colors.textMuted }}>
                  Already filed: {elig.filedYears.join(", ")}
                </p>
              )}
            </div>

            {/* Filing type */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Filing Type
              </label>
              <div className="space-y-2 mt-1.5">
                {FILING_TYPES.map((ft) => {
                  const selected = form.filingType === ft.value
                  return (
                    <button
                      key={ft.value}
                      onClick={() => setForm((f) => ({ ...f, filingType: ft.value }))}
                      className="w-full text-left rounded-xl p-4 transition-all"
                      style={{
                        background: selected ? colors.blueBg : colors.bgElevated,
                        border: selected ? `1.5px solid ${colors.blue}4D` : `1px solid ${colors.border}`,
                      }}
                    >
                      <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>{ft.label}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: colors.textTertiary }}>{ft.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: canProceedStep1 ? colors.blue : colors.bgHover,
                opacity: canProceedStep1 ? 1 : 0.5,
              }}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/*  STEP 2 — Income & Tax Information                        */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 2 && elig && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>Income & Tax Information</h3>
              <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>
                Enter your tax year income and withholding details
              </p>
            </div>

            {/* Total reported income */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Total Reported Income
              </label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.textMuted }} />
                <input
                  type="number"
                  value={form.totalReportedIncome}
                  onChange={(e) => setForm((f) => ({ ...f, totalReportedIncome: e.target.value }))}
                  placeholder="e.g. 85000"
                  className="w-full h-12 rounded-xl pl-9 pr-4 text-[15px] outline-none transition-all"
                  style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                  min="1"
                  step="0.01"
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>
                Gross income from all sources (W-2, 1099, etc.)
              </p>
            </div>

            {/* Total tax withheld */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Total Tax Withheld
              </label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.textMuted }} />
                <input
                  type="number"
                  value={form.totalTaxWithheld}
                  onChange={(e) => setForm((f) => ({ ...f, totalTaxWithheld: e.target.value }))}
                  placeholder="e.g. 17000"
                  className="w-full h-12 rounded-xl pl-9 pr-4 text-[15px] outline-none transition-all"
                  style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                  min="1"
                  step="0.01"
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>
                Total federal tax withheld from your pay stubs / 1099s
              </p>
            </div>

            {/* Employer */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Employer / Income Source <span className="normal-case" style={{ color: colors.textMuted }}>(optional)</span>
              </label>
              <input
                type="text"
                value={form.employer}
                onChange={(e) => setForm((f) => ({ ...f, employer: e.target.value }))}
                placeholder="e.g. Acme Corp"
                className="w-full h-12 rounded-xl px-4 mt-1.5 text-[15px] outline-none transition-all"
                style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
              />
            </div>

            {/* SSN Last 4 */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Last 4 Digits of SSN
              </label>
              <input
                type="text"
                value={form.ssnLast4}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4)
                  setForm((f) => ({ ...f, ssnLast4: v }))
                }}
                placeholder="e.g. 1234"
                className="w-full h-12 rounded-xl px-4 mt-1.5 text-[15px] outline-none transition-all"
                style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                maxLength={4}
                inputMode="numeric"
              />
              <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>
                Used for identity verification — stored securely
              </p>
            </div>

            {/* Live refund estimate */}
            {income > 0 && withheld > 0 && (
              <div className="rounded-2xl p-4" style={{ background: colors.greenBg, border: `1px solid ${colors.green}1F` }}>
                <p className="text-[12px] font-semibold uppercase tracking-wide mb-3" style={{ color: colors.green }}>Estimated Refund</p>
                <div className="text-center mb-3">
                  <p className="text-[28px] font-bold tabular-nums" style={{ color: refundAmount > 0 ? colors.green : colors.red }}>
                    {refundAmount > 0 ? fmt(refundAmount) : `${currencySymbol}0.00`}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                    {refundAmount > 0 ? "You may be eligible for a refund" : "No refund — tax withheld does not exceed estimated liability"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[11px]" style={{ color: colors.textTertiary }}>Reported income</span>
                    <span className="text-[11px] tabular-nums" style={{ color: colors.textPrimary }}>{fmt(income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px]" style={{ color: colors.textTertiary }}>Est. tax liability (~20%)</span>
                    <span className="text-[11px] tabular-nums" style={{ color: colors.textPrimary }}>{fmt(estimatedTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px]" style={{ color: colors.textTertiary }}>Tax withheld</span>
                    <span className="text-[11px] tabular-nums" style={{ color: colors.textPrimary }}>{fmt(withheld)}</span>
                  </div>
                </div>
                <p className="text-[9px] text-center mt-2" style={{ color: colors.textMuted }}>
                  Estimate only — actual refund determined upon admin review
                </p>
              </div>
            )}

            {withheld > income && income > 0 && (
              <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: colors.redBg, border: `1px solid ${colors.red}26` }}>
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.red }} />
                <p className="text-[12px]" style={{ color: colors.red }}>Tax withheld cannot exceed reported income</p>
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2 || withheld > income || refundAmount <= 0}
              className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: canProceedStep2 && refundAmount > 0 ? colors.blue : colors.bgHover,
                opacity: canProceedStep2 && refundAmount > 0 ? 1 : 0.5,
              }}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/*  STEP 3 — Deposit Account & Confirm Identity              */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 3 && elig && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>Deposit Account & Identity</h3>
              <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>
                Choose where to receive your refund and verify your identity
              </p>
            </div>

            {/* Deposit account */}
            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Deposit Refund Into
              </label>
              <div className="space-y-2 mt-1.5">
                {elig.accounts.map((acc) => {
                  const selected = form.depositAccountId === acc._id
                  return (
                    <button
                      key={acc._id}
                      onClick={() => setForm((f) => ({ ...f, depositAccountId: acc._id }))}
                      className="w-full text-left rounded-xl p-3 flex items-center gap-3 transition-all"
                      style={{
                        background: selected ? colors.blueBg : colors.bgHover,
                        border: selected ? `1.5px solid ${colors.blue}4D` : `1px solid ${colors.border}`,
                      }}
                    >
                      <Building className="h-4 w-4" style={{ color: selected ? colors.blue : colors.textMuted }} />
                      <div>
                        <p className="text-[13px] font-medium capitalize" style={{ color: colors.textPrimary }}>{acc.accountType} Account</p>
                        <p className="text-[11px]" style={{ color: colors.textTertiary }}>
                          ····{acc.accountNumber.slice(-4)} · {acc.currency}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Identity confirmation */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
              <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>Identity on File</p>
              <ReviewRow label="Full Name" value={`${elig.userInfo.firstName} ${elig.userInfo.lastName}`} colors={colors} />
              <ReviewRow label="SSN (last 4)" value={`····${form.ssnLast4}`} colors={colors} />
              <ReviewRow label="Address" value={elig.userInfo.hasAddress ? "Verified" : "Not provided"} colors={colors} />
              {form.employer && <ReviewRow label="Employer" value={form.employer} colors={colors} />}
            </div>

            <div className="rounded-xl p-3" style={{ background: colors.yellowBg, border: `1px solid ${colors.yellow}1A` }}>
              <p className="text-[12px]" style={{ color: colors.yellow }}>
                Ensure your name and SSN match exactly as they appear on your federal tax return. Mismatches may delay processing.
              </p>
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!canProceedStep3}
              className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: canProceedStep3 ? colors.blue : colors.bgHover,
                opacity: canProceedStep3 ? 1 : 0.5,
              }}
            >
              Review & Submit <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/*  STEP 4 — Review & Submit                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 4 && elig && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>Review Your Filing</h3>
              <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>
                Please review all details before submitting
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>Filing Summary</p>
              </div>
              <div className="divide-y" style={{ borderColor: colors.border }}>
                <ReviewRow2 label="Tax Year" value={String(form.taxYear)} colors={colors} />
                <ReviewRow2 label="Filing Type" value={FILING_TYPES.find((f) => f.value === form.filingType)?.label || form.filingType} colors={colors} />
                <ReviewRow2 label="Total Reported Income" value={fmt(income)} colors={colors} />
                <ReviewRow2 label="Total Tax Withheld" value={fmt(withheld)} colors={colors} />
                <ReviewRow2 label="Eligible Refund" value={fmt(refundAmount)} highlight colors={colors} />
                {form.employer && <ReviewRow2 label="Employer" value={form.employer} colors={colors} />}
                <ReviewRow2 label="SSN (last 4)" value={`····${form.ssnLast4}`} colors={colors} />
                <ReviewRow2 label="Deposit Account" value={selectedAccount ? `${selectedAccount.accountType} ····${selectedAccount.accountNumber.slice(-4)}` : "—"} colors={colors} />
                <ReviewRow2 label="Est. Processing" value={`~${elig.processingDays} business days`} colors={colors} />
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: colors.bgHover, border: `1px solid ${colors.border}` }}>
              <p className="text-[11px]" style={{ color: colors.textMuted }}>
                By submitting, I declare under penalty of perjury that the information provided is true, correct, and complete to the best of my knowledge.
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
              disabled={submitting}
              className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: colors.green, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Submitting..." : "Submit Tax Refund Claim"}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/*  STEP 5 — Success                                        */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div className="py-12 text-center">
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: colors.greenBg }}
            >
              <CheckCircle2 className="h-10 w-10" style={{ color: colors.green }} />
            </div>
            <h3 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>Refund Claim Filed</h3>
            <p className="text-[14px] mt-2" style={{ color: colors.textSecondary }}>
              Your tax refund claim has been submitted successfully
            </p>

            <div className="rounded-2xl p-4 mt-6 text-left" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
              <ReviewRow label="Reference" value={successRef} colors={colors} />
              <ReviewRow label="Tax Year" value={String(form.taxYear)} colors={colors} />
              <ReviewRow label="Reported Income" value={fmt(income)} colors={colors} />
              <ReviewRow label="Tax Withheld" value={fmt(withheld)} colors={colors} />
              <ReviewRow label="Eligible Refund" value={fmt(refundAmount)} colors={colors} />
              <ReviewRow label="Est. Processing" value={`~${elig?.processingDays || 21} business days`} colors={colors} />
            </div>

            <p className="text-[12px] mt-4" style={{ color: colors.textMuted }}>
              You can track the status of your refund anytime from your Tax Refunds page.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => router.push("/app/tax-refunds")}
                className="flex-1 h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
                style={{ background: colors.blue }}
              >
                View My Refunds
              </button>
              <button
                onClick={() => router.push("/app/dashboard")}
                className="flex-1 h-12 rounded-xl text-[15px] font-semibold transition-all"
                style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
              >
                Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface RowColors {
  textTertiary: string
  textPrimary: string
  green: string
}

function ReviewRow({ label, value, colors }: { label: string; value: string; colors: RowColors }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[12px]" style={{ color: colors.textTertiary }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: colors.textPrimary }}>{value}</span>
    </div>
  )
}

function ReviewRow2({ label, value, highlight, colors }: { label: string; value: string; highlight?: boolean; colors: RowColors }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[13px]" style={{ color: colors.textTertiary }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: highlight ? colors.green : colors.textPrimary }}>{value}</span>
    </div>
  )
}
