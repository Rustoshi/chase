"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  FileText, Calendar, Download, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Plus, Building, ArrowDownToLine,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"

// ── Types ────────────────────────────────────────────────────────────────────

interface Account {
  _id: string
  accountNumber: string
  walletType: string
  currency: string
  balance: number
}

interface StatementSummary {
  _id: string
  referenceNumber: string
  accountNumber: string
  accountType: string
  currency: string
  startDate: string
  endDate: string
  format: string
  status: string
  openingBalance: number
  closingBalance: number
  totalCredits: number
  totalDebits: number
  transactionCount: number
  requestedAt: string
  generatedAt?: string
  expiresAt?: string
  downloadCount: number
}

// ── Date Presets ─────────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last 3 Months", days: 90 },
  { label: "Last 6 Months", days: 180 },
  { label: "Year to Date", days: -1 }, // Special: YTD
  { label: "Custom Range", days: 0 },
]

function getPresetDates(days: number): { start: Date; end: Date } {
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  if (days === -1) {
    // Year to date
    const start = new Date(end.getFullYear(), 0, 1)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }

  const start = new Date()
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatCurrency(amount: number, currency = "USD"): string {
  return (amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  })
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function StatementsPage() {
  const router = useRouter()
  const colors = useThemeColors()

  // State
  const [view, setView] = useState<"list" | "request">("list")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [statements, setStatements] = useState<StatementSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Request form state
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [accountsRes, statementsRes] = await Promise.all([
        fetch("/api/user/statements?action=accounts"),
        fetch("/api/user/statements"),
      ])

      if (accountsRes.ok) {
        const data = await accountsRes.json()
        setAccounts(data.accounts || [])
        if (data.accounts?.length === 1) {
          setSelectedAccountId(data.accounts[0]._id)
        }
      }

      if (statementsRes.ok) {
        const data = await statementsRes.json()
        setStatements(data.statements || [])
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle request submission
  async function handleSubmit() {
    if (!selectedAccountId) {
      setError("Please select an account")
      return
    }

    let startDate: Date
    let endDate: Date

    if (selectedPreset === 4) {
      // Custom range
      if (!customStartDate || !customEndDate) {
        setError("Please select both start and end dates")
        return
      }
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
      endDate.setHours(23, 59, 59, 999)
    } else {
      const preset = DATE_PRESETS[selectedPreset]
      const dates = getPresetDates(preset.days)
      startDate = dates.start
      endDate = dates.end
    }

    if (startDate > endDate) {
      setError("Start date must be before end date")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/user/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          format: "pdf",
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to request statement")

      // Refresh and show list
      await fetchData()
      setView("list")
      setSelectedPreset(0)
      setCustomStartDate("")
      setCustomEndDate("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request statement")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedAccount = accounts.find((a) => a._id === selectedAccountId)

  return (
    <>
      <UserHeader title="Bank Statements" showBack />

      <div className="px-4 lg:px-6 py-5 max-w-[800px] mx-auto space-y-5">
        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setView("list")}
            className="flex-1 h-11 rounded-xl text-[14px] font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: view === "list" ? colors.blue : colors.bgHover,
              color: view === "list" ? "#fff" : colors.textSecondary,
              border: view === "list" ? "none" : `1px solid ${colors.border}`,
            }}
          >
            <FileText className="h-4 w-4" /> My Statements
          </button>
          <button
            onClick={() => setView("request")}
            className="flex-1 h-11 rounded-xl text-[14px] font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: view === "request" ? colors.green : colors.bgHover,
              color: view === "request" ? "#fff" : colors.textSecondary,
              border: view === "request" ? "none" : `1px solid ${colors.border}`,
            }}
          >
            <Plus className="h-4 w-4" /> Request New
          </button>
        </div>

        {/* ═══ REQUEST VIEW ═══ */}
        {view === "request" && (
          <div className="space-y-5">
            <div className="rounded-2xl p-5" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Request Bank Statement
              </h3>

              {/* Account Selection */}
              <div className="mb-4">
                <label className="text-[12px] font-medium uppercase tracking-wide block mb-2" style={{ color: colors.textTertiary }}>
                  Select Account
                </label>
                <div className="space-y-2">
                  {accounts.map((acc) => {
                    const selected = selectedAccountId === acc._id
                    return (
                      <button
                        key={acc._id}
                        onClick={() => setSelectedAccountId(acc._id)}
                        className="w-full text-left rounded-xl p-3 flex items-center gap-3 transition-all"
                        style={{
                          background: selected ? colors.blueBg : colors.bgHover,
                          border: selected ? `1.5px solid ${colors.blue}4D` : `1px solid ${colors.border}`,
                        }}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: selected ? colors.blueBg : colors.bgHover }}>
                          <Building className="h-5 w-5" style={{ color: selected ? colors.blue : colors.textMuted }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[14px] font-medium" style={{ color: colors.textPrimary }}>
                            {acc.currency} Account
                          </p>
                          <p className="text-[12px]" style={{ color: colors.textMuted }}>
                            ····{acc.accountNumber.slice(-4)}
                          </p>
                        </div>
                        {selected && <CheckCircle2 className="h-5 w-5" style={{ color: colors.blue }} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="mb-4">
                <label className="text-[12px] font-medium uppercase tracking-wide block mb-2" style={{ color: colors.textTertiary }}>
                  Statement Period
                </label>
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((preset, idx) => {
                    const selected = selectedPreset === idx
                    return (
                      <button
                        key={preset.label}
                        onClick={() => setSelectedPreset(idx)}
                        className="h-9 px-4 rounded-lg text-[13px] font-medium transition-all"
                        style={{
                          background: selected ? colors.blueBg : colors.bgHover,
                          border: selected ? `1px solid ${colors.blue}4D` : `1px solid ${colors.border}`,
                          color: selected ? colors.blue : colors.textSecondary,
                        }}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Date Inputs */}
              {selectedPreset === 4 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[11px] font-medium block mb-1" style={{ color: colors.textMuted }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full h-11 rounded-xl px-3 text-[14px] outline-none"
                      style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium block mb-1" style={{ color: colors.textMuted }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full h-11 rounded-xl px-3 text-[14px] outline-none"
                      style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                    />
                  </div>
                </div>
              )}

              {/* Preview */}
              {selectedAccount && selectedPreset !== 4 && (
                <div className="rounded-xl p-3 mb-4" style={{ background: colors.bgHover }}>
                  <p className="text-[12px]" style={{ color: colors.textMuted }}>
                    Statement for <span style={{ color: colors.textPrimary }}>{selectedAccount.currency} ····{selectedAccount.accountNumber.slice(-4)}</span>
                  </p>
                  <p className="text-[13px] font-medium mt-1" style={{ color: colors.textPrimary }}>
                    {formatDate(getPresetDates(DATE_PRESETS[selectedPreset].days).start)} — {formatDate(getPresetDates(DATE_PRESETS[selectedPreset].days).end)}
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl p-3 mb-4 flex items-start gap-2" style={{ background: colors.redBg, border: `1px solid ${colors.red}26` }}>
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.red }} />
                  <p className="text-[13px]" style={{ color: colors.red }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedAccountId}
                className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: selectedAccountId ? colors.green : colors.bgHover,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Generating..." : "Generate Statement"}
              </button>
            </div>

            {/* Info */}
            <div className="rounded-xl p-4" style={{ background: colors.blueBg, border: `1px solid ${colors.blue}1A` }}>
              <p className="text-[13px]" style={{ color: colors.blue }}>
                Statements are generated instantly and available for download as PDF. They include all completed transactions within the selected period.
              </p>
            </div>
          </div>
        )}

        {/* ═══ LIST VIEW ═══ */}
        {view === "list" && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-16 text-center">
                <div className="mx-auto h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${colors.blue}4D`, borderTopColor: "transparent" }} />
                <p className="text-[13px] mt-3" style={{ color: colors.textTertiary }}>Loading statements...</p>
              </div>
            ) : statements.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: colors.bgHover }}>
                  <FileText className="h-8 w-8" style={{ color: colors.textMuted }} />
                </div>
                <p className="text-[16px] font-semibold" style={{ color: colors.textPrimary }}>No Statements Yet</p>
                <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>
                  Request your first bank statement to get started
                </p>
                <button
                  onClick={() => setView("request")}
                  className="mt-4 h-10 px-5 rounded-xl text-[14px] font-semibold text-white transition-all"
                  style={{ background: colors.blue }}
                >
                  Request Statement
                </button>
              </div>
            ) : (
              <>
                <p className="text-[13px]" style={{ color: colors.textMuted }}>
                  {statements.length} statement{statements.length !== 1 ? "s" : ""} generated
                </p>

                {statements.map((stmt) => (
                  <button
                    key={stmt._id}
                    onClick={() => router.push(`/app/statements/${stmt._id}`)}
                    className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.99]"
                    style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: colors.blueBg }}>
                        <FileText className="h-5 w-5" style={{ color: colors.blue }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>
                            {stmt.currency} Account Statement
                          </p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{
                            background: stmt.status === "ready" ? colors.greenBg : colors.yellowBg,
                            color: stmt.status === "ready" ? colors.green : colors.yellow,
                          }}>
                            {stmt.status === "ready" ? "Ready" : stmt.status}
                          </span>
                        </div>
                        <p className="text-[12px] mt-0.5" style={{ color: colors.textMuted }}>
                          {formatDate(stmt.startDate)} — {formatDate(stmt.endDate)}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[11px]" style={{ color: colors.textTertiary }}>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDate(stmt.requestedAt)}
                          </span>
                          <span className="text-[11px]" style={{ color: colors.textTertiary }}>
                            {stmt.transactionCount} transactions
                          </span>
                          {stmt.downloadCount > 0 && (
                            <span className="text-[11px]" style={{ color: colors.textTertiary }}>
                              <Download className="h-3 w-3 inline mr-1" />
                              {stmt.downloadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0" style={{ color: colors.textMuted }} />
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
