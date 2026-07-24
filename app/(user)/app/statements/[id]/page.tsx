"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  FileText, Download, Calendar, Building, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, Clock, Mail, Printer, Share2, Copy, Check,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"
import { BANK_NAME } from "@/lib/brand"

// ── Types ────────────────────────────────────────────────────────────────────

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

interface StatementTransaction {
  date: string
  description: string
  reference: string
  type: string
  debit: number | null
  credit: number | null
  balance: number
}

interface StatementDownloadData {
  bankName: string
  statement: {
    referenceNumber: string
    startDate: string
    endDate: string
    generatedAt: string
    openingBalance: number
    closingBalance: number
    totalCredits: number
    totalDebits: number
    transactionCount: number
  }
  account: {
    accountNumber: string
    accountType: string
    currency: string
    routingNumber?: string
    swiftCode?: string
  }
  user: {
    firstName: string
    lastName: string
    email: string
    address?: {
      street?: string
      city?: string
      state?: string
      zip?: string
      country?: string
    }
  }
  transactions: StatementTransaction[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateLong(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

// ── PDF Generation ───────────────────────────────────────────────────────────

function generateStatementHTML(data: StatementDownloadData, fmtCents: (n: number) => string): string {
  const { bankName, statement, account, user, transactions } = data

  const userAddress = user.address
    ? [user.address.street, user.address.city, user.address.state, user.address.zip, user.address.country]
        .filter(Boolean)
        .join(", ")
    : "Address not provided"

  const transactionRows = transactions
    .map(
      (tx) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${formatDate(tx.date)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${tx.description}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">${tx.reference}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: right; color: #dc2626;">${tx.debit ? fmtCents(tx.debit) : ""}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: right; color: #16a34a;">${tx.credit ? fmtCents(tx.credit) : ""}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: right; font-weight: 500;">${fmtCents(tx.balance)}</td>
      </tr>
    `
    )
    .join("")

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bank Statement - ${statement.referenceNumber}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; color: #1f2937; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #3b82f6; }
    .bank-name { font-size: 24px; font-weight: 700; color: #1e40af; }
    .statement-title { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .ref-number { font-size: 12px; color: #6b7280; text-align: right; }
    .ref-value { font-size: 14px; font-weight: 600; color: #1f2937; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-box { padding: 16px; background: #f9fafb; border-radius: 8px; }
    .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px; }
    .info-value { font-size: 14px; font-weight: 500; color: #1f2937; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .summary-box { padding: 16px; background: #f0f9ff; border-radius: 8px; text-align: center; }
    .summary-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
    .summary-value { font-size: 18px; font-weight: 600; color: #1e40af; }
    .summary-value.credit { color: #16a34a; }
    .summary-value.debit { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { padding: 12px; background: #1e40af; color: white; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
    th:nth-child(4), th:nth-child(5), th:nth-child(6) { text-align: right; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="bank-name">${bankName}</div>
      <div class="statement-title">Account Statement</div>
    </div>
    <div class="ref-number">
      <div>Reference Number</div>
      <div class="ref-value">${statement.referenceNumber}</div>
      <div style="margin-top: 8px;">Generated: ${formatDateLong(statement.generatedAt)}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">Account Holder</div>
      <div class="info-value">${user.firstName} ${user.lastName}</div>
      <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${userAddress}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Account Details</div>
      <div class="info-value">${account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} Account</div>
      <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
        Account: ····${account.accountNumber.slice(-4)}<br>
        Currency: ${account.currency}
        ${account.routingNumber ? `<br>Routing: ${account.routingNumber}` : ""}
      </div>
    </div>
  </div>

  <div class="info-box" style="margin-bottom: 24px;">
    <div class="info-label">Statement Period</div>
    <div class="info-value">${formatDateLong(statement.startDate)} — ${formatDateLong(statement.endDate)}</div>
  </div>

  <div class="summary-grid">
    <div class="summary-box">
      <div class="summary-label">Opening Balance</div>
      <div class="summary-value">${fmtCents(statement.openingBalance)}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Total Credits</div>
      <div class="summary-value credit">${fmtCents(statement.totalCredits)}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Total Debits</div>
      <div class="summary-value debit">${fmtCents(statement.totalDebits)}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Closing Balance</div>
      <div class="summary-value">${fmtCents(statement.closingBalance)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Reference</th>
        <th>Debit</th>
        <th>Credit</th>
        <th>Balance</th>
      </tr>
    </thead>
    <tbody>
      ${transactionRows || '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #6b7280;">No transactions in this period</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <p><strong>${bankName}</strong></p>
    <p>This is an official bank statement. For questions, please contact customer support.</p>
    <p>Statement Reference: ${statement.referenceNumber}</p>
  </div>
</body>
</html>
  `
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function StatementDetailPage() {
  const router = useRouter()
  const params = useParams()
  const colors = useThemeColors()
  const { formatCents } = useCurrency()
  const printFrameRef = useRef<HTMLIFrameElement>(null)

  const [statement, setStatement] = useState<StatementSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const statementId = params.id as string

  // Fetch statement
  useEffect(() => {
    async function fetchStatement() {
      try {
        const res = await fetch(`/api/user/statements/${statementId}`)
        if (res.ok) {
          const data = await res.json()
          setStatement(data.statement)
        }
      } catch (err) {
        console.error("Failed to fetch statement:", err)
      } finally {
        setLoading(false)
      }
    }

    if (statementId) {
      fetchStatement()
    }
  }, [statementId])

  // Download/Print PDF
  const handleDownload = useCallback(async () => {
    if (!statementId) return

    setDownloading(true)
    try {
      const res = await fetch(`/api/user/statements/${statementId}?action=download`)
      if (!res.ok) throw new Error("Failed to fetch statement data")

      const data: StatementDownloadData = await res.json()
      const html = generateStatementHTML(data, formatCents)

      // Create blob and download
      const blob = new Blob([html], { type: "text/html" })
      const url = URL.createObjectURL(blob)

      // Open in new window for printing
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }

      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download failed:", err)
    } finally {
      setDownloading(false)
    }
  }, [statementId, formatCents])

  // Copy reference
  const handleCopyRef = useCallback(() => {
    if (statement?.referenceNumber) {
      navigator.clipboard.writeText(statement.referenceNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [statement])

  if (loading) {
    return (
      <>
        <UserHeader title="Statement Details" showBack />
        <div className="px-4 py-20 text-center">
          <div className="mx-auto h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${colors.blue}4D`, borderTopColor: "transparent" }} />
          <p className="text-[13px] mt-3" style={{ color: colors.textTertiary }}>Loading statement...</p>
        </div>
      </>
    )
  }

  if (!statement) {
    return (
      <>
        <UserHeader title="Statement Details" showBack />
        <div className="px-4 py-20 text-center">
          <p className="text-[16px] font-semibold" style={{ color: colors.textPrimary }}>Statement Not Found</p>
          <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>This statement may have been deleted or expired.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <UserHeader title="Statement Details" showBack />

      <div className="px-4 lg:px-6 py-5 max-w-[800px] mx-auto space-y-5">
        {/* Header Card */}
        <div className="rounded-2xl p-5" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: colors.blueBg }}>
              <FileText className="h-7 w-7" style={{ color: colors.blue }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold" style={{ color: colors.textPrimary }}>
                  {statement.currency} Account Statement
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{
                  background: statement.status === "ready" ? colors.greenBg : colors.yellowBg,
                  color: statement.status === "ready" ? colors.green : colors.yellow,
                }}>
                  {statement.status === "ready" ? "Ready" : statement.status}
                </span>
              </div>
              <p className="text-[13px] mt-1" style={{ color: colors.textMuted }}>
                {formatDate(statement.startDate)} — {formatDate(statement.endDate)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[12px] font-mono" style={{ color: colors.textTertiary }}>
                  {statement.referenceNumber}
                </span>
                <button onClick={handleCopyRef} className="p-1 rounded" style={{ color: colors.textMuted }}>
                  {copied ? <Check className="h-3.5 w-3.5" style={{ color: colors.green }} /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Opening Balance</p>
            <p className="text-[20px] font-bold mt-1" style={{ color: colors.textPrimary }}>
              {formatCents(statement.openingBalance)}
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Closing Balance</p>
            <p className="text-[20px] font-bold mt-1" style={{ color: colors.textPrimary }}>
              {formatCents(statement.closingBalance)}
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: colors.greenBg, border: `1px solid ${colors.green}1A` }}>
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4" style={{ color: colors.green }} />
              <p className="text-[11px] uppercase tracking-wide" style={{ color: colors.green }}>Total Credits</p>
            </div>
            <p className="text-[18px] font-bold mt-1" style={{ color: colors.green }}>
              {formatCents(statement.totalCredits)}
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: colors.redBg, border: `1px solid ${colors.red}1A` }}>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" style={{ color: colors.red }} />
              <p className="text-[11px] uppercase tracking-wide" style={{ color: colors.red }}>Total Debits</p>
            </div>
            <p className="text-[18px] font-bold mt-1" style={{ color: colors.red }}>
              {formatCents(statement.totalDebits)}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
              Statement Details
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: colors.border }}>
            <DetailRow label="Account" value={`····${statement.accountNumber.slice(-4)}`} colors={colors} />
            <DetailRow label="Account Type" value={statement.accountType} colors={colors} />
            <DetailRow label="Transactions" value={`${statement.transactionCount} transactions`} colors={colors} />
            <DetailRow label="Requested" value={formatDate(statement.requestedAt)} colors={colors} />
            {statement.generatedAt && <DetailRow label="Generated" value={formatDate(statement.generatedAt)} colors={colors} />}
            {statement.expiresAt && <DetailRow label="Expires" value={formatDate(statement.expiresAt)} colors={colors} />}
            <DetailRow label="Downloads" value={String(statement.downloadCount)} colors={colors} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading || statement.status !== "ready"}
            className="flex-1 h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: colors.blue, opacity: downloading ? 0.6 : 1 }}
          >
            {downloading ? (
              <>Preparing...</>
            ) : (
              <>
                <Printer className="h-4 w-4" /> Print / Download
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="rounded-xl p-4" style={{ background: colors.bgHover }}>
          <p className="text-[12px]" style={{ color: colors.textMuted }}>
            This statement is an official document from {BANK_NAME}. The reference number can be used for verification purposes.
            Statements expire 30 days after generation.
          </p>
        </div>
      </div>

      {/* Hidden iframe for printing */}
      <iframe ref={printFrameRef} style={{ display: "none" }} title="Print Frame" />
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({ label, value, colors }: { label: string; value: string; colors: { textTertiary: string; textPrimary: string } }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[13px]" style={{ color: colors.textTertiary }}>{label}</span>
      <span className="text-[13px] font-medium capitalize" style={{ color: colors.textPrimary }}>{value}</span>
    </div>
  )
}
