"use client"

import { useState, useEffect, useCallback } from "react"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import { useRouter } from "next/navigation"
import {
  CreditCard, Plus, Snowflake, CheckCircle2, XCircle,
  Clock, Wifi, Eye, EyeOff, AlertTriangle, ChevronLeft,
  Shield, ArrowRight, Copy, Check, MapPin, Lock, Delete,
  DollarSign, Loader2, Settings,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"
import { CardBrandBadge, CardBrandMark } from "@/components/CardBrandLogo"

// ── Types ────────────────────────────────────────────────────────────────────

interface CardData {
  _id:            string
  cardNetwork:    string
  cardType:       string
  status:         string
  cardNumber:     string | null
  cvv:            string | null
  creditLimit:    number
  spendingLimit:  number
  preferredLimit: number
  balance:        number
  expiryMonth:    number | null
  expiryYear:     number | null
  cardholderName: string | null
  isVirtual:      boolean
  applicationFee: number
  referenceNumber: string | null
  adminNote:      string | null
  appliedAt:      string
  approvedAt:     string | null
  deliveryStatus: string | null
  deliveryAddress: { street?: string; city?: string; state?: string; zip?: string; country?: string } | null
}

interface CardSettings {
  applicationFee:   number
  physicalFee:      number
  maxPerUser:       number
  requiredKycTier:  number
}

interface Address { street: string; city: string; state: string; zip: string; country: string }

interface Eligibility {
  fullName:     string
  kycStatus:    string
  kycTier:      number
  fiatBalance:  number
  currency:     string
  meetsKyc:     boolean
  address:      Address | null
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending:   { icon: Clock,         color: "#F79009", bg: "#FFFAEB", label: "Pending Review" },
  approved:  { icon: Clock,         color: "#2775CA", bg: "#EFF8FF", label: "In Delivery" },
  active:    { icon: CheckCircle2,  color: "#12B76A", bg: "#ECFDF3",  label: "Active" },
  frozen:    { icon: Snowflake,     color: "#1A2CCE", bg: "#EEF0FE", label: "Frozen" },
  blocked:   { icon: Lock,          color: "#B42318", bg: "#FEF3F2", label: "Blocked" },
  rejected:  { icon: XCircle,       color: "#F04438", bg: "#FEF3F2",  label: "Rejected" },
  cancelled: { icon: XCircle,       color: "#667085", bg: "#F9FAFB", label: "Cancelled" },
}

function formatCardLabel(network: string, type: string): string {
  const n = network === "mastercard" ? "Mastercard" : network === "amex" ? "Amex" : "Visa"
  const t = type === "credit" ? "Credit" : "Debit"
  return `${n} ${t}`
}

// ── Step type ────────────────────────────────────────────────────────────────

type ApplyStep = "closed" | "eligibility" | "network" | "type" | "format" | "details" | "delivery" | "security" | "confirm" | "success"

const LIMIT_OPTIONS = [500, 1000, 2500, 5000, 10000, 25000]
const DAILY_LIMIT_OPTIONS = [200, 500, 1000, 2500, 5000, 10000]

// ── Main Component ───────────────────────────────────────────────────────────

export default function CardsPage() {
  const router = useRouter()
  const colors = useThemeColors()
  const { symbol: currencySymbol, formatAmount } = useCurrency()
  const [cards, setCards] = useState<CardData[]>()
  const [cardSettings, setCardSettings] = useState<CardSettings>({ applicationFee: 0, physicalFee: 0, maxPerUser: 5, requiredKycTier: 1 })
  const [eligibility, setEligibility] = useState<Eligibility | null>(null)
  const [loading, setLoading] = useState(true)

  // Application form state
  const [step, setStep] = useState<ApplyStep>("closed")
  const [applying, setApplying] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<"visa" | "mastercard" | "amex" | "">("")
  const [selectedType, setSelectedType] = useState<"debit" | "credit" | "">("")
  const [selectedFormat, setSelectedFormat] = useState<"virtual" | "physical" | "">("")
  const [cardholderName, setCardholderName] = useState("")
  const [preferredLimit, setPreferredLimit] = useState<number>(1000)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [error, setError] = useState("")
  const [successRef, setSuccessRef] = useState("")
  const [copiedRef, setCopiedRef] = useState(false)

  // Billing address
  const [billingStreet, setBillingStreet] = useState("")
  const [billingCity, setBillingCity] = useState("")
  const [billingState, setBillingState] = useState("")
  const [billingZip, setBillingZip] = useState("")
  const [billingCountry, setBillingCountry] = useState("")

  // Daily spend limit
  const [dailySpendLimit, setDailySpendLimit] = useState<number>(500)

  // Card PIN
  const [cardPin, setCardPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter")

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch("/api/user/cards")
      if (res.ok) {
        const data = await res.json()
        setCards(data.cards)
        if (data.cardSettings) setCardSettings(data.cardSettings)
        if (data.eligibility) {
          setEligibility(data.eligibility)
          setCardholderName(data.eligibility.fullName || "")
        }
      }
    } catch { /* */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchCards() }, [fetchCards])

  const activeOrPending = cards?.filter((c) => ["pending", "approved", "active", "frozen", "blocked"].includes(c.status)) || []
  const canApply = activeOrPending.length < cardSettings.maxPerUser

  // Apply-flow derived state
  const isPhysical = selectedFormat === "physical"
  const applyFee = isPhysical ? cardSettings.physicalFee : cardSettings.applicationFee
  const stepList: ApplyStep[] = [
    "eligibility", "network", "type", "format", "details",
    ...(isPhysical ? (["delivery"] as ApplyStep[]) : []),
    "security", "confirm",
  ]
  const stepIndex = stepList.indexOf(step)
  const goNext = () => {
    const i = stepList.indexOf(step)
    if (i >= 0 && i < stepList.length - 1) { setStep(stepList[i + 1]); setError("") }
  }
  const goPrev = () => {
    const i = stepList.indexOf(step)
    if (i > 0) {
      const prev = stepList[i - 1]
      if (step === "security") { setPinStep("enter"); setCardPin(""); setConfirmPin("") }
      setStep(prev); setError("")
    }
  }

  const openApply = () => {
    setStep("eligibility")
    setSelectedNetwork("")
    setSelectedType("")
    setSelectedFormat("")
    setPreferredLimit(1000)
    setDailySpendLimit(500)
    setAgreedTerms(false)
    setError("")
    setSuccessRef("")
    // Prefill the delivery address from the user's saved profile (editable)
    const a = eligibility?.address
    setBillingStreet(a?.street || ""); setBillingCity(a?.city || ""); setBillingState(a?.state || "")
    setBillingZip(a?.zip || ""); setBillingCountry(a?.country || "")
    setCardPin(""); setConfirmPin(""); setPinStep("enter")
    if (eligibility) setCardholderName(eligibility.fullName)
  }

  const handleApply = async () => {
    if (!selectedNetwork || !selectedType || !selectedFormat || !agreedTerms) return
    setApplying(true)
    setError("")
    try {
      const res = await fetch("/api/user/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNetwork: selectedNetwork,
          cardType: selectedType,
          isVirtual: selectedFormat === "virtual",
          cardholderName: cardholderName.trim(),
          preferredLimit,
          dailySpendLimit,
          cardPin: cardPin || undefined,
          billingAddress: billingStreet ? {
            street: billingStreet.trim(),
            city: billingCity.trim(),
            state: billingState.trim(),
            zip: billingZip.trim(),
            country: billingCountry.trim(),
          } : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessRef(data.card?.referenceNumber || "")
        setStep("success")
        fetchCards()
      } else {
        setError(data.error || "Failed to apply")
      }
    } catch {
      setError("Network error. Please try again.")
    }
    setApplying(false)
  }

  const closeApply = () => setStep("closed")

  useBodyScrollLock(step !== "closed")

  const activeCards = cards?.filter((c) => c.status === "active" || c.status === "frozen") || []
  const otherCards = cards?.filter((c) => c.status !== "active" && c.status !== "frozen") || []

  return (
    <>
      <UserHeader
        title="Cards"
        rightElement={
          canApply ? (
            <button
              onClick={openApply}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: colors.blueBg }}
            >
              <Plus className="h-4 w-4" style={{ color: colors.blue }} />
            </button>
          ) : undefined
        }
      />

      <div className="px-4 py-5 lg:px-6 space-y-5 max-w-[800px] mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-52 rounded-2xl" style={{ background: colors.bgElevated }} />
            ))}
          </div>
        ) : !cards || cards.length === 0 ? (
          <div className="py-20 text-center">
            <div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: colors.blueBg }}
            >
              <CreditCard className="h-9 w-9" style={{ color: colors.blue }} />
            </div>
            <p className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>No cards yet</p>
            <p className="mt-1 text-[14px]" style={{ color: colors.textTertiary }}>
              Apply for your first virtual or physical card
            </p>
            <button
              onClick={openApply}
              className="mt-5 h-11 rounded-xl px-6 text-[14px] font-semibold text-white transition-all active:scale-[0.97]"
              style={{ background: colors.blue }}
            >
              Apply for a card
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium" style={{ color: colors.textTertiary }}>
                {activeOrPending.length} of {cardSettings.maxPerUser} cards
              </p>
              {canApply && (
                <button
                  onClick={openApply}
                  className="text-[12px] font-semibold flex items-center gap-1"
                  style={{ color: colors.blue }}
                >
                  <Plus className="h-3 w-3" /> New Card
                </button>
              )}
            </div>

            {activeCards.map((card) => (
              <CardVisual key={card._id} card={card} colors={colors} accountBalance={eligibility?.fiatBalance} onPayment={fetchCards} />
            ))}

            {otherCards.length > 0 && (
              <div>
                <p className="text-[13px] font-medium uppercase tracking-[0.06em] mb-3" style={{ color: colors.textTertiary }}>
                  Applications
                </p>
                <div className="space-y-2">
                  {otherCards.map((card) => {
                    const cfg = STATUS_CONFIG[card.status] || STATUS_CONFIG.pending
                    const Icon = cfg.icon
                    return (
                      <div
                        key={card._id}
                        className="flex items-center gap-3 rounded-2xl p-4"
                        style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: cfg.bg }}>
                          <Icon className="h-[18px] w-[18px]" style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium truncate" style={{ color: colors.textPrimary }}>
                            {card.isVirtual ? "Virtual" : "Physical"} · {formatCardLabel(card.cardNetwork, card.cardType)}
                          </p>
                          <p className="text-[12px] mt-0.5" style={{ color: colors.textTertiary }}>
                            {!card.isVirtual && card.deliveryStatus && (
                              <span className="capitalize">{card.deliveryStatus} · </span>
                            )}
                            {card.referenceNumber && <span className="font-mono">{card.referenceNumber} · </span>}
                            Applied {new Date(card.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
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
          </>
        )}
      </div>

      {/* ── Multi-step Apply Modal ─────────────────────────────────────── */}
      {step !== "closed" && (
        <>
          <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={step === "success" ? closeApply : undefined} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden"
            style={{
              background: colors.bgElevated,
              borderRadius: "24px 24px 0 0",
              maxHeight: "90vh",
              animation: "slideUp 300ms ease-out",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border }} />
            </div>

            {/* Header with back button */}
            <div className="px-5 py-3 flex items-center gap-3">
              {step !== "eligibility" && step !== "success" && (
                <button
                  onClick={goPrev}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: colors.bgHover }}
                >
                  <ChevronLeft className="h-4 w-4" style={{ color: colors.textPrimary }} />
                </button>
              )}
              <div className="flex-1">
                <h2 className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>
                  {step === "eligibility" && "Card Application"}
                  {step === "network" && "Select Network"}
                  {step === "type" && "Select Card Type"}
                  {step === "format" && "Virtual or Physical"}
                  {step === "details" && "Card Details"}
                  {step === "delivery" && "Delivery Address"}
                  {step === "security" && "Security & Limits"}
                  {step === "confirm" && "Review & Confirm"}
                  {step === "success" && "Application Submitted"}
                </h2>
                {step !== "success" && (
                  <p className="text-[12px] mt-0.5" style={{ color: colors.textMuted }}>
                    Step {stepIndex + 1} of {stepList.length}
                  </p>
                )}
              </div>
              <button onClick={closeApply} className="text-[13px] font-medium" style={{ color: colors.textTertiary }}>
                Cancel
              </button>
            </div>

            {/* Progress bar */}
            {step !== "success" && (
              <div className="px-5 pb-3">
                <div className="h-1 rounded-full overflow-hidden" style={{ background: colors.border }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round((stepIndex + 1) * (100 / stepList.length))}%`,
                      background: colors.blue,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
              {/* ─── STEP 1: Eligibility ─── */}
              {step === "eligibility" && eligibility && (
                <>
                  <div className="rounded-xl p-4 space-y-3" style={{ background: colors.bgHover, border: `1px solid ${colors.border}` }}>
                    <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                      Eligibility Check
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px]" style={{ color: colors.textSecondary }}>KYC Verification</span>
                        <span className="text-[13px] font-semibold" style={{ color: eligibility.meetsKyc ? colors.green : eligibility.kycStatus === "pending" ? (colors.yellow || "#F79009") : colors.red }}>
                          {eligibility.meetsKyc
                            ? "Verified"
                            : eligibility.kycStatus === "pending"
                              ? "Under Review"
                              : eligibility.kycStatus === "rejected"
                                ? "Declined"
                                : "Not Verified"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px]" style={{ color: colors.textSecondary }}>Account Balance</span>
                        <span className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>{formatAmount(eligibility.fiatBalance)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px]" style={{ color: colors.textSecondary }}>Cards Available</span>
                        <span className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>{cardSettings.maxPerUser - activeOrPending.length} of {cardSettings.maxPerUser}</span>
                      </div>
                      {cardSettings.applicationFee > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[13px]" style={{ color: colors.textSecondary }}>Application Fee</span>
                          <span className="text-[13px] font-semibold" style={{ color: colors.yellow || "#F79009" }}>{formatAmount(cardSettings.applicationFee)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: colors.blueBg, border: `1px solid ${colors.blue}1A` }}>
                    <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.blue }} />
                    <p className="text-[12px]" style={{ color: colors.textSecondary }}>
                      Choose a virtual card (instant, online use) or a physical card (mailed in 3–5 business days) in the next steps.
                    </p>
                  </div>

                  {!eligibility.meetsKyc && (
                    <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: colors.redBg, border: `1px solid ${colors.red}1A` }}>
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.red }} />
                      <p className="text-[12px]" style={{ color: colors.textSecondary }}>
                        {eligibility.kycStatus === "pending"
                          ? "Your identity verification is under review. You'll be able to apply for a card once it's approved."
                          : eligibility.kycStatus === "rejected"
                            ? "Your identity verification was declined. Please re-submit your documents to apply for a card."
                            : "You need to verify your identity before applying for a card. It only takes a few minutes."}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => eligibility.meetsKyc ? setStep("network") : router.push("/app/kyc")}
                    className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ background: colors.blue }}
                  >
                    {eligibility.meetsKyc ? (
                      <>Continue<ArrowRight className="h-4 w-4" /></>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        {eligibility.kycStatus === "pending"
                          ? "View Verification Status"
                          : eligibility.kycStatus === "rejected"
                            ? "Re-submit Verification"
                            : "Verify Identity"}
                      </>
                    )}
                  </button>
                </>
              )}

              {/* ─── STEP 2: Network Selection ─── */}
              {step === "network" && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {(["visa", "mastercard", "amex"] as const).map((net) => {
                      const sel = selectedNetwork === net
                      const color = net === "visa" ? colors.blue : net === "mastercard" ? (colors.yellow || "#F79009") : "#2E77BC"
                      return (
                        <button
                          key={net}
                          onClick={() => setSelectedNetwork(net)}
                          className="relative rounded-xl p-4 transition-all text-center"
                          style={{
                            background: sel ? `${color}12` : colors.bgHover,
                            border: sel ? `1.5px solid ${color}4D` : `1px solid ${colors.border}`,
                          }}
                        >
                          <CardBrandBadge network={net} className="h-9 w-auto mx-auto mb-2.5 rounded-md" />
                          <p className="text-[13px] font-semibold" style={{ color: sel ? colors.textPrimary : colors.textSecondary }}>
                            {net === "visa" ? "Visa" : net === "mastercard" ? "Mastercard" : "Amex"}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                            {net === "visa" ? "Worldwide" : net === "mastercard" ? "Global" : "Premium"}
                          </p>
                          {sel && <CheckCircle2 className="absolute top-2 right-2 h-4 w-4" style={{ color }} />}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => selectedNetwork && goNext()}
                    disabled={!selectedNetwork}
                    className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ background: selectedNetwork ? colors.blue : colors.bgHover, opacity: selectedNetwork ? 1 : 0.5 }}
                  >
                    Continue<ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* ─── STEP 3: Card Type ─── */}
              {step === "type" && (
                <>
                  <div className="space-y-3">
                    {(["debit", "credit"] as const).map((type) => {
                      const sel = selectedType === type
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          className="w-full rounded-xl p-4 transition-all text-left flex items-center gap-4"
                          style={{
                            background: sel ? colors.greenBg : colors.bgHover,
                            border: sel ? `1.5px solid ${colors.green}4D` : `1px solid ${colors.border}`,
                          }}
                        >
                          <div className="flex-1">
                            <p className="text-[15px] font-semibold" style={{ color: sel ? colors.green : colors.textPrimary }}>
                              {type === "debit" ? "Debit Card" : "Credit Card"}
                            </p>
                            <p className="text-[12px] mt-1" style={{ color: colors.textTertiary }}>
                              {type === "debit"
                                ? "Spend directly from your account balance. No credit line."
                                : "Get a credit line with rewards. Subject to approval and credit assessment."}
                            </p>
                          </div>
                          {sel && <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: colors.green }} />}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => selectedType && goNext()}
                    disabled={!selectedType}
                    className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ background: selectedType ? colors.blue : colors.bgHover, opacity: selectedType ? 1 : 0.5 }}
                  >
                    Continue<ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* ─── STEP: Format (virtual vs physical) ─── */}
              {step === "format" && (
                <>
                  <div className="space-y-3">
                    {([
                      { key: "virtual" as const, title: "Virtual card", icon: Wifi,
                        desc: "Issued instantly for online & in-app payments. Ready to use as soon as it's approved.",
                        meta: "Instant · online only", fee: cardSettings.applicationFee },
                      { key: "physical" as const, title: "Physical card", icon: CreditCard,
                        desc: "A physical card mailed to your address for in-store use. Activates once delivered.",
                        meta: "Delivered in 3–5 business days", fee: cardSettings.physicalFee },
                    ]).map((opt) => {
                      const sel = selectedFormat === opt.key
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setSelectedFormat(opt.key)}
                          className="w-full rounded-xl p-4 transition-all text-left flex items-start gap-3"
                          style={{
                            background: sel ? colors.blueBg : colors.bgHover,
                            border: sel ? `1.5px solid ${colors.blue}4D` : `1px solid ${colors.border}`,
                          }}
                        >
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ background: sel ? colors.blue : colors.bgElevated }}>
                            <Icon className="h-5 w-5" style={{ color: sel ? "#fff" : colors.textSecondary }} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[15px] font-semibold" style={{ color: sel ? colors.blue : colors.textPrimary }}>{opt.title}</p>
                              {opt.fee > 0 && (
                                <span className="text-[11px] font-semibold" style={{ color: colors.yellow || "#F79009" }}>{formatAmount(opt.fee)}</span>
                              )}
                            </div>
                            <p className="text-[12px] mt-1" style={{ color: colors.textTertiary }}>{opt.desc}</p>
                            <p className="text-[11px] mt-1.5 font-medium" style={{ color: colors.textMuted }}>{opt.meta}</p>
                          </div>
                          {sel && <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: colors.blue }} />}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => selectedFormat && goNext()}
                    disabled={!selectedFormat}
                    className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ background: selectedFormat ? colors.blue : colors.bgHover, opacity: selectedFormat ? 1 : 0.5 }}
                  >
                    Continue<ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* ─── STEP 4: Details (name + billing address) ─── */}
              {step === "details" && (
                <>
                  <div>
                    <label className="text-[12px] font-medium uppercase tracking-wide block mb-2" style={{ color: colors.textTertiary }}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                      placeholder="NAME AS ON CARD"
                      className="w-full h-12 rounded-xl px-4 text-[15px] font-medium outline-none uppercase"
                      style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                    />
                    <p className="text-[11px] mt-1.5" style={{ color: colors.textMuted }}>
                      This name will be printed on your card
                    </p>
                  </div>

                  {error && <p className="text-[13px] text-center" style={{ color: colors.red }}>{error}</p>}

                  <button
                    onClick={() => {
                      if (cardholderName.trim().length < 2) { setError("Please enter a valid cardholder name"); return }
                      setError(""); goNext()
                    }}
                    className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ background: colors.blue }}
                  >
                    Continue<ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* ─── STEP: Delivery address (physical only) ─── */}
              {step === "delivery" && (
                <>
                  <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: colors.blueBg, border: `1px solid ${colors.blue}1A` }}>
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.blue }} />
                    <p className="text-[12px]" style={{ color: colors.textSecondary }}>
                      Where should we mail your physical card? Delivery takes 3–5 business days.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <input
                      type="text" value={billingStreet} onChange={(e) => setBillingStreet(e.target.value)}
                      placeholder="Street address"
                      className="w-full h-11 rounded-xl px-4 text-[14px] outline-none"
                      style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} placeholder="City"
                        className="w-full h-11 rounded-xl px-4 text-[14px] outline-none" style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }} />
                      <input type="text" value={billingState} onChange={(e) => setBillingState(e.target.value)} placeholder="State / Province"
                        className="w-full h-11 rounded-xl px-4 text-[14px] outline-none" style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={billingZip} onChange={(e) => setBillingZip(e.target.value)} placeholder="ZIP / Postal code"
                        className="w-full h-11 rounded-xl px-4 text-[14px] outline-none" style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }} />
                      <input type="text" value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} placeholder="Country"
                        className="w-full h-11 rounded-xl px-4 text-[14px] outline-none" style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }} />
                    </div>
                  </div>

                  {error && <p className="text-[13px] text-center" style={{ color: colors.red }}>{error}</p>}

                  <button
                    onClick={() => {
                      if (!billingStreet.trim() || !billingCity.trim() || !billingZip.trim() || !billingCountry.trim()) {
                        setError("Please fill in street, city, ZIP and country"); return
                      }
                      setError(""); goNext()
                    }}
                    className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ background: colors.blue }}
                  >
                    Continue<ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* ─── STEP 5: Security & Limits ─── */}
              {step === "security" && (
                <>
                  {/* Preferred Limit */}
                  <div>
                    <label className="text-[12px] font-medium uppercase tracking-wide block mb-2" style={{ color: colors.textTertiary }}>
                      Preferred {selectedType === "credit" ? "Credit" : "Spending"} Limit
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {LIMIT_OPTIONS.map((limit) => (
                        <button
                          key={limit}
                          onClick={() => setPreferredLimit(limit)}
                          className="h-10 rounded-lg text-[13px] font-semibold transition-all"
                          style={{
                            background: preferredLimit === limit ? colors.blueBg : colors.bgHover,
                            border: preferredLimit === limit ? `1px solid ${colors.blue}4D` : `1px solid ${colors.border}`,
                            color: preferredLimit === limit ? colors.blue : colors.textSecondary,
                          }}
                        >
                          {currencySymbol}{limit.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] mt-1.5" style={{ color: colors.textMuted }}>
                      Final limit is subject to approval and may differ from your preference
                    </p>
                  </div>

                  {/* Daily Spend Limit */}
                  <div>
                    <label className="text-[12px] font-medium uppercase tracking-wide block mb-2" style={{ color: colors.textTertiary }}>
                      Daily Spending Limit
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {DAILY_LIMIT_OPTIONS.map((limit) => (
                        <button
                          key={limit}
                          onClick={() => setDailySpendLimit(limit)}
                          className="h-10 rounded-lg text-[13px] font-semibold transition-all"
                          style={{
                            background: dailySpendLimit === limit ? colors.greenBg : colors.bgHover,
                            border: dailySpendLimit === limit ? `1px solid ${colors.green}4D` : `1px solid ${colors.border}`,
                            color: dailySpendLimit === limit ? colors.green : colors.textSecondary,
                          }}
                        >
                          {currencySymbol}{limit.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] mt-1.5" style={{ color: colors.textMuted }}>
                      Maximum amount you can spend per day. Can be changed later.
                    </p>
                  </div>

                  {/* Card PIN */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="h-4 w-4" style={{ color: colors.blue }} />
                      <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                        {pinStep === "enter" ? "Set Card PIN" : "Confirm Card PIN"}
                      </label>
                    </div>
                    <p className="text-[12px] mb-4" style={{ color: colors.textTertiary }}>
                      {pinStep === "enter" ? "Choose a 4-digit PIN for ATM & POS transactions" : "Re-enter your PIN to confirm"}
                    </p>

                    {/* PIN dots */}
                    <div className="flex justify-center gap-4 mb-5">
                      {[0, 1, 2, 3].map((i) => {
                        const currentPin = pinStep === "enter" ? cardPin : confirmPin
                        const filled = i < currentPin.length
                        return (
                          <div
                            key={i}
                            className="transition-all duration-200"
                            style={{
                              width: 18, height: 18, borderRadius: "50%",
                              background: filled ? colors.blue : "transparent",
                              border: `2.5px solid ${filled ? colors.blue : colors.border}`,
                              transform: filled ? "scale(1.1)" : "scale(1)",
                              boxShadow: filled && colors.isDark ? "0 0 10px rgba(59,158,255,0.35)" : "none",
                            }}
                          />
                        )
                      })}
                    </div>

                    {/* PIN error */}
                    {error && <p className="text-[13px] text-center mb-3" style={{ color: colors.red }}>{error}</p>}

                    {/* Numpad */}
                    <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((key) => {
                        if (key === "") return <div key="empty" />
                        const isDel = key === "del"
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setError("")
                              if (isDel) {
                                if (pinStep === "enter") setCardPin((p) => p.slice(0, -1))
                                else setConfirmPin((p) => p.slice(0, -1))
                              } else {
                                if (pinStep === "enter") {
                                  setCardPin((p) => {
                                    const next = p.length < 4 ? p + key : p
                                    if (next.length === 4) setTimeout(() => setPinStep("confirm"), 300)
                                    return next
                                  })
                                } else {
                                  setConfirmPin((p) => p.length < 4 ? p + key : p)
                                }
                              }
                            }}
                            className="flex items-center justify-center h-12 rounded-xl text-[18px] font-semibold transition-all active:scale-95"
                            style={{ background: colors.bgHover, border: "none", color: colors.textPrimary }}
                          >
                            {isDel ? <Delete className="h-5 w-5" style={{ color: colors.textSecondary }} /> : key}
                          </button>
                        )
                      })}
                    </div>

                    {pinStep === "confirm" && (
                      <button
                        onClick={() => { setPinStep("enter"); setCardPin(""); setConfirmPin(""); setError("") }}
                        className="mt-3 text-[12px] font-medium block mx-auto"
                        style={{ color: colors.textTertiary, background: "none", border: "none", cursor: "pointer" }}
                      >
                        Reset PIN
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (cardPin.length !== 4) { setError("Please enter a 4-digit PIN"); return }
                      if (pinStep === "enter") { setError("Please confirm your PIN"); return }
                      if (confirmPin.length !== 4) { setError("Please confirm your 4-digit PIN"); return }
                      if (cardPin !== confirmPin) { setError("PINs do not match. Please try again."); setConfirmPin(""); return }
                      setError(""); setStep("confirm")
                    }}
                    disabled={cardPin.length !== 4 || confirmPin.length !== 4}
                    className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                      background: (cardPin.length === 4 && confirmPin.length === 4) ? colors.blue : colors.bgHover,
                      opacity: (cardPin.length === 4 && confirmPin.length === 4) ? 1 : 0.5,
                    }}
                  >
                    Review Application<ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* ─── STEP 6: Confirmation ─── */}
              {step === "confirm" && (
                <>
                  <div className="rounded-xl p-4 space-y-3" style={{ background: colors.bgHover, border: `1px solid ${colors.border}` }}>
                    <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                      Application Summary
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-[13px]" style={{ color: colors.textSecondary }}>Card Network</span>
                        <span className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>{selectedNetwork === "visa" ? "Visa" : selectedNetwork === "amex" ? "American Express" : "Mastercard"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px]" style={{ color: colors.textSecondary }}>Card Type</span>
                        <span className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>{selectedType === "credit" ? "Credit Card" : "Debit Card"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px]" style={{ color: colors.textSecondary }}>Cardholder Name</span>
                        <span className="text-[13px] font-semibold font-mono" style={{ color: colors.textPrimary }}>{cardholderName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px]" style={{ color: colors.textSecondary }}>Preferred Limit</span>
                        <span className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>{currencySymbol}{preferredLimit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px]" style={{ color: colors.textSecondary }}>Daily Spend Limit</span>
                        <span className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>{currencySymbol}{dailySpendLimit.toLocaleString()}/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px]" style={{ color: colors.textSecondary }}>Card PIN</span>
                        <span className="text-[13px] font-semibold" style={{ color: colors.green }}>••••  Set</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px]" style={{ color: colors.textSecondary }}>Card Format</span>
                        <span className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>{isPhysical ? "Physical" : "Virtual"}</span>
                      </div>
                      {isPhysical && (
                        <div className="flex justify-between">
                          <span className="text-[13px]" style={{ color: colors.textSecondary }}>Est. delivery</span>
                          <span className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>3–5 business days</span>
                        </div>
                      )}
                      {isPhysical && billingStreet && (
                        <div className="flex justify-between">
                          <span className="text-[13px]" style={{ color: colors.textSecondary }}>Delivery Address</span>
                          <span className="text-[13px] font-semibold text-right max-w-[55%]" style={{ color: colors.textPrimary }}>
                            {billingStreet}, {billingCity}{billingState ? `, ${billingState}` : ""} {billingZip}
                          </span>
                        </div>
                      )}
                      {applyFee > 0 && (
                        <div className="flex justify-between pt-2 border-t" style={{ borderColor: colors.border }}>
                          <span className="text-[13px] font-medium" style={{ color: colors.yellow || "#F79009" }}>{isPhysical ? "Physical card fee" : "Application fee"}</span>
                          <span className="text-[13px] font-bold" style={{ color: colors.yellow || "#F79009" }}>{formatAmount(applyFee)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div
                    onClick={() => setAgreedTerms(!agreedTerms)}
                    className="rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all"
                    style={{
                      background: agreedTerms ? colors.greenBg : colors.bgHover,
                      border: agreedTerms ? `1px solid ${colors.green}33` : `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      className="flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded"
                      style={{
                        background: agreedTerms ? colors.green : colors.bgHover,
                        border: agreedTerms ? "none" : `1px solid ${colors.border}`,
                      }}
                    >
                      {agreedTerms && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: colors.textSecondary }}>
                      I agree to the <span style={{ color: colors.blue }}>Terms & Conditions</span> and <span style={{ color: colors.blue }}>Cardholder Agreement</span>. I understand that the application fee is non-refundable and my preferred limit is subject to approval.
                    </p>
                  </div>

                  {error && <p className="text-[13px] text-center" style={{ color: colors.red }}>{error}</p>}

                  <button
                    onClick={handleApply}
                    disabled={!agreedTerms || applying}
                    className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
                    style={{
                      background: agreedTerms ? colors.green : colors.bgHover,
                      opacity: agreedTerms && !applying ? 1 : 0.5,
                    }}
                  >
                    {applying
                      ? "Processing..."
                      : applyFee > 0
                        ? `Confirm & Pay ${formatAmount(applyFee)}`
                        : "Submit Application"}
                  </button>
                </>
              )}

              {/* ─── STEP 6: Success ─── */}
              {step === "success" && (
                <div className="text-center py-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: colors.greenBg }}>
                    <CheckCircle2 className="h-8 w-8" style={{ color: colors.green }} />
                  </div>
                  <p className="text-[18px] font-semibold" style={{ color: colors.textPrimary }}>Application Submitted</p>
                  <p className="text-[13px] mt-1.5" style={{ color: colors.textTertiary }}>
                    Your card application is being reviewed
                  </p>

                  {successRef && (
                    <div className="mt-5 rounded-xl p-4" style={{ background: colors.bgHover, border: `1px solid ${colors.border}` }}>
                      <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: colors.textMuted }}>Reference Number</p>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-[16px] font-mono font-semibold" style={{ color: colors.textPrimary }}>{successRef}</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(successRef); setCopiedRef(true); setTimeout(() => setCopiedRef(false), 2000) }}
                          className="p-1"
                        >
                          {copiedRef ? <Check className="h-4 w-4" style={{ color: colors.green }} /> : <Copy className="h-4 w-4" style={{ color: colors.textTertiary }} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 rounded-xl p-3 text-left" style={{ background: colors.blueBg, border: `1px solid ${colors.blue}1A` }}>
                    <p className="text-[12px] font-medium" style={{ color: colors.blue }}>What happens next?</p>
                    <ul className="text-[12px] mt-2 space-y-1.5" style={{ color: colors.textSecondary }}>
                      <li>• Your application will be reviewed shortly</li>
                      <li>• You will be notified once your card is approved</li>
                      {isPhysical
                        ? <li>• Your physical card will be mailed and arrives in 3–5 business days. It activates once delivered.</li>
                        : <li>• Card details will appear on this page when active</li>}
                    </ul>
                  </div>

                  <button
                    onClick={closeApply}
                    className="mt-5 w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
                    style={{ background: colors.blue }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ── Visual card component ────────────────────────────────────────────────────

interface CardVisualProps {
  card: CardData
  colors: ReturnType<typeof useThemeColors>
  accountBalance?: number  // For debit cards - linked to account balance
  onPayment?: () => void   // Callback after successful payment
}

function CardVisual({ card, colors, accountBalance, onPayment }: CardVisualProps) {
  const isVisa = card.cardNetwork === "visa"
  const isAmex = card.cardNetwork === "amex"
  const isFrozen = card.status === "frozen"
  const { symbol: currencySymbol } = useCurrency()
  const [showCvv, setShowCvv] = useState(false)

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false)
  const [payAmount, setPayAmount] = useState("")
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState("")
  const [paySuccess, setPaySuccess] = useState<{ amount: number; newBalance: number } | null>(null)

  const handlePay = async () => {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) {
      setPayError("Enter a valid amount")
      return
    }
    if (amount > card.balance) {
      setPayError(`Amount exceeds balance owed (${currencySymbol}${card.balance.toLocaleString()})`)
      return
    }
    if (accountBalance !== undefined && amount > accountBalance) {
      setPayError(`Insufficient account balance (${currencySymbol}${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })})`)
      return
    }

    setPaying(true)
    setPayError("")
    try {
      const res = await fetch(`/api/user/cards/${card._id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Payment failed")
      
      setPaySuccess({ amount: data.paymentAmount, newBalance: data.newCardBalance })
      onPayment?.()
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setPaying(false)
    }
  }

  const closePayModal = () => {
    setShowPayModal(false)
    setPayAmount("")
    setPayError("")
    setPaySuccess(null)
  }

  return (
    <div className="space-y-0">
      <div
        className="relative overflow-hidden text-white"
        style={{
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px 20px",
          minHeight: 200,
          background: isVisa
            ? "linear-gradient(135deg, #1a4a8a 0%, #0f3060 40%, #0a2040 100%)"
            : isAmex
              ? "linear-gradient(135deg, #006fcf 0%, #004b8d 40%, #002d5a 100%)"
              : "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
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

        {/* Top row: label + logo */}
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.6)" }}>
              VIRTUAL {card.cardType === "credit" ? "CREDIT" : "DEBIT"} CARD
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 rotate-90" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        </div>

        {/* Card number */}
        <p className="relative mt-6 font-mono text-[18px] sm:text-[20px] tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.9)" }}>
          {card.cardNumber || "•••• **** **** ••••"}
        </p>

        {/* Name + expiry + CVV */}
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
                {showCvv
                  ? <EyeOff className="h-3 w-3" style={{ color: "rgba(255,255,255,0.4)" }} />
                  : <Eye className="h-3 w-3" style={{ color: "rgba(255,255,255,0.4)" }} />}
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
          <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            {formatCardLabel(card.cardNetwork, card.cardType)}
          </span>
        </div>

        {/* Frozen overlay */}
        {isFrozen && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", borderRadius: "20px 20px 0 0" }}>
            <Snowflake className="h-8 w-8 mb-1" style={{ color: colors.blue }} />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Frozen</span>
          </div>
        )}
      </div>

      {/* Card stats below the visual */}
      <div
        className="p-4"
        style={{
          background: colors.bgElevated,
          borderRadius: card.cardType === "credit" && card.balance > 0 && card.status === "active" ? "0" : "0 0 20px 20px",
          border: `1px solid ${colors.border}`,
          borderTop: "none",
        }}
      >
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[10px]" style={{ color: colors.textTertiary }}>
              {card.cardType === "credit" ? "Credit Limit" : "Spending Limit"}
            </p>
            <p className="text-[14px] font-semibold tabular-nums mt-0.5" style={{ color: colors.textPrimary }}>
              {currencySymbol}{(card.cardType === "credit" ? card.creditLimit : card.spendingLimit).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px]" style={{ color: colors.textTertiary }}>
              {card.cardType === "credit" ? "Balance Owed" : "Available Balance"}
            </p>
            <p className="text-[14px] font-semibold tabular-nums mt-0.5" style={{ color: colors.textPrimary }}>
              {currencySymbol}{card.cardType === "credit"
                ? card.balance.toLocaleString()
                : (accountBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px]" style={{ color: colors.textTertiary }}>Status</p>
            <p className="text-[14px] font-semibold mt-0.5" style={{ color: isFrozen ? colors.blue : colors.green }}>
              {isFrozen ? "Frozen" : "Active"}
            </p>
          </div>
        </div>
        {/* Manage Button */}
        <button
          onClick={() => window.location.href = `/app/cards/${card._id}`}
          className="w-full mt-3 py-2.5 flex items-center justify-center gap-2 text-[13px] font-semibold rounded-xl transition-all active:scale-[0.98]"
          style={{ 
            background: colors.blueBg, 
            color: colors.blue,
            border: `1px solid ${colors.blue}33`,
          }}
        >
          <Settings className="h-4 w-4" />
          Manage Card
        </button>
      </div>

      {/* Pay Balance Button - Only for credit cards with balance */}
      {card.cardType === "credit" && card.balance > 0 && card.status === "active" && (
        <button
          onClick={() => setShowPayModal(true)}
          className="w-full py-3 flex items-center justify-center gap-2 text-[13px] font-semibold transition-all active:scale-[0.98]"
          style={{ 
            background: colors.greenBg, 
            color: colors.green,
            borderRadius: "0 0 20px 20px",
            border: `1px solid ${colors.border}`,
            borderTop: "none",
          }}
        >
          <DollarSign className="h-4 w-4" />
          Pay Balance
        </button>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={closePayModal} />
          <div 
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[360px] rounded-2xl p-5"
            style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
          >
            {paySuccess ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: colors.greenBg }}>
                  <CheckCircle2 className="h-7 w-7" style={{ color: colors.green }} />
                </div>
                <p className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>Payment Successful</p>
                <p className="text-[14px] mt-2" style={{ color: colors.textSecondary }}>
                  You paid <span className="font-semibold">{currencySymbol}{paySuccess.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </p>
                <p className="text-[13px] mt-1" style={{ color: colors.textTertiary }}>
                  New balance: {currencySymbol}{paySuccess.newBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <button
                  onClick={closePayModal}
                  className="mt-5 w-full h-11 rounded-xl text-[14px] font-semibold text-white"
                  style={{ background: colors.blue }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[16px] font-semibold" style={{ color: colors.textPrimary }}>Pay Credit Card</p>
                  <button onClick={closePayModal} className="p-1">
                    <XCircle className="h-5 w-5" style={{ color: colors.textTertiary }} />
                  </button>
                </div>

                <div className="rounded-xl p-3 mb-4" style={{ background: colors.bgHover, border: `1px solid ${colors.border}` }}>
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: colors.textSecondary }}>Balance Owed</span>
                    <span className="font-semibold" style={{ color: colors.textPrimary }}>{currencySymbol}{card.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[13px] mt-1.5">
                    <span style={{ color: colors.textSecondary }}>Account Balance</span>
                    <span className="font-semibold" style={{ color: colors.textPrimary }}>{currencySymbol}{(accountBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                      style={{ 
                        background: colors.bgHover, 
                        border: `1px solid ${colors.border}`,
                        color: colors.textPrimary,
                      }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setPayAmount(String(Math.min(card.balance, accountBalance ?? card.balance)))}
                      className="text-[12px] font-medium px-3 py-1.5 rounded-lg"
                      style={{ background: colors.blueBg, color: colors.blue }}
                    >
                      Pay Full Balance
                    </button>
                    <button
                      onClick={() => setPayAmount(String(Math.min(card.balance / 2, accountBalance ?? card.balance)))}
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
                  disabled={paying || !payAmount}
                  className="w-full h-11 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: colors.green }}
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" />
                      Pay Now
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
