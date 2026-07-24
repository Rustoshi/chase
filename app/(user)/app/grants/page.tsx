"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  DollarSign, Clock, CheckCircle2, XCircle, Search, Banknote,
  Plus, AlertCircle, FileText, ArrowRight,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"

interface Grant {
  _id:             string
  grantType:       string
  grantTypeLabel:  string
  amount:          number
  approvedAmount:  number | null
  purpose:         string
  status:          string
  referenceNumber: string
  adminNote:       string | null
  rejectedReason:  string | null
  appliedAt:       string
  disbursedAt:     string | null
}

const STATUS_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending:      { icon: Clock,        color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: "Pending" },
  under_review: { icon: Search,       color: "#3B9EFF", bg: "rgba(59,158,255,0.12)", label: "Under Review" },
  approved:     { icon: CheckCircle2, color: "#00C896", bg: "rgba(0,200,150,0.12)",  label: "Approved" },
  rejected:     { icon: XCircle,      color: "#EF4444", bg: "rgba(239,68,68,0.12)",  label: "Rejected" },
  disbursed:    { icon: Banknote,     color: "#00C896", bg: "rgba(0,200,150,0.12)",  label: "Disbursed" },
}

export default function GrantsPage() {
  const router = useRouter()
  const colors = useThemeColors()
  const { formatAmount } = useCurrency()
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGrants = useCallback(async () => {
    try {
      const res = await fetch("/api/user/grants")
      if (res.ok) {
        const data = await res.json()
        setGrants(data.grants)
      }
    } catch { /* */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchGrants() }, [fetchGrants])

  const active = grants.filter((g) => ["pending", "under_review", "approved"].includes(g.status))
  const history = grants.filter((g) => ["disbursed", "rejected"].includes(g.status))

  return (
    <>
      <UserHeader title="Grants" showBack />

      <div className="px-4 py-5 lg:px-6 space-y-5 max-w-[600px] mx-auto">
        {loading ? (
          <div className="space-y-3">
            <div className="h-20 rounded-2xl" style={{ background: colors.bgElevated }} />
            <div className="h-32 rounded-2xl" style={{ background: colors.bgElevated }} />
          </div>
        ) : (
          <>
            {/* Apply button */}
            <button
              onClick={() => router.push("/app/grants/apply")}
              className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: colors.green }}
            >
              <Plus className="h-4 w-4" /> Apply for Grant
            </button>

            {/* Empty state */}
            {grants.length === 0 && (
              <div className="rounded-2xl p-8 text-center" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: colors.greenBg }}>
                  <DollarSign className="h-7 w-7" style={{ color: colors.green }} />
                </div>
                <p className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>No Grant Applications</p>
                <p className="mt-1 text-[14px]" style={{ color: colors.textTertiary }}>
                  Apply for financial assistance by tapping the button above.
                </p>
              </div>
            )}

            {/* Active applications */}
            {active.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide mb-3" style={{ color: colors.textTertiary }}>
                  Active Applications
                </p>
                <div className="space-y-3">
                  {active.map((g) => {
                    const cfg = STATUS_CFG[g.status] || STATUS_CFG.pending
                    const StIcon = cfg.icon
                    return (
                      <div
                        key={g._id}
                        onClick={() => router.push(`/app/grants/${g._id}`)}
                        className="rounded-2xl p-4 cursor-pointer transition-all active:scale-[0.99]"
                        style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: cfg.bg }}>
                              <StIcon className="h-5 w-5" style={{ color: cfg.color }} />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>{g.grantTypeLabel} Grant</p>
                              <p className="text-[11px]" style={{ color: colors.textMuted }}>{g.referenceNumber}</p>
                            </div>
                          </div>
                          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[20px] font-bold tabular-nums" style={{ color: colors.textPrimary }}>{formatAmount(g.amount)}</p>
                          <ArrowRight className="h-4 w-4" style={{ color: colors.textMuted }} />
                        </div>
                        <p className="text-[12px] mt-1 line-clamp-1" style={{ color: colors.textMuted }}>{g.purpose}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide mb-3" style={{ color: colors.textTertiary }}>
                  History
                </p>
                <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
                  <div className="divide-y" style={{ borderColor: colors.border }}>
                    {history.map((g) => {
                      const cfg = STATUS_CFG[g.status] || STATUS_CFG.pending
                      return (
                        <div
                          key={g._id}
                          onClick={() => router.push(`/app/grants/${g._id}`)}
                          className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: cfg.bg }}>
                            <DollarSign className="h-4 w-4" style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium" style={{ color: colors.textPrimary }}>{g.grantTypeLabel} Grant</p>
                            <p className="text-[11px]" style={{ color: colors.textMuted }}>
                              {new Date(g.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-semibold tabular-nums" style={{ color: g.status === "disbursed" ? colors.green : colors.textSecondary }}>
                              {formatAmount(g.approvedAmount || g.amount)}
                            </p>
                            <p className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="rounded-xl p-4" style={{ background: colors.blueBg, border: `1px solid ${colors.blue}14` }}>
              <p className="text-[12px] leading-relaxed" style={{ color: colors.textSecondary }}>
                <span className="font-semibold" style={{ color: colors.blue }}>Note:</span>{" "}
                Grant applications are reviewed within 3-5 business days. Approved funds are disbursed directly to your selected account.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
