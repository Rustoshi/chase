"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ChevronLeft, Eye, EyeOff, Snowflake, Play, Lock, FileText,
  Trash2, Settings, CreditCard, Wifi, AlertTriangle, CheckCircle2,
  XCircle, DollarSign, Loader2, Copy, Check, ShoppingBag,
  ArrowDownLeft, ArrowUpRight, RefreshCw, MapPin,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"
import { CardBrandMark } from "@/components/CardBrandLogo"

// ── Types ────────────────────────────────────────────────────────────────────

interface CardData {
  id: string
  cardNetwork: string
  cardType: string
  status: string
  cardNumber: string | null
  cvv: string | null
  expiryMonth: number | null
  expiryYear: number | null
  cardholderName: string | null
  cardPin: string | null
  isVirtual: boolean
  creditLimit: number
  spendingLimit: number
  dailySpendLimit: number
  balance: number
  billingAddress: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  } | null
  deliveryStatus: string | null
  appliedAt: string
  approvedAt: string | null
  adminNote: string | null
}

interface UserData {
  name: string
  email: string
  phone: string | null
}

interface CardTransaction {
  id: string
  type: string
  amount: number
  currency: string
  status: string
  merchantName: string | null
  merchantCategory: string | null
  description: string
  reference: string
  createdAt: string
}

// ── SVG Logos ────────────────────────────────────────────────────────────────

// ── Transaction Icon ─────────────────────────────────────────────────────────

function TransactionIcon({ type, colors }: { type: string; colors: ReturnType<typeof useThemeColors> }) {
  switch (type) {
    case "purchase":
      return <ShoppingBag className="h-4 w-4" style={{ color: colors.textSecondary }} />
    case "payment":
      return <ArrowDownLeft className="h-4 w-4" style={{ color: colors.green }} />
    case "refund":
    case "cashback":
      return <RefreshCw className="h-4 w-4" style={{ color: colors.green }} />
    case "fee":
      return <AlertTriangle className="h-4 w-4" style={{ color: colors.amber }} />
    default:
      return <ArrowUpRight className="h-4 w-4" style={{ color: colors.textSecondary }} />
  }
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CardDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const colors = useThemeColors()
  const { symbol: currencySymbol, formatAmount } = useCurrency()
  const cardId = params.cardId as string

  const [card, setCard] = useState<CardData | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [accountBalance, setAccountBalance] = useState(0)
  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // UI State
  const [showCvv, setShowCvv] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Modals
  const [showPayModal, setShowPayModal] = useState(false)
  const [showLimitsModal, setShowLimitsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStatementModal, setShowStatementModal] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)

  // PIN state
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [pinError, setPinError] = useState("")

  // Payment state
  const [payAmount, setPayAmount] = useState("")
  const [payError, setPayError] = useState("")

  // Limits state
  const [newSpendingLimit, setNewSpendingLimit] = useState("")
  const [newDailyLimit, setNewDailyLimit] = useState("")

  const fetchCard = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/cards/${cardId}`)
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/app/cards")
          return
        }
        throw new Error("Failed to fetch card")
      }
      const data = await res.json()
      setCard(data.card)
      setUser(data.user)
      setAccountBalance(data.accountBalance)
      setNewSpendingLimit(String(data.card.spendingLimit || 0))
      setNewDailyLimit(String(data.card.dailySpendLimit || 0))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load card")
    } finally {
      setLoading(false)
    }
  }, [cardId, router])

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/cards/${cardId}/transactions?limit=10`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions)
      }
    } catch { /* ignore */ }
  }, [cardId])

  useEffect(() => {
    fetchCard()
    fetchTransactions()
  }, [fetchCard, fetchTransactions])

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleFreeze = async () => {
    if (!card) return
    setActionLoading("freeze")
    try {
      const action = card.status === "frozen" ? "unfreeze" : "freeze"
      const res = await fetch(`/api/user/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error("Action failed")
      const data = await res.json()
      setCard({ ...card, status: data.status })
      setSuccess(action === "freeze" ? "Card frozen" : "Card unfrozen")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handlePay = async () => {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0 || !card) {
      setPayError("Enter a valid amount")
      return
    }
    if (amount > card.balance) {
      setPayError(`Amount exceeds balance owed (${formatAmount(card.balance)})`)
      return
    }
    if (amount > accountBalance) {
      setPayError(`Insufficient account balance (${formatAmount(accountBalance)})`)
      return
    }

    setActionLoading("pay")
    setPayError("")
    try {
      const res = await fetch(`/api/user/cards/${cardId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Payment failed")
      
      setCard({ ...card, balance: data.newCardBalance })
      setAccountBalance(data.newAccountBalance)
      setShowPayModal(false)
      setPayAmount("")
      setSuccess(`Payment of ${formatAmount(amount)} successful`)
      setTimeout(() => setSuccess(""), 3000)
      fetchTransactions()
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateLimits = async () => {
    setActionLoading("limits")
    try {
      const res = await fetch(`/api/user/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_limits",
          spendingLimit: parseFloat(newSpendingLimit) || 0,
          dailySpendLimit: parseFloat(newDailyLimit) || 0,
        }),
      })
      if (!res.ok) throw new Error("Failed to update limits")
      const data = await res.json()
      if (card) {
        setCard({
          ...card,
          spendingLimit: data.spendingLimit,
          dailySpendLimit: data.dailySpendLimit,
        })
      }
      setShowLimitsModal(false)
      setSuccess("Limits updated")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update limits")
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangePin = async () => {
    if (!/^\d{4}$/.test(newPin)) {
      setPinError("PIN must be exactly 4 digits")
      return
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match")
      return
    }
    setActionLoading("pin")
    setPinError("")
    try {
      const res = await fetch(`/api/user/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_pin", newPin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update PIN")
      if (card) setCard({ ...card, cardPin: data.cardPin })
      setShowPinModal(false)
      setNewPin("")
      setConfirmPin("")
      setSuccess("Card PIN updated")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Failed to update PIN")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    setActionLoading("delete")
    try {
      const res = await fetch(`/api/user/cards/${cardId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete card")
      router.push("/app/cards")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete card")
      setShowDeleteModal(false)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: colors.bgBase }}>
        <UserHeader title="Card Details" showBack />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.blue }} />
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="min-h-screen" style={{ background: colors.bgBase }}>
        <UserHeader title="Card Details" showBack />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <XCircle className="h-12 w-12" style={{ color: colors.textTertiary }} />
          <p style={{ color: colors.textSecondary }}>Card not found</p>
          <button
            onClick={() => router.push("/app/cards")}
            className="text-[14px] font-medium"
            style={{ color: colors.blue }}
          >
            Back to Cards
          </button>
        </div>
      </div>
    )
  }

  const isCredit = card.cardType === "credit"
  const isFrozen = card.status === "frozen"
  const isBlocked = card.status === "blocked"
  const inDelivery = !card.isVirtual && card.status === "approved"
  const deliveryLabel = card.deliveryStatus === "shipped" ? "Shipped"
    : card.deliveryStatus === "delivered" ? "Delivered" : "Processing"
  const isVisa = card.cardNetwork === "visa"
  const isAmex = card.cardNetwork === "amex"

  return (
    <div className="min-h-screen pb-24" style={{ background: colors.bgBase }}>
      <UserHeader title="Card Details" showBack />

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Back button */}
        <button
          onClick={() => router.push("/app/cards")}
          className="flex items-center gap-1 text-[14px] font-medium mb-4"
          style={{ color: colors.blue }}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Cards
        </button>

        {/* Success/Error messages */}
        {success && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: colors.greenBg, border: `1px solid ${colors.green}33` }}>
            <CheckCircle2 className="h-4 w-4" style={{ color: colors.green }} />
            <p className="text-[13px]" style={{ color: colors.green }}>{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: colors.redBg, border: `1px solid ${colors.red}33` }}>
            <AlertTriangle className="h-4 w-4" style={{ color: colors.red }} />
            <p className="text-[13px]" style={{ color: colors.red }}>{error}</p>
          </div>
        )}

        {/* Physical card delivery banner */}
        {inDelivery && (
          <div className="mb-4 p-4 rounded-2xl" style={{ background: colors.blueBg, border: `1px solid ${colors.blue}26` }}>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" style={{ color: colors.blue }} />
              <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>Physical card — {deliveryLabel}</p>
            </div>
            <p className="text-[12px] mt-1" style={{ color: colors.textSecondary }}>
              Your card is on its way and arrives in 3–5 business days. It will activate automatically once delivered.
            </p>
            {card.billingAddress && (
              <p className="text-[12px] mt-2" style={{ color: colors.textTertiary }}>
                Delivering to: {[card.billingAddress.street, card.billingAddress.city, card.billingAddress.state, card.billingAddress.zip, card.billingAddress.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Card Visual */}
        <div
          className="relative overflow-hidden text-white rounded-2xl"
          style={{
            padding: "24px 20px 20px",
            minHeight: 200,
            background: isVisa
              ? "linear-gradient(135deg, #1a4a8a 0%, #0f3060 40%, #0a2040 100%)"
              : isAmex
                ? "linear-gradient(135deg, #006fcf 0%, #004b8d 40%, #002d5a 100%)"
                : "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
          }}
        >
          {/* Glow */}
          <div
            className="pointer-events-none absolute rounded-full"
            style={{
              width: 160, height: 160,
              top: -40, right: -40,
              background: isVisa ? "rgba(59,158,255,0.15)" : isAmex ? "rgba(0,111,207,0.2)" : "rgba(255,95,0,0.12)",
              filter: "blur(40px)",
            }}
          />

          {/* Top row */}
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.6)" }}>
                {card.isVirtual ? "VIRTUAL" : "PHYSICAL"} {isCredit ? "CREDIT" : "DEBIT"} CARD
              </p>
            </div>
            <Wifi className="h-5 w-5 rotate-90" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>

          {/* Card number */}
          <div className="relative mt-6 flex items-center gap-2">
            <p className="font-mono text-[18px] tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.9)" }}>
              {card.cardNumber || "•••• •••• •••• ••••"}
            </p>
            {card.cardNumber && (
              <button onClick={() => handleCopy(card.cardNumber!, "number")} className="p-1">
                {copied === "number" ? (
                  <Check className="h-4 w-4" style={{ color: "rgba(255,255,255,0.6)" }} />
                ) : (
                  <Copy className="h-4 w-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                )}
              </button>
            )}
          </div>

          {/* Details row */}
          <div className="relative mt-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Card Holder</p>
              <p className="text-[14px] font-medium mt-0.5">{card.cardholderName || "CARDHOLDER"}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>CVV</p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-[14px] font-medium font-mono">{showCvv ? (card.cvv || "•••") : "•••"}</p>
                <button onClick={() => setShowCvv(!showCvv)} className="p-0.5">
                  {showCvv ? <EyeOff className="h-3 w-3" style={{ color: "rgba(255,255,255,0.4)" }} /> : <Eye className="h-3 w-3" style={{ color: "rgba(255,255,255,0.4)" }} />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Expires</p>
              <p className="text-[14px] font-medium mt-0.5">
                {card.expiryMonth ? `${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}` : "••/••"}
              </p>
            </div>
          </div>

          {/* Brand logo */}
          <div className="relative mt-3 flex items-center justify-between">
            <CardBrandMark network={card.cardNetwork} className="h-7 w-auto" />
            <span className="text-[11px] font-medium capitalize" style={{ color: "rgba(255,255,255,0.5)" }}>
              {card.cardNetwork} {card.cardType}
            </span>
          </div>

          {/* Frozen overlay */}
          {isFrozen && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl" style={{ background: "rgba(0,0,0,0.6)" }}>
              <Snowflake className="h-10 w-10 mb-2" style={{ color: colors.blue }} />
              <p className="text-[14px] font-semibold">Card Frozen</p>
            </div>
          )}

          {/* Blocked overlay — admin-enforced, user cannot lift */}
          {isBlocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl px-6 text-center" style={{ background: "rgba(0,0,0,0.72)" }}>
              <Lock className="h-10 w-10 mb-2" style={{ color: colors.red }} />
              <p className="text-[14px] font-semibold">Card Blocked</p>
              <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>Contact support to restore this card</p>
            </div>
          )}
        </div>

        {/* Balance/Limit Info */}
        <div className="mt-4 p-4 rounded-xl" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
          <div className="flex justify-between">
            <div>
              <p className="text-[11px]" style={{ color: colors.textTertiary }}>
                {isCredit ? "Credit Limit" : "Daily Spend Limit"}
              </p>
              <p className="text-[18px] font-semibold mt-0.5" style={{ color: colors.textPrimary }}>
                {currencySymbol}{isCredit ? card.creditLimit.toLocaleString() : card.dailySpendLimit.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px]" style={{ color: colors.textTertiary }}>
                {isCredit ? "Balance Owed" : "Account Balance"}
              </p>
              <p className="text-[18px] font-semibold mt-0.5" style={{ color: isCredit && card.balance > 0 ? colors.red : colors.green }}>
                {currencySymbol}{isCredit ? card.balance.toFixed(2) : accountBalance.toFixed(2)}
              </p>
            </div>
          </div>
          {isCredit && card.balance > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
              <div className="flex justify-between text-[12px]">
                <span style={{ color: colors.textSecondary }}>Available Credit</span>
                <span className="font-medium" style={{ color: colors.green }}>
                  {currencySymbol}{(card.creditLimit - card.balance).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {/* View Details / Show PIN */}
          {card.cardPin && (
            <button
              onClick={() => setShowPin(!showPin)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-[0.98]"
              style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: colors.blueBg }}>
                {showPin ? <EyeOff className="h-5 w-5" style={{ color: colors.blue }} /> : <Lock className="h-5 w-5" style={{ color: colors.blue }} />}
              </div>
              <span className="text-[12px] font-medium" style={{ color: colors.textPrimary }}>
                {showPin ? "Hide PIN" : "Show PIN"}
              </span>
            </button>
          )}

          {/* Pay Balance (Credit only) */}
          {isCredit && card.balance > 0 && (
            <button
              onClick={() => setShowPayModal(true)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-[0.98]"
              style={{ background: colors.greenBg, border: `1px solid ${colors.green}33` }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: colors.green }}>
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-[12px] font-medium" style={{ color: colors.green }}>Pay Balance</span>
            </button>
          )}

          {/* Freeze/Unfreeze — disabled while an admin block is in force */}
          <button
            onClick={handleFreeze}
            disabled={actionLoading === "freeze" || isBlocked}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            style={{
              background: isBlocked ? colors.redBg : isFrozen ? colors.blueBg : colors.bgElevated,
              border: `1px solid ${isBlocked ? colors.red + "33" : isFrozen ? colors.blue + "33" : colors.border}`,
              cursor: isBlocked ? "not-allowed" : undefined,
            }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: isBlocked ? colors.red : isFrozen ? colors.blue : colors.bgHover }}>
              {actionLoading === "freeze" ? (
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: isFrozen ? "white" : colors.textSecondary }} />
              ) : isBlocked ? (
                <Lock className="h-5 w-5 text-white" />
              ) : isFrozen ? (
                <Play className="h-5 w-5 text-white" />
              ) : (
                <Snowflake className="h-5 w-5" style={{ color: colors.blue }} />
              )}
            </div>
            <span className="text-[12px] font-medium" style={{ color: isBlocked ? colors.red : isFrozen ? colors.blue : colors.textPrimary }}>
              {isBlocked ? "Blocked" : isFrozen ? "Unfreeze" : "Freeze"}
            </span>
          </button>

          {/* View Details placeholder for credit cards without balance */}
          {isCredit && card.balance <= 0 && (
            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-[0.98]"
              style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: colors.blueBg }}>
                <CreditCard className="h-5 w-5" style={{ color: colors.blue }} />
              </div>
              <span className="text-[12px] font-medium" style={{ color: colors.textPrimary }}>Details</span>
            </button>
          )}
        </div>

        {/* Show PIN Display */}
        {showPin && card.cardPin && (
          <div className="mt-4 p-4 rounded-xl text-center" style={{ background: colors.blueBg, border: `1px solid ${colors.blue}33` }}>
            <p className="text-[12px]" style={{ color: colors.textSecondary }}>Your Card PIN</p>
            <p className="text-[28px] font-mono font-bold tracking-[0.3em] mt-1" style={{ color: colors.blue }}>
              {card.cardPin}
            </p>
            <p className="text-[11px] mt-2" style={{ color: colors.textTertiary }}>
              Keep this PIN secure. Do not share it with anyone.
            </p>
          </div>
        )}

        {/* Card Details Section */}
        <div className="mt-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: colors.textTertiary }}>
            Card Information
          </p>
          <div className="rounded-xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
            <div className="p-4 flex justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <span className="text-[13px]" style={{ color: colors.textSecondary }}>Card Network</span>
              <span className="text-[13px] font-medium capitalize" style={{ color: colors.textPrimary }}>{card.cardNetwork}</span>
            </div>
            <div className="p-4 flex justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <span className="text-[13px]" style={{ color: colors.textSecondary }}>Card Type</span>
              <span className="text-[13px] font-medium capitalize" style={{ color: colors.textPrimary }}>
                {card.isVirtual ? "Virtual" : "Physical"} {card.cardType}
              </span>
            </div>
            <div className="p-4 flex justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <span className="text-[13px]" style={{ color: colors.textSecondary }}>Status</span>
              <span className="text-[13px] font-medium" style={{ color: isFrozen ? colors.blue : colors.green }}>
                {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
              </span>
            </div>
            <div className="p-4 flex justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <span className="text-[13px]" style={{ color: colors.textSecondary }}>Approved</span>
              <span className="text-[13px] font-medium" style={{ color: colors.textPrimary }}>
                {card.approvedAt ? new Date(card.approvedAt).toLocaleDateString() : "—"}
              </span>
            </div>
            {!isCredit && (
              <div className="p-4 flex justify-between">
                <span className="text-[13px]" style={{ color: colors.textSecondary }}>Per-Transaction Limit</span>
                <span className="text-[13px] font-medium" style={{ color: colors.textPrimary }}>
                  {currencySymbol}{card.spendingLimit.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Billing Address */}
        {card.billingAddress && (
          <div className="mt-6">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: colors.textTertiary }}>
              Billing Address
            </p>
            <div className="rounded-xl p-4" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: colors.textTertiary }} />
                <div>
                  {card.billingAddress.street && (
                    <p className="text-[13px]" style={{ color: colors.textPrimary }}>{card.billingAddress.street}</p>
                  )}
                  <p className="text-[13px]" style={{ color: colors.textPrimary }}>
                    {[card.billingAddress.city, card.billingAddress.state, card.billingAddress.zip].filter(Boolean).join(", ")}
                  </p>
                  {card.billingAddress.country && (
                    <p className="text-[13px]" style={{ color: colors.textSecondary }}>{card.billingAddress.country}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History (Credit cards) */}
        {isCredit && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: colors.textTertiary }}>
                Recent Transactions
              </p>
              <button
                onClick={() => setShowStatementModal(true)}
                className="text-[12px] font-medium"
                style={{ color: colors.blue }}
              >
                View Statement
              </button>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
              {transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <CreditCard className="h-8 w-8 mx-auto mb-2" style={{ color: colors.textTertiary }} />
                  <p className="text-[13px]" style={{ color: colors.textSecondary }}>No transactions yet</p>
                </div>
              ) : (
                transactions.map((tx, i) => (
                  <div
                    key={tx.id}
                    className="p-4 flex items-center gap-3"
                    style={{ borderBottom: i < transactions.length - 1 ? `1px solid ${colors.border}` : undefined }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: colors.bgHover }}>
                      <TransactionIcon type={tx.type} colors={colors} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: colors.textPrimary }}>
                        {tx.merchantName || tx.description}
                      </p>
                      <p className="text-[11px]" style={{ color: colors.textTertiary }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`text-[13px] font-semibold`}
                      style={{ color: tx.type === "payment" || tx.type === "refund" ? colors.green : colors.red }}>
                      {tx.type === "payment" || tx.type === "refund" ? "+" : "-"}{currencySymbol}{tx.amount.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Actions List */}
        <div className="mt-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: colors.textTertiary }}>
            Card Actions
          </p>
          <div className="rounded-xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
            {!isCredit && (
              <button
                onClick={() => setShowStatementModal(true)}
                className="w-full p-4 flex items-center gap-3 text-left transition-colors"
                style={{ borderBottom: `1px solid ${colors.border}` }}
              >
                <FileText className="h-5 w-5" style={{ color: colors.textSecondary }} />
                <span className="text-[14px]" style={{ color: colors.textPrimary }}>Get Card Statement</span>
              </button>
            )}
            <button
              onClick={() => setShowLimitsModal(true)}
              className="w-full p-4 flex items-center gap-3 text-left transition-colors"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              <Settings className="h-5 w-5" style={{ color: colors.textSecondary }} />
              <span className="text-[14px]" style={{ color: colors.textPrimary }}>Set Payment Limits</span>
            </button>
            {(isFrozen || card.status === "active") && (
              <button
                onClick={() => { setNewPin(""); setConfirmPin(""); setPinError(""); setShowPinModal(true) }}
                className="w-full p-4 flex items-center gap-3 text-left transition-colors"
                style={{ borderBottom: `1px solid ${colors.border}` }}
              >
                <Lock className="h-5 w-5" style={{ color: colors.textSecondary }} />
                <span className="text-[14px]" style={{ color: colors.textPrimary }}>
                  {card.cardPin ? "Change Card PIN" : "Set Card PIN"}
                </span>
              </button>
            )}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full p-4 flex items-center gap-3 text-left transition-colors"
            >
              <Trash2 className="h-5 w-5" style={{ color: colors.red }} />
              <span className="text-[14px]" style={{ color: colors.red }}>Delete Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pay Modal */}
      {showPayModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowPayModal(false)} />
          <div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[360px] rounded-2xl p-5"
            style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[16px] font-semibold" style={{ color: colors.textPrimary }}>Pay Credit Card</p>
              <button onClick={() => setShowPayModal(false)} className="p-1">
                <XCircle className="h-5 w-5" style={{ color: colors.textTertiary }} />
              </button>
            </div>

            <div className="rounded-xl p-3 mb-4" style={{ background: colors.bgHover, border: `1px solid ${colors.border}` }}>
              <div className="flex justify-between text-[13px]">
                <span style={{ color: colors.textSecondary }}>Balance Owed</span>
                <span className="font-semibold" style={{ color: colors.textPrimary }}>{currencySymbol}{card.balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px] mt-1.5">
                <span style={{ color: colors.textSecondary }}>Account Balance</span>
                <span className="font-semibold" style={{ color: colors.textPrimary }}>{currencySymbol}{accountBalance.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[12px] font-medium mb-1.5 block" style={{ color: colors.textSecondary }}>
                Payment Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px]" style={{ color: colors.textTertiary }}>{currencySymbol}</span>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 pl-7 pr-3 rounded-xl text-[15px] outline-none"
                  style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setPayAmount(String(Math.min(card.balance, accountBalance)))}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: colors.blueBg, color: colors.blue }}
                >
                  Pay Full
                </button>
                <button
                  onClick={() => setPayAmount(String(Math.min(card.balance / 2, accountBalance)))}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: colors.bgHover, color: colors.textSecondary, border: `1px solid ${colors.border}` }}
                >
                  Pay Half
                </button>
              </div>
            </div>

            {payError && (
              <div className="mb-4 p-3 rounded-xl flex items-start gap-2" style={{ background: colors.redBg, border: `1px solid ${colors.red}33` }}>
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: colors.red }} />
                <p className="text-[13px]" style={{ color: colors.red }}>{payError}</p>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={actionLoading === "pay" || !payAmount}
              className="w-full h-11 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: colors.green }}
            >
              {actionLoading === "pay" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
              {actionLoading === "pay" ? "Processing..." : "Pay Now"}
            </button>
          </div>
        </>
      )}

      {/* Limits Modal */}
      {showLimitsModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowLimitsModal(false)} />
          <div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[360px] rounded-2xl p-5"
            style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[16px] font-semibold" style={{ color: colors.textPrimary }}>Set Payment Limits</p>
              <button onClick={() => setShowLimitsModal(false)} className="p-1">
                <XCircle className="h-5 w-5" style={{ color: colors.textTertiary }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium mb-1.5 block" style={{ color: colors.textSecondary }}>
                  Per-Transaction Limit ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={newSpendingLimit}
                  onChange={(e) => setNewSpendingLimit(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl text-[15px] outline-none"
                  style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
              </div>
              <div>
                <label className="text-[12px] font-medium mb-1.5 block" style={{ color: colors.textSecondary }}>
                  Daily Spend Limit ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={newDailyLimit}
                  onChange={(e) => setNewDailyLimit(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl text-[15px] outline-none"
                  style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
              </div>
            </div>

            <button
              onClick={handleUpdateLimits}
              disabled={actionLoading === "limits"}
              className="w-full h-11 mt-4 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: colors.blue }}
            >
              {actionLoading === "limits" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {actionLoading === "limits" ? "Saving..." : "Save Limits"}
            </button>
          </div>
        </>
      )}

      {/* Change PIN Modal */}
      {showPinModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowPinModal(false)} />
          <div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[360px] rounded-2xl p-5"
            style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[16px] font-semibold" style={{ color: colors.textPrimary }}>
                {card.cardPin ? "Change Card PIN" : "Set Card PIN"}
              </p>
              <button onClick={() => setShowPinModal(false)} className="p-1">
                <XCircle className="h-5 w-5" style={{ color: colors.textTertiary }} />
              </button>
            </div>

            <p className="text-[13px] mb-4" style={{ color: colors.textSecondary }}>
              Choose a 4-digit PIN for use at ATMs and point-of-sale terminals.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium mb-1.5 block" style={{ color: colors.textSecondary }}>
                  New PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="w-full h-11 px-3 rounded-xl text-[18px] tracking-[0.5em] text-center outline-none"
                  style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
              </div>
              <div>
                <label className="text-[12px] font-medium mb-1.5 block" style={{ color: colors.textSecondary }}>
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="w-full h-11 px-3 rounded-xl text-[18px] tracking-[0.5em] text-center outline-none"
                  style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
              </div>
            </div>

            {pinError && (
              <div className="mt-4 p-3 rounded-xl flex items-start gap-2" style={{ background: colors.redBg, border: `1px solid ${colors.red}33` }}>
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: colors.red }} />
                <p className="text-[13px]" style={{ color: colors.red }}>{pinError}</p>
              </div>
            )}

            <button
              onClick={handleChangePin}
              disabled={actionLoading === "pin" || newPin.length !== 4 || confirmPin.length !== 4}
              className="w-full h-11 mt-4 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: colors.blue }}
            >
              {actionLoading === "pin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {actionLoading === "pin" ? "Saving..." : "Save PIN"}
            </button>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowDeleteModal(false)} />
          <div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[360px] rounded-2xl p-5"
            style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: colors.redBg }}>
                <Trash2 className="h-7 w-7" style={{ color: colors.red }} />
              </div>
              <p className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>Delete Card?</p>
              <p className="text-[14px] mt-2" style={{ color: colors.textSecondary }}>
                This action cannot be undone. The card will be permanently cancelled.
              </p>
              {isCredit && card.balance > 0 && (
                <div className="mt-3 p-3 rounded-xl" style={{ background: colors.redBg, border: `1px solid ${colors.red}33` }}>
                  <p className="text-[13px]" style={{ color: colors.red }}>
                    You must pay off your balance ({currencySymbol}{card.balance.toFixed(2)}) before deleting this card.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 h-11 rounded-xl text-[14px] font-semibold"
                style={{ background: colors.bgHover, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === "delete" || (isCredit && card.balance > 0)}
                className="flex-1 h-11 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: colors.red }}
              >
                {actionLoading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Statement Modal */}
      {showStatementModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowStatementModal(false)} />
          <div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[400px] max-h-[80vh] overflow-y-auto rounded-2xl p-5"
            style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[16px] font-semibold" style={{ color: colors.textPrimary }}>Card Statement</p>
              <button onClick={() => setShowStatementModal(false)} className="p-1">
                <XCircle className="h-5 w-5" style={{ color: colors.textTertiary }} />
              </button>
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ background: colors.bgHover, border: `1px solid ${colors.border}` }}>
              <p className="text-[12px]" style={{ color: colors.textTertiary }}>Statement Period</p>
              <p className="text-[15px] font-medium mt-1" style={{ color: colors.textPrimary }}>
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: colors.bgHover, border: `1px solid ${colors.border}` }}>
              {transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: colors.textTertiary }} />
                  <p className="text-[13px]" style={{ color: colors.textSecondary }}>No transactions this period</p>
                </div>
              ) : (
                transactions.map((tx, i) => (
                  <div
                    key={tx.id}
                    className="p-3 flex items-center justify-between"
                    style={{ borderBottom: i < transactions.length - 1 ? `1px solid ${colors.border}` : undefined }}
                  >
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: colors.textPrimary }}>
                        {tx.merchantName || tx.description}
                      </p>
                      <p className="text-[11px]" style={{ color: colors.textTertiary }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold" style={{ color: tx.type === "payment" || tx.type === "refund" ? colors.green : colors.red }}>
                      {tx.type === "payment" || tx.type === "refund" ? "+" : "-"}{currencySymbol}{tx.amount.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowStatementModal(false)}
              className="w-full h-11 mt-4 rounded-xl text-[14px] font-semibold text-white"
              style={{ background: colors.blue }}
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  )
}
