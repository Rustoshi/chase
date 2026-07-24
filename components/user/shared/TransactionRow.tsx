"use client"

import { useRouter } from "next/navigation"
import {
  UtensilsCrossed, Car, ShoppingBag, RefreshCw, ArrowRightLeft,
  Download, Upload, DollarSign, Landmark, Receipt, Heart,
  Wifi, Tv,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { getMerchantCategory, type MerchantCategory } from "@/lib/utils/merchant-categories"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"

// ── Category → icon mapping with shadow colors ───────────────────────────────

const CATEGORY_ICONS: Record<MerchantCategory, { icon: React.ElementType; color: string; bg: string; shadow: string }> = {
  food:          { icon: UtensilsCrossed, color: "#D97706", bg: "rgba(217,119,6,0.12)",  shadow: "rgba(217,119,6,0.2)" },
  transport:     { icon: Car,             color: "#2563EB", bg: "rgba(37,99,235,0.12)",  shadow: "rgba(37,99,235,0.2)" },
  shopping:      { icon: ShoppingBag,     color: "#9333EA", bg: "rgba(147,51,234,0.12)", shadow: "rgba(147,51,234,0.2)" },
  subscriptions: { icon: RefreshCw,       color: "#0D9488", bg: "rgba(13,148,136,0.12)", shadow: "rgba(13,148,136,0.2)" },
  transfers:     { icon: ArrowRightLeft,  color: "#64748B", bg: "rgba(100,116,139,0.12)",shadow: "rgba(100,116,139,0.2)" },
  deposits:      { icon: Download,        color: "#16A34A", bg: "rgba(22,163,74,0.12)",  shadow: "rgba(22,163,74,0.2)" },
  withdrawals:   { icon: Upload,          color: "#EF4444", bg: "rgba(239,68,68,0.12)",  shadow: "rgba(239,68,68,0.2)" },
  bitcoin:       { icon: DollarSign,      color: "#EA580C", bg: "rgba(234,88,12,0.12)",  shadow: "rgba(234,88,12,0.2)" },
  loans:         { icon: Landmark,        color: "#4F46E5", bg: "rgba(79,70,229,0.12)",  shadow: "rgba(79,70,229,0.2)" },
  health:        { icon: Heart,           color: "#EC4899", bg: "rgba(236,72,153,0.12)", shadow: "rgba(236,72,153,0.2)" },
  utilities:     { icon: Wifi,            color: "#0891B2", bg: "rgba(8,145,178,0.12)",  shadow: "rgba(8,145,178,0.2)" },
  entertainment: { icon: Tv,              color: "#7C3AED", bg: "rgba(124,58,237,0.12)", shadow: "rgba(124,58,237,0.2)" },
  other:         { icon: Receipt,         color: "#6B7280", bg: "rgba(107,114,128,0.12)",shadow: "rgba(107,114,128,0.2)" },
}

// ── Transaction type ──────────────────────────────────────────────────────────

interface TransactionData {
  _id:          string
  type:         string
  amount:       number
  currency:     string
  status:       string
  description?: string
  createdAt:    string | Date
}

interface TransactionRowProps {
  transaction:  TransactionData
  showAccount?: boolean
  index?:       number
}

const CREDIT_TYPES = new Set([
  "deposit", "transfer_in", "admin_deposit", "swap_in", "refund", "loan_disbursement",
])

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending:    { bg: "rgba(247,144,9,0.12)",  text: "#F79009" },
  processing: { bg: "rgba(26,44,206,0.12)",  text: "#1A2CCE" },
  failed:     { bg: "rgba(240,68,56,0.12)",  text: "#F04438" },
  reversed:   { bg: "rgba(152,162,179,0.12)", text: "#667085" },
}

export function TransactionRow({ transaction, index }: TransactionRowProps) {
  const router   = useRouter()
  const colors   = useThemeColors()
  const { symbol: currencySymbol } = useCurrency()
  const cat      = getMerchantCategory(transaction.description, transaction.type)
  const catIcon  = CATEGORY_ICONS[cat]
  const Icon     = catIcon.icon
  const isCredit = CREDIT_TYPES.has(transaction.type)

  const isBtc = transaction.currency === "BTC"
  const divisor = isBtc ? 1e8 : 100
  const displayAmount = transaction.amount / divisor
  const formattedAmount = displayAmount.toLocaleString("en-US", {
    minimumFractionDigits: isBtc ? 8 : 2,
    maximumFractionDigits: isBtc ? 8 : 2,
  })

  const date = typeof transaction.createdAt === "string"
    ? new Date(transaction.createdAt)
    : transaction.createdAt

  const statusStyle = STATUS_STYLES[transaction.status]

  return (
    <button
      onClick={() => router.push(`/app/transactions/${transaction._id}`)}
      className="flex w-full items-center gap-3.5 px-5 py-3 text-left transition-colors active:scale-[0.99]"
      style={{
        minHeight: 64,
        animation: index !== undefined ? `txSlideIn 250ms ease-out both` : undefined,
        animationDelay: index !== undefined ? `${index * 40}ms` : undefined,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgHover }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      {/* Category icon */}
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: catIcon.bg,
          boxShadow: colors.isDark ? `0 2px 8px ${catIcon.shadow}` : "none",
        }}
      >
        <Icon className="h-[18px] w-[18px]" style={{ color: catIcon.color }} />
      </div>

      {/* Description + date */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium" style={{ color: colors.textPrimary }}>
          {transaction.description || transaction.type.replace(/_/g, " ")}
        </p>
        <div className="mt-0.5 flex items-center gap-1 text-[12px]" style={{ color: colors.textTertiary }}>
          <span>{format(date, "MMM d")}</span>
          {transaction.status !== "completed" && statusStyle && (
            <>
              <span style={{ color: colors.textMuted }}>·</span>
              <span
                className="rounded-full px-1.5 py-[1px] text-[10px] font-medium leading-none"
                style={{ background: statusStyle.bg, color: statusStyle.text }}
              >
                {transaction.status}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="flex-shrink-0">
        <span
          className="text-[15px] font-semibold tabular-nums"
          style={{ color: isCredit ? colors.green : colors.red }}
        >
          {isCredit ? "+" : "\u2212"}{isBtc ? "\u20BF" : currencySymbol}{formattedAmount}
        </span>
      </div>
    </button>
  )
}
