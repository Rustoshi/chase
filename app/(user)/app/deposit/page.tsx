"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  CreditCard, Wallet, Building2, Bitcoin,
  ArrowLeft, ArrowRight, Upload, CheckCircle2,
  Loader2, X, Copy, Info, Clock, ChevronRight,
  DollarSign, AlertTriangle, FileText, Image as ImageIcon,
  Gift,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"

import Image from "next/image"

// ── Types ────────────────────────────────────────────────────────────────────

interface PaymentInfo {
  bankName?: string
  accountName?: string
  accountNumber?: string
  routingNumber?: string
  swiftCode?: string
  iban?: string
  bankAddress?: string
  email?: string
  username?: string
  phoneNumber?: string
  walletAddress?: string
  network?: string
  acceptedBrands?: string[]
  redemptionInstructions?: string
}

interface PaymentMethodItem {
  _id: string
  name: string
  slug: string
  type: string
  instructions: string
  depositTarget: string
  icon: string | null
  logoUrl?: string
  minAmount: number
  maxAmount: number
  feePercent: number
  feeFixed: number
  paymentInfo?: PaymentInfo
}

type Step = "method" | "amount" | "card" | "info" | "proof" | "giftcard" | "success"

const GIFT_CARD_TYPES = [
  { key: "amazon",      label: "Amazon",       color: "#FF9900" },
  { key: "itunes",      label: "iTunes/Apple", color: "#A2AAAD" },
  { key: "google_play", label: "Google Play",   color: "#34A853" },
  { key: "steam",       label: "Steam",         color: "#1B2838" },
  { key: "visa",        label: "Visa Gift Card",color: "#1A1F71" },
  { key: "ebay",        label: "eBay",          color: "#E53238" },
  { key: "walmart",     label: "Walmart",       color: "#0071CE" },
  { key: "target",      label: "Target",        color: "#CC0000" },
  { key: "nike",        label: "Nike",          color: "#111111" },
  { key: "sephora",     label: "Sephora",       color: "#000000" },
  { key: "other",       label: "Other",         color: "#6B7280" },
]

// ── Method config (icons, colors) ────────────────────────────────────────────

const METHOD_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  bank_transfer: { icon: Building2,   color: "#1A2CCE", bg: "rgba(26,44,206,0.12)",  label: "Bank Transfer" },
  wire:          { icon: Building2,   color: "#1A2CCE", bg: "rgba(26,44,206,0.12)",  label: "Wire Transfer" },
  paypal:        { icon: Wallet,      color: "#0070BA", bg: "rgba(0,112,186,0.12)",   label: "PayPal" },
  bitcoin:       { icon: Bitcoin,     color: "#F7931A", bg: "rgba(247,147,26,0.12)",  label: "Bitcoin" },
  crypto_other:  { icon: Wallet,      color: "#26A17B", bg: "rgba(38,161,123,0.12)",  label: "USDT" },
  venmo:         { icon: Wallet,      color: "#008CFF", bg: "rgba(0,140,255,0.12)",   label: "Venmo" },
  cash_app:      { icon: DollarSign,  color: "#00D632", bg: "rgba(0,214,50,0.12)",    label: "Cash App" },
  zelle:         { icon: DollarSign,  color: "#6D1ED4", bg: "rgba(109,30,212,0.12)",  label: "Zelle" },
  giftcard:      { icon: Gift,        color: "#EC4899", bg: "rgba(236,72,153,0.12)",  label: "Gift Card" },
}

const FALLBACK_META = { icon: CreditCard, color: "#F79009", bg: "rgba(247,144,9,0.12)", label: "Credit Card" }

function getMeta(type: string) {
  return METHOD_META[type] || FALLBACK_META
}

// ── PayPal SVG icon ──────────────────────────────────────────────────────────

function PayPalIcon({ size = 20, color = "#0070BA" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.23A.774.774 0 0 1 5.708 1.6h6.178c2.05 0 3.503.47 4.32 1.396.382.433.625.904.744 1.44.126.562.128 1.237.008 2.065l-.01.065v.573l.446.254c.373.2.672.432.9.697.325.379.535.845.622 1.386.09.555.06 1.216-.09 1.965-.174.86-.455 1.608-.836 2.222a4.666 4.666 0 0 1-1.328 1.41 5.32 5.32 0 0 1-1.778.782c-.666.175-1.424.264-2.254.264h-.535a1.62 1.62 0 0 0-1.601 1.37l-.04.227-.684 4.333-.031.163a.192.192 0 0 1-.19.164z" fill={color} fillOpacity="0.7"/>
      <path d="M19.536 6.78c-.013.084-.028.17-.046.258-.593 3.04-2.623 4.091-5.215 4.091H12.94a.641.641 0 0 0-.633.542l-.672 4.264-.19 1.208a.337.337 0 0 0 .333.39h2.34c.28 0 .517-.203.561-.478l.023-.12.445-2.82.028-.155a.569.569 0 0 1 .562-.48h.354c2.293 0 4.089-.931 4.613-3.623.22-1.126.106-2.066-.475-2.727a2.265 2.265 0 0 0-.648-.49z" fill={color}/>
    </svg>
  )
}

// ── USDT SVG icon ────────────────────────────────────────────────────────────

function USDTIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="#26A17B"/>
      <path d="M13.5 10.75v-1.5h3.25V7H7.25v2.25H10.5v1.5c-3.04.14-5.32.7-5.32 1.37 0 .67 2.28 1.23 5.32 1.37v4.76h3V13.49c3.01-.14 5.28-.7 5.28-1.37 0-.67-2.27-1.23-5.28-1.37zm0 2.44v-.002c-.076.005-.464.03-1.485.03-.815 0-1.39-.02-1.515-.03v.003c-2.684-.12-4.69-.59-4.69-1.15 0-.56 2.006-1.03 4.69-1.15v1.83c.128.01.716.04 1.53.04.977 0 1.394-.035 1.47-.04v-1.83c2.676.12 4.674.59 4.674 1.15 0 .56-1.998 1.03-4.674 1.15z" fill="white"/>
    </svg>
  )
}

// ── Info Row Component ────────────────────────────────────────────────────────

function InfoRow({ 
  label, 
  value, 
  onCopy, 
  copied,
  colors,
}: { 
  label: string
  value: string
  onCopy: (text: string, label: string) => void
  copied: string
  colors: ReturnType<typeof useThemeColors>
}) {
  return (
    <div>
      <span style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, flex: 1, wordBreak: "break-all" }}>
          {value}
        </span>
        <button
          onClick={() => onCopy(value, label)}
          style={{
            background: copied === label ? colors.greenBg : "transparent",
            border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          {copied === label ? (
            <CheckCircle2 style={{ width: 14, height: 14, color: colors.green }} />
          ) : (
            <Copy style={{ width: 14, height: 14, color: colors.textMuted }} />
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: copied === label ? colors.green : colors.textMuted }}>
            {copied === label ? "Copied" : "Copy"}
          </span>
        </button>
      </div>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DepositPage() {
  const router = useRouter()
  const colors = useThemeColors()
  const { symbol: currencySymbol, currency: currencyCode, formatAmount } = useCurrency()

  // State
  const [step, setStep]             = useState<Step>("method")
  const [methods, setMethods]       = useState<PaymentMethodItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodItem | null>(null)
  const [amount, setAmount]         = useState("")
  const [notes, setNotes]           = useState("")
  const [txReference, setTxReference] = useState("")
  const [proofUrl, setProofUrl]     = useState("")
  const [proofPublicId, setProofPublicId] = useState("")
  const [proofFile, setProofFile]   = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState("")
  const [uploading, setUploading]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState("")
  const [copied, setCopied]         = useState("")
  // Gift card fields
  const [gcType, setGcType]           = useState("")
  const [gcAmount, setGcAmount]       = useState("")
  const [gcCustomType, setGcCustomType] = useState("")
  const [gcFile, setGcFile]           = useState<File | null>(null)
  const [gcPreview, setGcPreview]     = useState("")
  const [gcProofUrl, setGcProofUrl]   = useState("")
  const [gcProofPublicId, setGcProofPublicId] = useState("")
  const [gcIsVirtual, setGcIsVirtual] = useState(false)
  const [gcCardCode, setGcCardCode]   = useState("")
  const [gcCardPin, setGcCardPin]     = useState("")
  const gcFileRef = useRef<HTMLInputElement>(null)
  // Credit card fields
  const [cardNumber, setCardNumber]     = useState("")
  const [cardExpiry, setCardExpiry]     = useState("")
  const [cardCvv, setCardCvv]           = useState("")
  const [cardHolder, setCardHolder]     = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch payment methods
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/payment-methods")
        if (res.ok) {
          const data = await res.json()
          setMethods(data.methods || [])
        }
      } catch { /* */ }
      setLoading(false)
    })()
  }, [])

  // Copy to clipboard
  const copyText = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(""), 2000)
  }, [])

  // Cloudinary unsigned upload
  const uploadToCloudinary = useCallback(async (file: File) => {
    setUploading(true)
    setError("")
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      if (!cloudName || !uploadPreset) throw new Error("Cloudinary not configured")

      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", uploadPreset)
      formData.append("folder", "deposit-proofs")

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      setProofUrl(data.secure_url)
      setProofPublicId(data.public_id)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB")
      return
    }

    setProofFile(file)
    setError("")

    // Preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => setProofPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setProofPreview("")
    }
  }, [])

  // Submit deposit
  const handleSubmit = useCallback(async (skipProof = false) => {
    if (!selectedMethod || !amount) return
    setSubmitting(true)
    setError("")

    try {
      let finalProofUrl = ""
      let finalProofPublicId = ""

      if (!skipProof && proofFile && !proofUrl) {
        const result = await uploadToCloudinary(proofFile)
        if (!result) { setSubmitting(false); return }
        finalProofUrl = result.secure_url
        finalProofPublicId = result.public_id
      } else if (!skipProof && proofUrl) {
        finalProofUrl = proofUrl
        finalProofPublicId = proofPublicId
      }

      const res = await fetch("/api/user/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId: selectedMethod._id,
          amount: parseFloat(amount),
          ...(finalProofUrl ? { proofUrl: finalProofUrl } : {}),
          ...(finalProofPublicId ? { proofPublicId: finalProofPublicId } : {}),
          ...(txReference ? { txReference } : {}),
          ...(notes ? { notes } : {}),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to submit deposit")
        setSubmitting(false)
        return
      }

      setStep("success")
    } catch {
      setError("Network error. Please try again.")
    }
    setSubmitting(false)
  }, [selectedMethod, amount, proofUrl, proofPublicId, proofFile, txReference, notes, uploadToCloudinary])

  // Is credit card method? Only a method explicitly slugged "credit-card" collects
  // card details. A wire transfer must show the admin's bank details (info step),
  // NOT a card form — that was the bug that routed wire deposits into "Card Details".
  const isCreditCard = selectedMethod?.slug === "credit-card"
  const isGiftCardStep = step === "giftcard"

  // Navigation
  const goBack = () => {
    if (step === "giftcard" || step === "success") { setStep("method"); return }
    const flowSteps: string[] = isCreditCard
      ? ["method", "amount", "card"]
      : ["method", "amount", "info", "proof"]
    const idx = flowSteps.indexOf(step)
    if (idx > 0) setStep(flowSteps[idx - 1] as Step)
    else router.back()
  }

  const canProceedAmount = parseFloat(amount) > 0

  // Credit card validation
  const cardNumberClean = cardNumber.replace(/\s/g, "")
  const canSubmitCard = cardNumberClean.length >= 15 && cardExpiry.length >= 4 && cardCvv.length >= 3 && cardHolder.trim().length >= 2

  // Gift card file handler
  const handleGcFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError("File size must be under 10MB"); return }
    setGcFile(file); setError("")
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => setGcPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else { setGcPreview("") }
  }, [])

  // Gift card validation
  const canSubmitGiftCard = gcType.length > 0 && 
    parseFloat(gcAmount) > 0 && 
    (gcType !== "other" || gcCustomType.trim().length > 0) &&
    (gcIsVirtual ? gcCardCode.trim().length >= 8 : !!gcFile)

  // Gift card submit
  const handleGiftCardSubmit = useCallback(async () => {
    if (!canSubmitGiftCard) return
    if (!gcIsVirtual && !gcFile) return
    setSubmitting(true)
    setError("")
    try {
      let finalUrl = ""
      let finalPublicId = ""
      
      // Upload gift card image only for physical cards
      if (!gcIsVirtual && gcFile) {
        if (!gcProofUrl) {
          const result = await uploadToCloudinary(gcFile)
          if (!result) { setSubmitting(false); return }
          finalUrl = result.secure_url
          finalPublicId = result.public_id
          setGcProofUrl(finalUrl)
          setGcProofPublicId(finalPublicId)
        } else {
          finalUrl = gcProofUrl
          finalPublicId = gcProofPublicId
        }
      }

      const cardLabel = gcType === "other" ? gcCustomType : GIFT_CARD_TYPES.find(t => t.key === gcType)?.label || gcType
      const notes = gcIsVirtual 
        ? `Gift Card: ${cardLabel} (Virtual)\nCode: ${gcCardCode}${gcCardPin ? `\nPIN: ${gcCardPin}` : ""}`
        : `Gift Card: ${cardLabel}`

      // Use selectedMethod._id if available (from admin payment methods), otherwise find giftcard method
      const giftcardMethod = selectedMethod || methods.find(m => m.type === "giftcard")
      if (!giftcardMethod) {
        setError("Gift card payment method not configured. Please contact support.")
        setSubmitting(false)
        return
      }

      const res = await fetch("/api/user/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId: giftcardMethod._id,
          amount: parseFloat(gcAmount),
          ...(finalUrl ? { proofUrl: finalUrl } : {}),
          ...(finalPublicId ? { proofPublicId: finalPublicId } : {}),
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to submit gift card deposit")
        setSubmitting(false)
        return
      }
      setAmount(gcAmount)
      setStep("success")
    } catch {
      setError("Network error. Please try again.")
    }
    setSubmitting(false)
  }, [canSubmitGiftCard, gcIsVirtual, gcFile, gcType, gcAmount, gcCustomType, gcCardCode, gcCardPin, gcProofUrl, gcProofPublicId, uploadToCloudinary, selectedMethod, methods])

  // Progress bar
  const STEPS: Step[] = step === "giftcard"
    ? ["method", "giftcard"]
    : isCreditCard
      ? ["method", "amount", "card"]
      : ["method", "amount", "info", "proof"]
  const stepIdx = STEPS.indexOf(step)
  const progress = step === "success" ? 100 : ((stepIdx + 1) / STEPS.length) * 100

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <UserHeader title="Deposit Funds" showBack />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 120px" }}>

        {/* Progress bar */}
        {step !== "success" && (
          <div style={{ padding: "16px 0 8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              {STEPS.map((s, i) => (
                <span key={s} style={{
                  fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                  color: i <= stepIdx ? colors.blue : colors.textMuted,
                }}>
                  {s === "method" ? "Method" : s === "amount" ? "Amount" : s === "card" ? "Card" : s === "info" ? "Details" : s === "giftcard" ? "Gift Card" : "Proof"}
                </span>
              ))}
            </div>
            <div style={{ height: 3, borderRadius: 2, background: colors.bgHover }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: colors.blue,
                width: `${progress}%`, transition: "width 300ms ease",
              }} />
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            background: colors.redBg, border: `1px solid ${colors.red}33`,
            borderRadius: 12, padding: "10px 14px", marginTop: 12,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <AlertTriangle style={{ width: 16, height: 16, color: colors.red, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: colors.red }}>{error}</span>
            <X onClick={() => setError("")} style={{ width: 14, height: 14, color: colors.red, marginLeft: "auto", cursor: "pointer", opacity: 0.6 }} />
          </div>
        )}

        {/* ═══ STEP 1: CHOOSE METHOD ═══ */}
        {step === "method" && (
          <div style={{ paddingTop: 20 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Choose Payment Method</p>
            <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 20px" }}>
              Select how you'd like to fund your account
            </p>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <Loader2 style={{ width: 28, height: 28, color: colors.blue, animation: "spin 1s linear infinite" }} />
              </div>
            ) : methods.length === 0 ? (
              <div style={{
                background: colors.bgHover, border: `1px solid ${colors.border}`,
                borderRadius: 16, padding: "32px 20px", textAlign: "center",
              }}>
                <Info style={{ width: 24, height: 24, color: colors.textMuted, margin: "0 auto 8px" }} />
                <p style={{ fontSize: 14, color: colors.textTertiary, margin: 0 }}>
                  No deposit methods are currently available. Please contact support.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {methods.map((m) => {
                  const meta = getMeta(m.type)
                  const Icon = meta.icon
                  const isPayPal = m.type === "paypal"
                  const isUSDT = m.type === "crypto_other"
                  const isGiftCard = m.type === "giftcard"
                  const hasLogo = !!m.logoUrl
                  
                  // For giftcard type, go to giftcard step
                  const handleClick = () => {
                    if (isGiftCard) {
                      setSelectedMethod(m)
                      setGcType(""); setGcAmount(""); setGcCustomType(""); setGcFile(null); setGcPreview(""); setGcProofUrl(""); setGcProofPublicId(""); setGcIsVirtual(false); setGcCardCode(""); setGcCardPin("")
                      setStep("giftcard")
                    } else {
                      setSelectedMethod(m)
                      setStep("amount")
                    }
                  }
                  
                  return (
                    <div
                      key={m._id}
                      onClick={handleClick}
                      className="pressable"
                      style={{
                        background: colors.bgElevated,
                        border: `1px solid ${isGiftCard ? "rgba(236,72,153,0.15)" : colors.border}`,
                        borderRadius: 16, padding: "16px 14px",
                        display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                      }}
                    >
                      {/* Logo or Icon */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: meta.bg,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        overflow: "hidden",
                        position: "relative",
                      }}>
                        {hasLogo ? (
                          <Image 
                            src={m.logoUrl!} 
                            alt={m.name} 
                            fill 
                            className="object-contain p-1.5" 
                            sizes="48px"
                          />
                        ) : isPayPal ? (
                          <PayPalIcon size={24} />
                        ) : isUSDT ? (
                          <USDTIcon size={24} />
                        ) : (
                          <Icon style={{ width: 22, height: 22, color: meta.color }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>{m.name}</p>
                        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                          {m.feePercent === 0 && m.feeFixed === 0 && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: colors.green }}>0% Fee</span>
                          )}
                          {(m.feePercent > 0 || m.feeFixed > 0) && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: colors.yellow }}>
                              {m.feePercent > 0 ? `${m.feePercent}% Fee` : `${currencySymbol}${m.feeFixed} Fee`}
                            </span>
                          )}
                          {m.minAmount > 0 && (
                            <span style={{ fontSize: 10, color: colors.textMuted }}>
                              Min: {currencySymbol}{m.minAmount}
                            </span>
                          )}
                          {isGiftCard && m.paymentInfo?.acceptedBrands && m.paymentInfo.acceptedBrands.length > 0 && (
                            <span style={{ fontSize: 10, color: colors.textMuted }}>
                              {m.paymentInfo.acceptedBrands.slice(0, 3).join(", ")}{m.paymentInfo.acceptedBrands.length > 3 ? "..." : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight style={{ width: 18, height: 18, color: colors.textMuted, flexShrink: 0 }} />
                    </div>
                  )
                })}

                {/* Gift Cards — static fallback option (only show if no giftcard payment method exists) */}
                {!methods.some(m => m.type === "giftcard") && (
                <div
                  onClick={() => {
                    setSelectedMethod(null); setGcType(""); setGcAmount(""); setGcCustomType(""); setGcFile(null); setGcPreview(""); setGcProofUrl(""); setGcProofPublicId(""); setGcIsVirtual(false); setGcCardCode(""); setGcCardPin("")
                    setStep("giftcard")
                  }}
                  className="pressable"
                  style={{
                    background: colors.bgElevated,
                    border: "1px solid rgba(236,72,153,0.15)",
                    borderRadius: 16, padding: "16px 14px",
                    display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: "rgba(236,72,153,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Gift style={{ width: 22, height: 22, color: "#EC4899" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Gift Cards</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: colors.green, background: colors.greenBg, padding: "1px 6px", borderRadius: 6 }}>USD</span>
                      <span style={{ fontSize: 10, color: colors.textMuted }}>Amazon, iTunes, Google Play &amp; more</span>
                    </div>
                  </div>
                  <ChevronRight style={{ width: 18, height: 18, color: colors.textMuted, flexShrink: 0 }} />
                </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2: ENTER AMOUNT ═══ */}
        {step === "amount" && selectedMethod && (
          <div style={{ paddingTop: 20 }}>
            <button onClick={goBack} style={{ background: "none", border: "none", color: colors.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>

            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Enter Amount</p>
            <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 24px" }}>
              How much would you like to deposit via {selectedMethod.name}?
            </p>

            {/* Amount input */}
            <div style={{
              background: colors.bgElevated, border: `1px solid ${colors.border}`,
              borderRadius: 16, padding: "24px 20px", textAlign: "center", marginBottom: 16,
            }}>
              <span style={{ fontSize: 14, color: colors.textTertiary, marginBottom: 8, display: "block" }}>
                {currencyCode}
              </span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: colors.textMuted }}>
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    background: "transparent", border: "none", outline: "none",
                    fontSize: 36, fontWeight: 700, color: colors.textPrimary,
                    width: "100%", maxWidth: 200, textAlign: "center",
                  }}
                />
              </div>
              {selectedMethod.feePercent > 0 && parseFloat(amount) > 0 && (
                <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
                  Fee: {formatAmount(parseFloat(amount) * selectedMethod.feePercent / 100)}
                </p>
              )}
              {selectedMethod.feeFixed > 0 && parseFloat(amount) > 0 && (
                <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
                  Fee: {formatAmount(selectedMethod.feeFixed)}
                </p>
              )}
            </div>

            {/* Min / max hints */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "center" }}>
              {selectedMethod.minAmount > 0 && (
                <span style={{ fontSize: 11, color: colors.textMuted, background: colors.bgHover, padding: "4px 10px", borderRadius: 8 }}>
                  Min: {currencySymbol}{selectedMethod.minAmount}
                </span>
              )}
              {selectedMethod.maxAmount > 0 && (
                <span style={{ fontSize: 11, color: colors.textMuted, background: colors.bgHover, padding: "4px 10px", borderRadius: 8 }}>
                  Max: {currencySymbol}{selectedMethod.maxAmount}
                </span>
              )}
            </div>

            {/* Quick amounts */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
              {[50, 100, 250, 500, 1000].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  style={{
                    background: amount === String(v) ? colors.blueBg : colors.bgElevated,
                    border: `1px solid ${amount === String(v) ? colors.blue : colors.border}`,
                    borderRadius: 10, padding: "8px 16px", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                    color: amount === String(v) ? colors.blue : colors.textSecondary,
                  }}
                >
                  {currencySymbol}{v}
                </button>
              ))}
            </div>

            {/* Continue */}
            <button
              onClick={() => canProceedAmount && setStep(isCreditCard ? "card" : "info")}
              disabled={!canProceedAmount}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: canProceedAmount ? colors.blue : colors.bgHover,
                color: canProceedAmount ? "#fff" : colors.textMuted,
                fontSize: 15, fontWeight: 700, cursor: canProceedAmount ? "pointer" : "default",
                transition: "opacity 200ms",
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* ═══ STEP 3A: CREDIT CARD DETAILS ═══ */}
        {step === "card" && selectedMethod && (
          <div style={{ paddingTop: 20 }}>
            <button onClick={goBack} style={{ background: "none", border: "none", color: colors.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>

            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Card Details</p>
            <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 20px" }}>
              Enter your credit or debit card information
            </p>

            {/* Card visual preview */}
            <div style={{
              background: "linear-gradient(135deg, #1a1a3e 0%, #2d1b69 50%, #1a1a3e 100%)",
              borderRadius: 18, padding: "22px 20px", marginBottom: 20,
              position: "relative", overflow: "hidden", minHeight: 180,
            }}>
              {/* Card chip */}
              <div style={{
                width: 40, height: 28, borderRadius: 6,
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                marginBottom: 20, opacity: 0.8,
              }} />
              {/* Card number */}
              <p style={{
                fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "2px",
                fontFamily: "monospace", margin: "0 0 16px",
              }}>
                {cardNumber || "•••• •••• •••• ••••"}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Card Holder</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "2px 0 0", textTransform: "uppercase" }}>
                    {cardHolder || "YOUR NAME"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Expires</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "2px 0 0" }}>
                    {cardExpiry || "MM/YY"}
                  </p>
                </div>
              </div>
              {/* Decorative circles */}
              <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
              <div style={{ position: "absolute", bottom: -30, right: 30, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.02)" }} />
            </div>

            {/* Card number input */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textTertiary, marginBottom: 6, display: "block" }}>
                Card Number
              </label>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: colors.bgElevated, border: `1px solid ${colors.border}`,
                borderRadius: 12, padding: "0 14px",
              }}>
                <CreditCard style={{ width: 18, height: 18, color: colors.textMuted, flexShrink: 0 }} />
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 16)
                    setCardNumber(v.replace(/(\d{4})(?=\d)/g, "$1 "))
                  }}
                  placeholder="1234 5678 9012 3456"
                  style={{
                    flex: 1, padding: "12px 0", background: "transparent", border: "none",
                    outline: "none", color: colors.textPrimary, fontSize: 15, letterSpacing: "1px",
                  }}
                />
              </div>
            </div>

            {/* Expiry + CVV row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.textTertiary, marginBottom: 6, display: "block" }}>
                  Expiry Date
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardExpiry}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "").slice(0, 4)
                    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2)
                    setCardExpiry(v)
                  }}
                  placeholder="MM/YY"
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12, boxSizing: "border-box",
                    background: colors.bgElevated, border: `1px solid ${colors.border}`,
                    color: colors.textPrimary, fontSize: 15, outline: "none", letterSpacing: "1px",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.textTertiary, marginBottom: 6, display: "block" }}>
                  CVV
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="•••"
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12, boxSizing: "border-box",
                    background: colors.bgElevated, border: `1px solid ${colors.border}`,
                    color: colors.textPrimary, fontSize: 15, outline: "none", letterSpacing: "2px",
                  }}
                />
              </div>
            </div>

            {/* Cardholder name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textTertiary, marginBottom: 6, display: "block" }}>
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                placeholder="John Doe"
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, boxSizing: "border-box",
                  background: colors.bgElevated, border: `1px solid ${colors.border}`,
                  color: colors.textPrimary, fontSize: 15, outline: "none",
                }}
              />
            </div>

            {/* Amount summary */}
            <div style={{
              background: colors.bgHover, borderRadius: 12, padding: "12px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
            }}>
              <span style={{ fontSize: 13, color: colors.textTertiary }}>Deposit Amount</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{currencySymbol}{parseFloat(amount).toLocaleString()}</span>
            </div>
            {selectedMethod.feePercent > 0 && (
              <div style={{
                background: colors.bgHover, borderRadius: 12, padding: "12px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
              }}>
                <span style={{ fontSize: 13, color: colors.textTertiary }}>Processing Fee ({selectedMethod.feePercent}%)</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.yellow }}>{currencySymbol}{(parseFloat(amount) * selectedMethod.feePercent / 100).toFixed(2)}</span>
              </div>
            )}

            {/* Secure badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", margin: "16px 0" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill={colors.green} fillOpacity="0.2" stroke={colors.green} strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke={colors.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: 11, color: colors.textMuted }}>256-bit SSL Encrypted • Secure Payment</span>
            </div>

            {/* Pay button */}
            <button
              onClick={() => canSubmitCard && handleSubmit(true)}
              disabled={!canSubmitCard || submitting}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: (canSubmitCard && !submitting) ? colors.green : colors.bgHover,
                color: (canSubmitCard && !submitting) ? "#fff" : colors.textMuted,
                fontSize: 15, fontWeight: 700,
                cursor: (canSubmitCard && !submitting) ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {submitting ? (
                <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Processing...</>
              ) : (
                <>Pay {currencySymbol}{parseFloat(amount).toLocaleString()}</>
              )}
            </button>
          </div>
        )}

        {/* ═══ STEP 3: PAYMENT INFO ═══ */}
        {step === "info" && selectedMethod && (
          <div style={{ paddingTop: 20 }}>
            <button onClick={goBack} style={{ background: "none", border: "none", color: colors.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>

            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Payment Details</p>
            <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 20px" }}>
              Send exactly <strong style={{ color: colors.textPrimary }}>
                {formatAmount(parseFloat(amount))}
              </strong> using the details below
            </p>

            {/* Summary card */}
            <div style={{
              background: colors.bgElevated, border: `1px solid ${colors.border}`,
              borderRadius: 16, padding: "16px", marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                {(() => {
                  const meta = getMeta(selectedMethod.type)
                  const Icon = meta.icon
                  const isPayPal = selectedMethod.type === "paypal"
                  const isUSDT = selectedMethod.type === "crypto_other"
                  return (
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isPayPal ? <PayPalIcon size={20} /> : isUSDT ? <USDTIcon size={20} /> : <Icon style={{ width: 18, height: 18, color: meta.color }} />}
                    </div>
                  )
                })()}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>{selectedMethod.name}</p>
                  <p style={{ fontSize: 12, color: colors.textTertiary, margin: 0 }}>
                    {currencySymbol}{parseFloat(amount).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Payment Info based on method type */}
              {selectedMethod.paymentInfo && (
                <div style={{
                  background: colors.bgHover, borderRadius: 12, padding: "14px",
                  fontSize: 13, color: colors.textSecondary,
                }}>
                  {/* Crypto: Show QR Code + Wallet Address */}
                  {(selectedMethod.type === "bitcoin" || selectedMethod.type === "crypto_other") && selectedMethod.paymentInfo.walletAddress && (
                    <div style={{ textAlign: "center" }}>
                      {/* QR Code */}
                      <div style={{
                        background: "#fff", borderRadius: 12, padding: 16,
                        display: "inline-block", marginBottom: 16,
                      }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedMethod.paymentInfo.walletAddress)}`}
                          alt="Wallet QR Code"
                          style={{ width: 180, height: 180, display: "block" }}
                        />
                      </div>
                      
                      {/* Network */}
                      {selectedMethod.paymentInfo.network && (
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Network</span>
                          <p style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, margin: "4px 0 0" }}>
                            {selectedMethod.paymentInfo.network}
                          </p>
                        </div>
                      )}
                      
                      {/* Wallet Address */}
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Wallet Address</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, justifyContent: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: colors.textPrimary, wordBreak: "break-all", fontFamily: "monospace" }}>
                            {selectedMethod.paymentInfo.walletAddress}
                          </span>
                        </div>
                        <button
                          onClick={() => copyText(selectedMethod.paymentInfo!.walletAddress!, "Wallet")}
                          style={{
                            background: copied === "Wallet" ? colors.greenBg : colors.bgElevated,
                            border: `1px solid ${copied === "Wallet" ? colors.green : colors.border}`,
                            borderRadius: 10, padding: "8px 16px", cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
                          }}
                        >
                          {copied === "Wallet" ? (
                            <CheckCircle2 style={{ width: 14, height: 14, color: colors.green }} />
                          ) : (
                            <Copy style={{ width: 14, height: 14, color: colors.textMuted }} />
                          )}
                          <span style={{ fontSize: 12, fontWeight: 600, color: copied === "Wallet" ? colors.green : colors.textSecondary }}>
                            {copied === "Wallet" ? "Copied!" : "Copy Address"}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer / Wire: Show bank details */}
                  {(selectedMethod.type === "bank_transfer" || selectedMethod.type === "wire") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {selectedMethod.paymentInfo.bankName && (
                        <InfoRow label="Bank Name" value={selectedMethod.paymentInfo.bankName} onCopy={copyText} copied={copied} colors={colors} />
                      )}
                      {selectedMethod.paymentInfo.accountName && (
                        <InfoRow label="Account Name" value={selectedMethod.paymentInfo.accountName} onCopy={copyText} copied={copied} colors={colors} />
                      )}
                      {selectedMethod.paymentInfo.accountNumber && (
                        <InfoRow label="Account Number" value={selectedMethod.paymentInfo.accountNumber} onCopy={copyText} copied={copied} colors={colors} />
                      )}
                      {selectedMethod.paymentInfo.routingNumber && (
                        <InfoRow label="Routing Number" value={selectedMethod.paymentInfo.routingNumber} onCopy={copyText} copied={copied} colors={colors} />
                      )}
                      {selectedMethod.paymentInfo.swiftCode && (
                        <InfoRow label="SWIFT Code" value={selectedMethod.paymentInfo.swiftCode} onCopy={copyText} copied={copied} colors={colors} />
                      )}
                      {selectedMethod.paymentInfo.iban && (
                        <InfoRow label="IBAN" value={selectedMethod.paymentInfo.iban} onCopy={copyText} copied={copied} colors={colors} />
                      )}
                      {selectedMethod.paymentInfo.bankAddress && (
                        <InfoRow label="Bank Address" value={selectedMethod.paymentInfo.bankAddress} onCopy={copyText} copied={copied} colors={colors} />
                      )}
                      {selectedMethod.paymentInfo.phoneNumber && (
                        <InfoRow label="Phone Number" value={selectedMethod.paymentInfo.phoneNumber} onCopy={copyText} copied={copied} colors={colors} />
                      )}
                    </div>
                  )}

                  {/* PayPal / Venmo / Zelle / Cash App: Show email/username/phone */}
                  {(selectedMethod.type === "paypal" || selectedMethod.type === "venmo" || selectedMethod.type === "zelle" || selectedMethod.type === "cash_app") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {selectedMethod.paymentInfo.email && (
                        <InfoRow label="Email" value={selectedMethod.paymentInfo.email} onCopy={copyText} copied={copied} colors={colors} />
                      )}
                      {selectedMethod.paymentInfo.username && (
                        <InfoRow label={selectedMethod.type === "cash_app" ? "Cash Tag" : "Username"} value={selectedMethod.paymentInfo.username} onCopy={copyText} copied={copied} colors={colors} />
                      )}
                      {selectedMethod.paymentInfo.phoneNumber && (
                        <InfoRow label="Phone Number" value={selectedMethod.paymentInfo.phoneNumber} onCopy={copyText} copied={copied} colors={colors} />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Fallback: Instructions text (markdown-lite) */}
              {selectedMethod.instructions && !selectedMethod.paymentInfo && (
                <div style={{
                  background: colors.bgHover, borderRadius: 12, padding: "14px",
                  fontSize: 13, color: colors.textSecondary, lineHeight: 1.7,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {selectedMethod.instructions.split("\n").map((line, i) => {
                    const match = line.match(/^(.+?):\s*(.+)$/)
                    if (match) {
                      const label = match[1].trim()
                      const value = match[2].trim()
                      return (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <span style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, flex: 1, wordBreak: "break-all" }}>{value}</span>
                            <button
                              onClick={() => copyText(value, label)}
                              style={{
                                background: copied === label ? colors.greenBg : colors.bgElevated,
                                border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 4,
                              }}
                            >
                              {copied === label ? (
                                <CheckCircle2 style={{ width: 12, height: 12, color: colors.green }} />
                              ) : (
                                <Copy style={{ width: 12, height: 12, color: colors.textMuted }} />
                              )}
                              <span style={{ fontSize: 10, fontWeight: 600, color: copied === label ? colors.green : colors.textMuted }}>
                                {copied === label ? "Copied" : "Copy"}
                              </span>
                            </button>
                          </div>
                        </div>
                      )
                    }
                    return <p key={i} style={{ margin: "0 0 4px" }}>{line}</p>
                  })}
                </div>
              )}

              {/* Additional instructions if both paymentInfo and instructions exist */}
              {selectedMethod.instructions && selectedMethod.paymentInfo && (
                <div style={{
                  background: colors.bgHover, borderRadius: 12, padding: "14px", marginTop: 12,
                  fontSize: 13, color: colors.textSecondary, lineHeight: 1.6,
                }}>
                  <p style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Instructions</p>
                  <div style={{ whiteSpace: "pre-wrap" }}>{selectedMethod.instructions}</div>
                </div>
              )}
            </div>

            {/* Warning */}
            <div style={{
              background: colors.yellowBg, border: `1px solid ${colors.yellow}26`,
              borderRadius: 12, padding: "10px 14px", marginBottom: 20,
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <Clock style={{ width: 16, height: 16, color: colors.yellow, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: colors.yellow, lineHeight: 1.5, margin: 0 }}>
                After sending the payment, proceed to upload your proof of payment. Your deposit will be reviewed and credited within 1-24 hours.
              </p>
            </div>

            {/* Continue */}
            <button
              onClick={() => setStep("proof")}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: colors.blue,
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              I've Sent the Payment <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}

        {/* ═══ STEP 4: UPLOAD PROOF ═══ */}
        {step === "proof" && selectedMethod && (
          <div style={{ paddingTop: 20 }}>
            <button onClick={goBack} style={{ background: "none", border: "none", color: colors.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>

            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Upload Payment Proof</p>
            <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 20px" }}>
              Upload a screenshot or receipt of your payment
            </p>

            {/* File upload area */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            {!proofFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: colors.bgHover,
                  border: `2px dashed ${colors.border}`,
                  borderRadius: 16, padding: "40px 20px", textAlign: "center",
                  cursor: "pointer", marginBottom: 16,
                  transition: "border-color 200ms",
                }}
              >
                <Upload style={{ width: 32, height: 32, color: colors.textMuted, margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: colors.textSecondary, margin: "0 0 4px" }}>
                  Tap to upload
                </p>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
                  PNG, JPG, or PDF — Max 10MB
                </p>
              </div>
            ) : (
              <div style={{
                background: colors.bgElevated, border: `1px solid ${colors.border}`,
                borderRadius: 16, padding: "14px", marginBottom: 16,
              }}>
                {proofPreview ? (
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 10, background: colors.bgHover }}
                    />
                    <button
                      onClick={() => { setProofFile(null); setProofPreview(""); setProofUrl(""); setProofPublicId("") }}
                      style={{
                        position: "absolute", top: 8, right: 8,
                        width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)", border: "none",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      }}
                    >
                      <X style={{ width: 14, height: 14, color: "#fff" }} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <FileText style={{ width: 20, height: 20, color: colors.blue }} />
                    <span style={{ fontSize: 13, color: colors.textPrimary, flex: 1 }}>{proofFile.name}</span>
                    <button
                      onClick={() => { setProofFile(null); setProofPreview(""); setProofUrl(""); setProofPublicId("") }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                    >
                      <X style={{ width: 14, height: 14, color: colors.textMuted }} />
                    </button>
                  </div>
                )}
                <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>
                  {(proofFile.size / 1024).toFixed(0)} KB — {proofFile.type || "document"}
                </p>
              </div>
            )}

            {/* Optional reference */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textTertiary, marginBottom: 6, display: "block" }}>
                Transaction Reference (optional)
              </label>
              <input
                type="text"
                value={txReference}
                onChange={(e) => setTxReference(e.target.value)}
                placeholder="e.g. TX-12345 or bank reference"
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  background: colors.bgElevated, border: `1px solid ${colors.border}`,
                  color: colors.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Optional notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textTertiary, marginBottom: 6, display: "block" }}>
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information..."
                rows={3}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  background: colors.bgElevated, border: `1px solid ${colors.border}`,
                  color: colors.textPrimary, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting || uploading || !proofFile}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: (submitting || uploading || !proofFile) ? colors.bgHover : colors.green,
                color: (submitting || uploading || !proofFile) ? colors.textMuted : "#fff",
                fontSize: 15, fontWeight: 700,
                cursor: (submitting || uploading || !proofFile) ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {uploading ? (
                <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Uploading...</>
              ) : submitting ? (
                <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Submitting...</>
              ) : (
                <>Submit Deposit Request</>
              )}
            </button>

            {/* Skip proof option */}
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              style={{
                width: "100%", padding: "12px 0", marginTop: 10,
                background: "none", border: "none",
                color: colors.textMuted, fontSize: 13, fontWeight: 500,
                cursor: "pointer", textDecoration: "underline",
              }}
            >
              Skip — upload proof later
            </button>
          </div>
        )}

        {/* ═══ GIFT CARD STEP ═══ */}
        {step === "giftcard" && (
          <div style={{ paddingTop: 20 }}>
            <button onClick={goBack} style={{ background: "none", border: "none", color: colors.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>

            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Redeem Gift Card</p>
            <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 20px" }}>
              Enter your gift card details to deposit funds
            </p>

            {/* Card type selection */}
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary, marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Gift Card Type
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
              {GIFT_CARD_TYPES.map((t) => {
                const selected = gcType === t.key
                return (
                  <div
                    key={t.key}
                    onClick={() => setGcType(t.key)}
                    className="pressable"
                    style={{
                      background: selected ? "rgba(236,72,153,0.08)" : colors.bgElevated,
                      border: `1px solid ${selected ? "rgba(236,72,153,0.3)" : colors.border}`,
                      borderRadius: 12, padding: "10px 8px", cursor: "pointer",
                      textAlign: "center", transition: "all 200ms ease",
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, margin: "0 auto 6px",
                      background: selected ? `${t.color}26` : colors.bgHover,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Gift style={{ width: 14, height: 14, color: selected ? "#EC4899" : colors.textMuted }} />
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: selected ? colors.textPrimary : colors.textSecondary, margin: 0, lineHeight: 1.2 }}>{t.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Custom type input (when "Other" selected) */}
            {gcType === "other" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Card Brand Name
                </label>
                <input
                  type="text"
                  value={gcCustomType}
                  onChange={(e) => setGcCustomType(e.target.value)}
                  placeholder="e.g. Starbucks, Netflix, etc."
                  style={{
                    width: "100%", padding: "13px 14px", borderRadius: 14, boxSizing: "border-box",
                    background: colors.bgElevated, border: `1px solid ${colors.border}`,
                    color: colors.textPrimary, fontSize: 14, fontWeight: 500, outline: "none",
                  }}
                />
              </div>
            )}

            {/* Physical vs Virtual toggle */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary, marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Card Type
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setGcIsVirtual(false); setGcCardCode(""); setGcCardPin("") }}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer",
                    background: !gcIsVirtual ? "rgba(236,72,153,0.1)" : colors.bgElevated,
                    border: `1px solid ${!gcIsVirtual ? "rgba(236,72,153,0.3)" : colors.border}`,
                    color: !gcIsVirtual ? "#EC4899" : colors.textSecondary,
                    fontSize: 13, fontWeight: 600,
                  }}
                >
                  <ImageIcon style={{ width: 16, height: 16, marginBottom: 4, display: "block", margin: "0 auto 4px" }} />
                  Physical Card
                </button>
                <button
                  onClick={() => { setGcIsVirtual(true); setGcFile(null); setGcPreview("") }}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer",
                    background: gcIsVirtual ? "rgba(236,72,153,0.1)" : colors.bgElevated,
                    border: `1px solid ${gcIsVirtual ? "rgba(236,72,153,0.3)" : colors.border}`,
                    color: gcIsVirtual ? "#EC4899" : colors.textSecondary,
                    fontSize: 13, fontWeight: 600,
                  }}
                >
                  <FileText style={{ width: 16, height: 16, marginBottom: 4, display: "block", margin: "0 auto 4px" }} />
                  E-Gift Card
                </button>
              </div>
            </div>

            {/* Virtual card: Code input */}
            {gcIsVirtual ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary, marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Gift Card Code
                </label>
                <input
                  type="text"
                  value={gcCardCode}
                  onChange={(e) => setGcCardCode(e.target.value.toUpperCase())}
                  placeholder="Enter gift card code"
                  style={{
                    width: "100%", padding: "14px", borderRadius: 14, boxSizing: "border-box",
                    background: colors.bgElevated, border: `1px solid ${colors.border}`,
                    color: colors.textPrimary, fontSize: 16, fontWeight: 600, outline: "none",
                    fontFamily: "monospace", letterSpacing: "2px", textAlign: "center",
                  }}
                />
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    PIN (if applicable)
                  </label>
                  <input
                    type="text"
                    value={gcCardPin}
                    onChange={(e) => setGcCardPin(e.target.value)}
                    placeholder="Enter PIN (optional)"
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 12, boxSizing: "border-box",
                      background: colors.bgElevated, border: `1px solid ${colors.border}`,
                      color: colors.textPrimary, fontSize: 14, fontWeight: 500, outline: "none",
                      fontFamily: "monospace", letterSpacing: "1px", textAlign: "center",
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Physical card: Image upload */}
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary, marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Gift Card Photo (scratched, showing code)
                </label>
            <input
              ref={gcFileRef}
              type="file"
              accept="image/*"
              onChange={handleGcFileSelect}
              style={{ display: "none" }}
            />

            {!gcFile ? (
              <div
                onClick={() => gcFileRef.current?.click()}
                style={{
                  background: colors.bgHover,
                  border: "2px dashed rgba(236,72,153,0.2)",
                  borderRadius: 16, padding: "32px 20px", textAlign: "center",
                  cursor: "pointer", marginBottom: 16,
                  transition: "border-color 200ms",
                }}
              >
                <Upload style={{ width: 28, height: 28, color: "rgba(236,72,153,0.4)", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: colors.textSecondary, margin: "0 0 4px" }}>
                  Tap to upload gift card photo
                </p>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
                  Clear photo of the scratched card showing the code
                </p>
              </div>
            ) : (
              <div style={{
                background: colors.bgElevated, border: "1px solid rgba(236,72,153,0.15)",
                borderRadius: 16, padding: "12px", marginBottom: 16,
              }}>
                {gcPreview && (
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    <img
                      src={gcPreview}
                      alt="Gift card"
                      style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 10, background: colors.bgHover }}
                    />
                    <button
                      onClick={() => { setGcFile(null); setGcPreview(""); setGcProofUrl(""); setGcProofPublicId("") }}
                      style={{
                        position: "absolute", top: 8, right: 8,
                        width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)", border: "none",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      }}
                    >
                      <X style={{ width: 14, height: 14, color: "#fff" }} />
                    </button>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 style={{ width: 14, height: 14, color: colors.green, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}>{gcFile.name}</span>
                  <span style={{ fontSize: 11, color: colors.textMuted }}>{(gcFile.size / 1024).toFixed(0)} KB</span>
                </div>
              </div>
            )}
              </>
            )}

            {/* Gift card amount */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Card Value ({currencySymbol})
              </label>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: colors.bgElevated, border: `1px solid ${colors.border}`,
                borderRadius: 14, padding: "0 14px",
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: colors.textMuted }}>{currencySymbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={gcAmount}
                  onChange={(e) => setGcAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    flex: 1, padding: "13px 0", background: "transparent", border: "none",
                    outline: "none", color: colors.textPrimary, fontSize: 18, fontWeight: 700,
                  }}
                />
              </div>
            </div>

            {/* Quick amounts */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
              {[25, 50, 100, 200, 500].map((v) => (
                <button
                  key={v}
                  onClick={() => setGcAmount(String(v))}
                  style={{
                    background: gcAmount === String(v) ? "rgba(236,72,153,0.15)" : colors.bgElevated,
                    border: `1px solid ${gcAmount === String(v) ? "rgba(236,72,153,0.3)" : colors.border}`,
                    borderRadius: 10, padding: "8px 16px", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                    color: gcAmount === String(v) ? "#EC4899" : colors.textSecondary,
                  }}
                >
                  {currencySymbol}{v}
                </button>
              ))}
            </div>

            {/* Summary */}
            {canSubmitGiftCard && (
              <div style={{
                background: colors.bgHover, borderRadius: 12, padding: "12px 14px",
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>Card Type</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                    {gcType === "other" ? gcCustomType : GIFT_CARD_TYPES.find(t => t.key === gcType)?.label}
                    {gcIsVirtual && " (E-Gift)"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{gcIsVirtual ? "Code" : "Photo"}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.green, display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 style={{ width: 12, height: 12 }} /> {gcIsVirtual ? "Entered" : "Uploaded"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>Value</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.green }}>{currencySymbol}{parseFloat(gcAmount).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleGiftCardSubmit}
              disabled={!canSubmitGiftCard || submitting}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: (canSubmitGiftCard && !submitting)
                  ? "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)"
                  : colors.bgHover,
                color: (canSubmitGiftCard && !submitting) ? "#fff" : colors.textMuted,
                fontSize: 15, fontWeight: 700,
                cursor: (canSubmitGiftCard && !submitting) ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: (canSubmitGiftCard && !submitting) ? "0 4px 16px rgba(236,72,153,0.3)" : "none",
              }}
            >
              {submitting ? (
                <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Processing...</>
              ) : (
                <><Gift style={{ width: 16, height: 16 }} /> Redeem Gift Card</>
              )}
            </button>
          </div>
        )}

        {/* ═══ STEP 5: SUCCESS ═══ */}
        {step === "success" && (
          <div style={{ paddingTop: 48, textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: colors.greenBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <CheckCircle2 style={{ width: 36, height: 36, color: colors.green }} />
            </div>

            <p style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, margin: "0 0 8px" }}>
              Deposit Submitted!
            </p>
            <p style={{ fontSize: 14, color: colors.textTertiary, margin: "0 0 32px", lineHeight: 1.6 }}>
              Your deposit request is being reviewed.<br />
              You'll be notified once it's confirmed.
            </p>

            <div style={{
              background: colors.bgElevated, border: `1px solid ${colors.border}`,
              borderRadius: 14, padding: "16px", marginBottom: 24, textAlign: "left",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: colors.textMuted }}>Amount</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                  {currencySymbol}{parseFloat(amount).toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: colors.textMuted }}>Method</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                  {selectedMethod?.name || (gcType ? `Gift Card — ${gcType === "other" ? gcCustomType : GIFT_CARD_TYPES.find(t => t.key === gcType)?.label}` : "Gift Card")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: colors.textMuted }}>Status</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.yellow, background: colors.yellowBg, padding: "2px 8px", borderRadius: 6 }}>
                  Pending Review
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/app/dashboard")}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: colors.blue,
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10,
              }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push("/app/transactions")}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 14,
                background: colors.bgElevated, border: `1px solid ${colors.border}`,
                color: colors.textSecondary, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              View Transactions
            </button>
          </div>
        )}
      </div>

      {/* Spin animation for loaders */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
