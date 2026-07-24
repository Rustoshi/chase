"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Receipt, Plus, Clock, Search, CheckCircle2, XCircle,
  AlertCircle, Banknote, FileText, Download,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"

// ── Types ────────────────────────────────────────────────────────────────────

interface TaxDocument {
  name:    string
  docType: string
  taxYear: number
}

interface RefundData {
  _id:                  string
  taxYear:              number
  filingType:           string
  totalReportedIncome:  number
  totalTaxWithheld:     number
  refundAmount:         number
  ssnLast4:             string
  employer:             string | null
  status:               string
  referenceNumber:      string
  documents:            TaxDocument[]
  filingDate:           string
  estimatedDepositDate: string | null
  actualDepositDate:    string | null
  adminNote:            string | null
  rejectedReason:       string | null
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending:      { icon: Clock,        color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: "PENDING" },
  under_review: { icon: Search,       color: "#3B9EFF", bg: "rgba(59,158,255,0.12)", label: "UNDER REVIEW" },
  approved:     { icon: CheckCircle2, color: "#00C896", bg: "rgba(0,200,150,0.12)",  label: "APPROVED" },
  deposited:    { icon: Banknote,     color: "#00C896", bg: "rgba(0,200,150,0.12)",  label: "DEPOSITED" },
  rejected:     { icon: XCircle,      color: "#EF4444", bg: "rgba(239,68,68,0.12)",  label: "REJECTED" },
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TaxRefundsPage() {
  const router = useRouter()
  const colors = useThemeColors()
  const { formatAmount } = useCurrency()
  const fmt = (n: number) => formatAmount(n)
  const [refunds, setRefunds] = useState<RefundData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const fetchRefunds = useCallback(async () => {
    try {
      const res = await fetch("/api/user/tax-refunds")
      if (res.ok) {
        const data = await res.json()
        setRefunds(data.refunds)
        // Auto-select most recent year
        if (data.refunds.length > 0 && !selectedYear) {
          const years = [...new Set(data.refunds.map((r: RefundData) => r.taxYear))] as number[]
          setSelectedYear(Math.max(...years))
        }
      }
    } catch { /* */ }
    setLoading(false)
  }, [selectedYear])

  useEffect(() => { fetchRefunds() }, [fetchRefunds])

  // Available years from user's filed refunds
  const availableYears = useMemo(() => {
    const years = [...new Set(refunds.map((r) => r.taxYear))] as number[]
    return years.sort((a, b) => b - a)
  }, [refunds])

  // Refund for selected year
  const activeRefund = useMemo(() => {
    if (!selectedYear) return null
    return refunds.find((r) => r.taxYear === selectedYear) || null
  }, [refunds, selectedYear])

  const cfg = STATUS_CFG[activeRefund?.status || "pending"] || STATUS_CFG.pending
  const StatusIcon = cfg.icon

  return (
    <>
      <UserHeader
        title="Tax Refunds"
        showBack
        rightElement={
          <button
            onClick={() => router.push("/app/tax-refunds/file")}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: colors.blueBg }}
          >
            <Plus className="h-4 w-4" style={{ color: colors.blue }} />
          </button>
        }
      />

      <div className="px-4 py-5 lg:px-6 space-y-5 max-w-[800px] mx-auto">
        {loading ? (
          <div className="space-y-4">
            <div className="h-12 rounded-xl" style={{ background: colors.bgElevated }} />
            <div className="h-48 rounded-2xl" style={{ background: colors.bgElevated }} />
            <div className="h-40 rounded-2xl" style={{ background: colors.bgElevated }} />
          </div>
        ) : refunds.length === 0 ? (
          /* ── Empty state ──────────────────────────────────────────── */
          <div className="py-20 text-center">
            <div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: colors.blueBg }}
            >
              <Receipt className="h-9 w-9" style={{ color: colors.blue }} />
            </div>
            <p className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>No tax refunds filed</p>
            <p className="mt-1 text-[14px]" style={{ color: colors.textTertiary }}>
              File your tax refund claim to get started
            </p>
            <button
              onClick={() => router.push("/app/tax-refunds/file")}
              className="mt-5 h-11 rounded-xl px-6 text-[14px] font-semibold text-white transition-all active:scale-[0.97]"
              style={{ background: colors.blue }}
            >
              File a Tax Refund
            </button>
          </div>
        ) : (
          <>
            {/* ── Year Tabs ─────────────────────────────────────────── */}
            <div className="flex gap-2 flex-wrap">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className="h-9 rounded-lg px-5 text-[13px] font-semibold transition-all"
                  style={{
                    background: selectedYear === year ? colors.blueBg : colors.bgHover,
                    border: selectedYear === year ? `1px solid ${colors.blue}4D` : `1px solid ${colors.border}`,
                    color: selectedYear === year ? colors.blue : colors.textSecondary,
                  }}
                >
                  {year}
                </button>
              ))}
            </div>

            {activeRefund ? (
              <>
                {/* ── Status Card ──────────────────────────────────── */}
                <button
                  onClick={() => router.push(`/app/tax-refunds/${activeRefund._id}`)}
                  className="w-full text-center rounded-2xl p-6 transition-all active:scale-[0.99]"
                  style={{ background: colors.bgElevated, border: `1px solid ${cfg.color}20` }}
                >
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: cfg.bg }}>
                    <StatusIcon className="h-7 w-7" style={{ color: cfg.color }} />
                  </div>
                  <p className="text-[13px] font-bold tracking-wider" style={{ color: cfg.color }}>
                    {cfg.label}
                  </p>
                  <p className="text-[34px] font-bold tabular-nums mt-2" style={{ color: colors.textPrimary }}>
                    {fmt(activeRefund.refundAmount)}
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>
                    Estimated refund for tax year {activeRefund.taxYear}
                  </p>
                </button>

                {/* ── Tax Summary ──────────────────────────────────── */}
                <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
                  <div className="px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                      Tax Summary
                    </p>
                  </div>
                  <div className="divide-y" style={{ borderColor: colors.border }}>
                    <SummaryRow label="Total reported income" value={fmt(activeRefund.totalReportedIncome)} colors={colors} />
                    <SummaryRow label="Total tax withheld" value={fmt(activeRefund.totalTaxWithheld)} colors={colors} />
                    <SummaryRow label="Eligible refund" value={fmt(activeRefund.refundAmount)} highlight colors={colors} />
                    <SummaryRow
                      label="Filed date"
                      value={new Date(activeRefund.filingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      valueColor={colors.blue}
                      colors={colors}
                    />
                  </div>
                </div>

                {/* ── Tax Documents ─────────────────────────────────── */}
                {activeRefund.documents.length > 0 && (
                  <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
                    <div className="px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                        Tax Documents
                      </p>
                    </div>
                    <div className="divide-y" style={{ borderColor: colors.border }}>
                      {activeRefund.documents.map((doc, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: colors.blueBg }}>
                            <FileText className="h-4 w-4" style={{ color: colors.blue }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium" style={{ color: colors.textPrimary }}>{doc.name}</p>
                            <p className="text-[11px]" style={{ color: colors.textMuted }}>{doc.docType}</p>
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: colors.bgHover }}>
                            <Download className="h-3.5 w-3.5" style={{ color: colors.textMuted }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Rejection / Admin Note ────────────────────────── */}
                {activeRefund.status === "rejected" && activeRefund.rejectedReason && (
                  <div className="rounded-2xl p-4" style={{ background: colors.redBg, border: `1px solid ${colors.red}1A` }}>
                    <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: colors.red }}>Reason for Rejection</p>
                    <p className="text-[13px]" style={{ color: colors.textSecondary }}>{activeRefund.rejectedReason}</p>
                  </div>
                )}

                {activeRefund.adminNote && activeRefund.status !== "rejected" && (
                  <div className="rounded-2xl p-4" style={{ background: colors.yellowBg || "rgba(245,158,11,0.06)", border: `1px solid ${colors.yellow || "#F59E0B"}1A` }}>
                    <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: colors.yellow || "#F59E0B" }}>Note from Admin</p>
                    <p className="text-[13px]" style={{ color: colors.textSecondary }}>{activeRefund.adminNote}</p>
                  </div>
                )}

                {/* ── Disclaimer ────────────────────────────────────── */}
                <div className="rounded-2xl p-4" style={{ background: colors.redBg, border: `1px solid ${colors.red}14` }}>
                  <p className="text-[12px]" style={{ color: colors.textSecondary }}>
                    <span className="font-semibold" style={{ color: colors.red }}>Disclaimer:</span>{" "}
                    Tax refund estimates are based on available transaction data and may not reflect your actual tax obligation. Consult a qualified tax professional for accurate tax advice.
                  </p>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[14px]" style={{ color: colors.textTertiary }}>No refund found for this year</p>
              </div>
            )}

            {/* ── File new button ───────────────────────────────────── */}
            <button
              onClick={() => router.push("/app/tax-refunds/file")}
              className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: colors.blue }}
            >
              <Plus className="h-4 w-4" /> File a new refund
            </button>
          </>
        )}
      </div>
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface RowColors {
  textPrimary: string
  textSecondary: string
  green: string
}

function SummaryRow({ label, value, highlight, valueColor, colors }: { label: string; value: string; highlight?: boolean; valueColor?: string; colors: RowColors }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-[13px]" style={{ color: colors.textSecondary }}>{label}</span>
      <span className="text-[14px] font-semibold tabular-nums" style={{ color: highlight ? colors.green : valueColor || colors.textPrimary }}>{value}</span>
    </div>
  )
}
