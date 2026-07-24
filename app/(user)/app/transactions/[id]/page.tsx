"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Clock, XCircle,
  Copy, Check, ArrowLeft, Building2, User, CreditCard, Calendar,
  FileText, Hash, ArrowRightLeft, Download, Share2,
} from "lucide-react"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"

interface PartyDetails {
  name?: string
  email?: string
  accountNumber?: string
  bankName?: string
  routingNumber?: string
  swiftCode?: string
  iban?: string
  country?: string
}

interface TxDetail {
  _id:           string
  type:          string
  status:        string
  amount:        number
  currency:      string
  description:   string | null
  reference:     string | null
  feeAmount:     number
  feePercent:    number | null
  balanceBefore: number | null
  balanceAfter:  number | null
  transferType:  string | null
  exchangeRate:  number | null
  convertedAmount: number | null
  convertedCurrency: string | null
  btcRateAtTime: number | null
  sender:        PartyDetails | null
  receiver:      PartyDetails | null
  externalRecipient: PartyDetails | null
  metadata:      Record<string, unknown> | null
  createdAt:     string
  processedAt:   string
  account:       { _id: string; walletType: string; currency: string; accountNumber: string } | null
  bankName:      string
  isCredit:      boolean
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  completed:  { icon: CheckCircle2, color: "#00C896", bg: "rgba(0,200,150,0.15)", label: "Completed" },
  pending:    { icon: Clock,        color: "#F59E0B", bg: "rgba(245,158,11,0.15)", label: "Pending" },
  processing: { icon: Clock,        color: "#3B9EFF", bg: "rgba(59,158,255,0.15)", label: "Processing" },
  failed:     { icon: XCircle,      color: "#EF4444", bg: "rgba(239,68,68,0.15)",  label: "Failed" },
  reversed:   { icon: XCircle,      color: "#94A3B8", bg: "rgba(148,163,184,0.15)", label: "Reversed" },
}

export default function TransactionReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const colors = useThemeColors()
  const { symbol: currencySymbol, formatAmount } = useCurrency()
  const [tx, setTx] = useState<TxDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/user/transactions/${id}`)
        if (res.ok) {
          const data = await res.json()
          setTx(data.transaction)
        }
      } catch { /* */ }
      setLoading(false)
    }
    load()
  }, [id])

  const copyText = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch { /* */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh", background: colors.bgBase }}>
        <div className="h-10 w-10 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: colors.border, borderTopColor: colors.blue }} />
      </div>
    )
  }

  if (!tx) {
    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: "100vh", background: colors.bgBase }}>
        <FileText className="h-12 w-12" style={{ color: colors.textMuted }} />
        <p style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 600 }}>Transaction not found</p>
        <button onClick={() => router.back()} style={{ color: colors.blue, fontSize: 14, fontWeight: 500 }}>← Go back</button>
      </div>
    )
  }

  const st = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending
  const StIcon = st.icon
  const isBtc = tx.currency === "BTC"
  const divisor = isBtc ? 1e8 : 100
  const frac = isBtc ? 8 : 2
  const sym = isBtc ? "₿" : currencySymbol

  const fmtAmt = (n: number) => isBtc 
    ? `${sym}${(n / divisor).toLocaleString("en-US", { minimumFractionDigits: frac, maximumFractionDigits: frac })}`
    : formatAmount(n / divisor)
  const displayAmount = fmtAmt(tx.amount)

  return (
    <div style={{ background: colors.bgBase, minHeight: "100vh" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3" style={{ background: colors.bgBase, borderBottom: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full transition-colors" style={{ background: colors.bgElevated }}>
            <ArrowLeft className="h-4 w-4" style={{ color: colors.textPrimary }} />
          </button>
          <p style={{ fontSize: 17, fontWeight: 600, color: colors.textPrimary }}>Transaction Receipt</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: colors.bgElevated }}>
            <Share2 className="h-4 w-4" style={{ color: colors.textSecondary }} />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: colors.bgElevated }}>
            <Download className="h-4 w-4" style={{ color: colors.textSecondary }} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-[520px] mx-auto space-y-4" style={{ paddingBottom: 100 }}>
        
        {/* ═══ RECEIPT HEADER ═══ */}
        <div className="text-center py-5 rounded-2xl" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
          {/* Bank Logo/Name */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: colors.blue }}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>{tx.bankName}</span>
          </div>

          {/* Amount */}
          <div className="mb-3">
            <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.textTertiary, marginBottom: 4 }}>
              {tx.isCredit ? "Amount Received" : "Amount Sent"}
            </p>
            <p style={{ fontSize: 40, fontWeight: 700, color: tx.isCredit ? colors.green : colors.red }} className="tabular-nums">
              {tx.isCredit ? "+" : "−"}{displayAmount}
            </p>
            <p style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{tx.currency}</p>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ background: st.bg }}>
            <StIcon className="h-4 w-4" style={{ color: st.color }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: st.color }}>{st.label}</span>
          </div>
        </div>

        {/* ═══ SENDER & RECEIVER ═══ */}
        <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
          {/* From */}
          <div className="p-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: tx.isCredit ? "rgba(0,200,150,0.12)" : "rgba(59,158,255,0.12)" }}>
                <User className="h-4 w-4" style={{ color: tx.isCredit ? colors.green : colors.blue }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: colors.textTertiary }}>From</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, marginBottom: 2 }}>{tx.sender?.name || "—"}</p>
            {tx.sender?.bankName && <p style={{ fontSize: 13, color: colors.textSecondary }}>{tx.sender.bankName}</p>}
            {tx.sender?.accountNumber && (
              <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, fontFamily: "monospace" }}>
                Account: ····{tx.sender.accountNumber.slice(-4)}
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center py-2" style={{ background: colors.bgBase }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
              <ArrowRightLeft className="h-4 w-4" style={{ color: colors.textMuted }} />
            </div>
          </div>

          {/* To */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: tx.isCredit ? "rgba(59,158,255,0.12)" : "rgba(239,68,68,0.12)" }}>
                <User className="h-4 w-4" style={{ color: tx.isCredit ? colors.blue : colors.red }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: colors.textTertiary }}>To</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, marginBottom: 2 }}>{tx.receiver?.name || "—"}</p>
            {tx.receiver?.bankName && <p style={{ fontSize: 13, color: colors.textSecondary }}>{tx.receiver.bankName}</p>}
            {tx.receiver?.accountNumber && (
              <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, fontFamily: "monospace" }}>
                Account: ····{tx.receiver.accountNumber.slice(-4)}
              </p>
            )}
          </div>
        </div>

        {/* ═══ TRANSACTION DETAILS ═══ */}
        <div className="rounded-2xl p-4" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4" style={{ color: colors.textMuted }} />
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: colors.textTertiary }}>Transaction Details</span>
          </div>

          <div className="space-y-0">
            {tx.description && <DetailRow label="Description" value={tx.description} colors={colors} />}
            <DetailRow label="Type" value={tx.isCredit ? "Credit" : "Debit"} colors={colors} />
            <DetailRow label="Date" value={format(new Date(tx.createdAt), "MMMM d, yyyy")} colors={colors} />
            <DetailRow label="Time" value={format(new Date(tx.createdAt), "h:mm:ss a")} colors={colors} />
            {tx.transferType && (
              <DetailRow 
                label="Transfer Type" 
                value={tx.transferType === "international" ? "International" : tx.transferType === "local_external" ? "Domestic" : "Internal"} 
                colors={colors} 
              />
            )}
            {tx.feeAmount > 0 && <DetailRow label="Fee" value={fmtAmt(tx.feeAmount)} colors={colors} />}
            {tx.balanceBefore != null && <DetailRow label="Balance Before" value={fmtAmt(tx.balanceBefore)} colors={colors} />}
            {tx.balanceAfter != null && <DetailRow label="Balance After" value={fmtAmt(tx.balanceAfter)} colors={colors} />}
            {tx.exchangeRate && <DetailRow label="Exchange Rate" value={tx.exchangeRate.toFixed(6)} colors={colors} />}
            {tx.btcRateAtTime && <DetailRow label="BTC Rate" value={formatAmount(tx.btcRateAtTime)} colors={colors} />}
            {tx.account && <DetailRow label="Account" value={`····${tx.account.accountNumber.slice(-4)}`} colors={colors} noBorder />}
          </div>
        </div>

        {/* ═══ REFERENCE & ID ═══ */}
        <div className="rounded-2xl p-4" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-4 w-4" style={{ color: colors.textMuted }} />
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: colors.textTertiary }}>Reference Information</span>
          </div>

          {tx.reference && (
            <div className="mb-4">
              <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>Reference Number</p>
              <div className="flex items-center gap-2">
                <code style={{ fontSize: 13, color: colors.textPrimary, fontFamily: "monospace", flex: 1 }}>{tx.reference}</code>
                <button onClick={() => copyText(tx.reference!, "ref")} className="flex-shrink-0 p-1.5 rounded-lg transition-colors" style={{ background: colors.bgBase }}>
                  {copiedField === "ref" ? <Check className="h-4 w-4" style={{ color: colors.green }} /> : <Copy className="h-4 w-4" style={{ color: colors.textMuted }} />}
                </button>
              </div>
            </div>
          )}

          <div>
            <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>Transaction ID</p>
            <div className="flex items-center gap-2">
              <code style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "monospace", flex: 1, wordBreak: "break-all" }}>{tx._id}</code>
              <button onClick={() => copyText(tx._id, "txid")} className="flex-shrink-0 p-1.5 rounded-lg transition-colors" style={{ background: colors.bgBase }}>
                {copiedField === "txid" ? <Check className="h-4 w-4" style={{ color: colors.green }} /> : <Copy className="h-4 w-4" style={{ color: colors.textMuted }} />}
              </button>
            </div>
          </div>
        </div>

        {/* ═══ TIMESTAMP FOOTER ═══ */}
        <div className="text-center py-4">
          <p style={{ fontSize: 11, color: colors.textMuted }}>
            Processed on {format(new Date(tx.processedAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
          <p style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>
            This is an electronic receipt from {tx.bankName}
          </p>
        </div>

      </div>
    </div>
  )
}

interface DetailRowProps {
  label: string
  value: string
  noBorder?: boolean
  colors: ReturnType<typeof useThemeColors>
}

function DetailRow({ label, value, noBorder, colors }: DetailRowProps) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={noBorder ? {} : { borderBottom: `1px solid ${colors.border}` }}
    >
      <span style={{ fontSize: 13, color: colors.textTertiary }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: colors.textPrimary }} className="text-right max-w-[55%]">{value}</span>
    </div>
  )
}
