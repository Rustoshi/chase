"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Wallet, Bitcoin, CheckCircle2,
  Loader2, X, AlertTriangle, Users, Search, Delete,
  Shield, Lock, Send, Globe, Copy, Check, Banknote,
  MoreHorizontal, Building, CreditCard, DollarSign,
  ShieldCheck, FileCheck, Printer, Download, Clock,
  Bookmark, UserPlus, ShieldAlert,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"
import { BANK_NAME } from "@/lib/brand"

// ── Types ────────────────────────────────────────────────────────────────────

type Step = "choose" | "method" | "recipient" | "amount" | "confirm" | "pin" | "code_verification" | "processing" | "success"

interface TransferCode {
  key: string
  label: string
  message: string
}

type IntlMethod = "bank" | "wire" | "crypto" | "paypal" | "wise" | "cashapp" | "zelle" | "venmo" | "revolut" | "westernunion" | "moneygram"

// IBAN country codes (ISO 3166-1 alpha-2) → country name. An IBAN always begins
// with the 2-letter country code, so the recipient country can be derived from it.
const IBAN_COUNTRY: Record<string, string> = {
  AD: "Andorra", AE: "United Arab Emirates", AL: "Albania", AT: "Austria", AZ: "Azerbaijan",
  BA: "Bosnia and Herzegovina", BE: "Belgium", BG: "Bulgaria", BH: "Bahrain", BR: "Brazil",
  BY: "Belarus", CH: "Switzerland", CR: "Costa Rica", CY: "Cyprus", CZ: "Czech Republic",
  DE: "Germany", DK: "Denmark", DO: "Dominican Republic", EE: "Estonia", EG: "Egypt",
  ES: "Spain", FI: "Finland", FO: "Faroe Islands", FR: "France", GB: "United Kingdom",
  GE: "Georgia", GI: "Gibraltar", GL: "Greenland", GR: "Greece", GT: "Guatemala",
  HR: "Croatia", HU: "Hungary", IE: "Ireland", IL: "Israel", IQ: "Iraq", IS: "Iceland",
  IT: "Italy", JO: "Jordan", KW: "Kuwait", KZ: "Kazakhstan", LB: "Lebanon", LC: "Saint Lucia",
  LI: "Liechtenstein", LT: "Lithuania", LU: "Luxembourg", LV: "Latvia", LY: "Libya",
  MC: "Monaco", MD: "Moldova", ME: "Montenegro", MK: "North Macedonia", MR: "Mauritania",
  MT: "Malta", MU: "Mauritius", NL: "Netherlands", NO: "Norway", PK: "Pakistan", PL: "Poland",
  PS: "Palestine", PT: "Portugal", QA: "Qatar", RO: "Romania", RS: "Serbia", SA: "Saudi Arabia",
  SC: "Seychelles", SE: "Sweden", SI: "Slovenia", SK: "Slovakia", SM: "San Marino",
  ST: "Sao Tome and Principe", SV: "El Salvador", TL: "Timor-Leste", TN: "Tunisia", TR: "Turkey",
  UA: "Ukraine", VA: "Vatican City", VG: "British Virgin Islands", XK: "Kosovo",
}

function deriveCountryFromIban(iban: string): string {
  const code = (iban || "").replace(/\s+/g, "").slice(0, 2).toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? (IBAN_COUNTRY[code] || "") : ""
}

interface AccountInfo {
  _id: string
  walletType: "fiat" | "bitcoin"
  accountNumber: string
  currency: string
  balance: number
  btcBalance: number
}

interface RecipientInfo {
  accountNumber: string
  walletType: string
  currency: string
  recipientName: string
}

interface Beneficiary {
  id: string
  type: "local" | "international"
  nickname: string
  accountNumber?: string
  recipientName?: string
  bankName?: string
  iban?: string
  swiftCode?: string
  routingNumber?: string
  bankAddress?: string
  country?: string
  currency?: string
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TransferPage() {
  return (
    <Suspense fallback={<TransferPageLoading />}>
      <TransferPageContent />
    </Suspense>
  )
}

function TransferPageLoading() {
  const colors = useThemeColors()
  return (
    <>
      <UserHeader title="Send Money" showBack />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", color: colors.textMuted }}>
        <Loader2 style={{ width: 32, height: 32, animation: "spin 1s linear infinite" }} />
      </div>
    </>
  )
}

function TransferPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const colors = useThemeColors()
  const { currency, symbol: currencySymbol, formatAmount } = useCurrency()

  // State
  const [step, setStep]                     = useState<Step>("choose")
  const [transferType, setTransferType]     = useState<"local" | "international">("local")
  const [intlMethod, setIntlMethod]         = useState<IntlMethod | null>(null)
  const [showMoreMethods, setShowMoreMethods] = useState(false)

  // International method-specific fields
  const [intlFields, setIntlFields] = useState<Record<string, string>>({})
  const updateIntlField = (key: string, value: string) => setIntlFields((prev) => {
    const next = { ...prev, [key]: value }
    // For bank transfers, the recipient country is derived from the IBAN.
    if (intlMethod === "bank" && key === "accountNumber") {
      next.recipientCountry = deriveCountryFromIban(value)
    }
    return next
  })
  const [accounts, setAccounts]             = useState<AccountInfo[]>([])
  const [loading, setLoading]               = useState(true)
  const [recipientId, setRecipientId]       = useState("") // account number
  const [lookingUp, setLookingUp]           = useState(false)
  const [recipient, setRecipient]           = useState<RecipientInfo | null>(null)
  const [amount, setAmount]                 = useState("")
  const [btcRate, setBtcRate]               = useState<number | null>(null) // price of 1 BTC in the user's currency (CoinGecko)
  const [description, setDescription]       = useState("")
  const [pin, setPin]                       = useState("")
  const [submitting, setSubmitting]         = useState(false)
  const [error, setError]                   = useState("")
  // Compliance (money-laundering) flag — blocks the whole flow up-front.
  const [amlBlock, setAmlBlock]             = useState<{ flagged: boolean; reason: string }>({ flagged: false, reason: "" })
  const [txResult, setTxResult]             = useState<{
    reference: string; amount: number; currency: string; recipientName: string; timestamp?: string; fee?: number; total?: number
  } | null>(null)
  const pinInputRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const pageTopRef = useRef<HTMLDivElement>(null)

  // Transfer code verification state
  const [requiredCodes, setRequiredCodes] = useState<TransferCode[]>([])
  const [currentCodeIndex, setCurrentCodeIndex] = useState(0)
  const [enteredCode, setEnteredCode] = useState("")
  const [verifiedCodes, setVerifiedCodes] = useState<string[]>([])
  const [codeError, setCodeError] = useState("")
  const [verifyingCode, setVerifyingCode] = useState(false)

  // Processing state
  const [processingStep, setProcessingStep] = useState(0)
  const processingSteps = [
    { label: "Verifying credentials", icon: Shield },
    { label: "Checking compliance", icon: FileCheck },
    { label: "Processing transfer", icon: Send },
    { label: "Finalizing transaction", icon: CheckCircle2 },
  ]

  // Beneficiary state
  const [saveBeneficiary, setSaveBeneficiary] = useState(false)
  const [beneficiaryNickname, setBeneficiaryNickname] = useState("")
  const [loadedBeneficiary, setLoadedBeneficiary] = useState<Beneficiary | null>(null)
  const [savingBeneficiary, setSavingBeneficiary] = useState(false)

  // Fetch accounts and fee settings
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/dashboard")
        if (res.ok) {
          const data = await res.json()
          setAccounts(data.accounts || [])
        }
      } catch { /* */ }
      // Check the compliance flag so we can block the flow before the user
      // fills anything in (the server enforces this too).
      try {
        const pr = await fetch("/api/user/profile")
        if (pr.ok) {
          const p = await pr.json()
          if (p.amlFlagged) setAmlBlock({ flagged: true, reason: p.amlFlagReason || "" })
        }
      } catch { /* */ }
      setLoading(false)
    })()
  }, [])

  // Load beneficiary from URL params
  useEffect(() => {
    const beneficiaryId = searchParams.get("beneficiaryId")
    const type = searchParams.get("type") as "local" | "international" | null
    
    if (beneficiaryId) {
      (async () => {
        try {
          const res = await fetch(`/api/user/beneficiaries/${beneficiaryId}`)
          if (res.ok) {
            const data = await res.json()
            const b = data.beneficiary as Beneficiary
            setLoadedBeneficiary(b)
            
            if (b.type === "local") {
              setTransferType("local")
              setRecipientId(b.accountNumber || "")
              // Auto-lookup the recipient
              if (b.accountNumber) {
                setRecipient({
                  accountNumber: b.accountNumber,
                  walletType: "fiat",
                  currency: b.currency || "USD",
                  recipientName: b.recipientName || b.nickname,
                })
              }
              setStep("amount")
            } else if (b.type === "international") {
              setTransferType("international")
              setIntlMethod("wire")
              setIntlFields({
                recipientName: b.recipientName || "",
                bankName: b.bankName || "",
                accountNumber: b.iban || b.accountNumber || "",
                swiftCode: b.swiftCode || "",
                routingNumber: b.routingNumber || "",
                bankAddress: b.bankAddress || "",
              })
              setStep("amount")
            }
          }
        } catch { /* */ }
      })()
    } else if (type) {
      setTransferType(type)
    }
  }, [searchParams])

  // Cryptocurrency transfers are fixed to Bitcoin and pull from the BTC wallet,
  // not the fiat account. Everything below (source account, available balance,
  // amount symbol/precision) switches to BTC when the crypto method is selected.
  const isCrypto = transferType === "international" && intlMethod === "crypto"

  const fiatAccount = accounts.find((a) => a.walletType === "fiat") || null
  const btcAccount  = accounts.find((a) => a.walletType === "bitcoin") || null

  const selectedAccount = isCrypto ? btcAccount : fiatAccount
  const availableBalance = isCrypto
    ? (btcAccount ? btcAccount.btcBalance / 1e8 : 0)
    : (fiatAccount ? fiatAccount.balance / 100 : 0)
  const sym  = isCrypto ? "₿" : currencySymbol // ₿
  const frac = isCrypto ? 8 : 2

  // Format an amount for display in the current transfer's unit (BTC or fiat).
  const fmtAmt = (n: number) =>
    isCrypto
      ? `₿${n.toLocaleString("en-US", { minimumFractionDigits: 8, maximumFractionDigits: 8 })}`
      : formatAmount(n)

  // For BTC transfers, fetch the live BTC→fiat price (CoinGecko, cached server-side)
  // in the user's preferred currency so we can show the fiat equivalent of the amount.
  useEffect(() => {
    if (!isCrypto) return
    let active = true
    const load = async () => {
      try {
        const res = await fetch(`/api/wallet/btc-rate?currency=${encodeURIComponent(currency)}`)
        if (res.ok) {
          const d = await res.json()
          if (active && typeof d?.usd === "number" && d.usd > 0) setBtcRate(d.usd)
        }
      } catch { /* keep last known rate */ }
    }
    load()
    const id = setInterval(load, 60_000) // refresh in step with the server cache TTL
    return () => { active = false; clearInterval(id) }
  }, [isCrypto, currency])

  // Fiat equivalent of the entered BTC amount (null until the rate is known).
  const fiatEquivalent = isCrypto && btcRate ? (parseFloat(amount) || 0) * btcRate : null

  // Lookup recipient
  const lookupRecipient = useCallback(async () => {
    if (!recipientId.trim()) return
    setLookingUp(true)
    setError("")
    setRecipient(null)

    try {
      const res = await fetch(`/api/user/lookup-account?accountNumber=${encodeURIComponent(recipientId.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Account not found")
        setLookingUp(false)
        return
      }

      setRecipient(data)
    } catch {
      setError("Network error")
    }
    setLookingUp(false)
  }, [recipientId])

  // PIN pad
  const addPinDigit = useCallback((digit: string) => {
    setPin((prev) => {
      if (prev.length >= 4) return prev
      return prev + digit
    })
    setError("")
  }, [])

  const removePinDigit = useCallback(() => {
    setPin((prev) => prev.slice(0, -1))
  }, [])

  // Fetch required transfer codes for international transfers
  const fetchTransferCodes = useCallback(async () => {
    if (transferType !== "international") return []
    try {
      const res = await fetch("/api/user/transfer-codes")
      if (res.ok) {
        const data = await res.json()
        return data.codes || []
      }
    } catch { /* */ }
    return []
  }, [transferType])

  // Verify a single code
  const verifyCode = useCallback(async (codeKey: string, code: string) => {
    setVerifyingCode(true)
    setCodeError("")
    try {
      const res = await fetch("/api/user/transfer-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeKey, enteredCode: code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCodeError(data.error || "Invalid code")
        setVerifyingCode(false)
        return false
      }
      setVerifyingCode(false)
      return true
    } catch {
      setCodeError("Network error. Please try again.")
      setVerifyingCode(false)
      return false
    }
  }, [])

  // Execute the actual transfer
  const executeTransfer = useCallback(async () => {
    // Build recipient identifier based on transfer type and method
    let recipientId_final = ""
    
    if (transferType === "international") {
      // For international transfers, use any available identifier from intlFields
      recipientId_final = intlFields.accountNumber
        || intlFields.iban
        || intlFields.walletAddress
        || intlFields.paypalEmail
        || intlFields.wiseEmail
        || intlFields.zelleEmail
        || intlFields.cashtag
        || intlFields.venmoUsername
        || intlFields.revolutTag
        || intlFields.mtcn
        || intlFields.referenceNumber
        || intlFields.recipientName
        || intlFields.bankName
        || `INTL-${Date.now()}`
    } else {
      // For local transfers, use the recipientId state
      recipientId_final = recipientId.trim()
      
      // Only validate for local transfers
      if (!recipientId_final || recipientId_final.length < 1) {
        setError("Recipient information is required")
        setStep("recipient")
        return
      }
    }

    // Validate required fields
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount")
      setStep("amount")
      return
    }
    if (!pin || pin.length < 4) {
      setError("Please enter your 4-digit PIN")
      setStep("pin")
      return
    }

    try {
      const res = await fetch("/api/user/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWalletType: transferType === "international" && intlMethod === "crypto" ? "bitcoin" : "fiat",
          recipientIdentifier: recipientId_final,
          amount: parsedAmount,
          pin,
          description: description || undefined,
          transferType: transferType || "local",
          intlMethod: intlMethod || null,
          intlFields: intlFields || {},
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Transfer failed")
        setStep("confirm")
        return
      }

      // Save beneficiary if requested (local, bank, wire, westernunion, moneygram)
      if (saveBeneficiary && beneficiaryNickname.trim() && !loadedBeneficiary) {
        try {
          const canSaveBeneficiary = transferType === "local" || (transferType === "international" && (intlMethod === "bank" || intlMethod === "wire" || intlMethod === "westernunion" || intlMethod === "moneygram"))
          if (canSaveBeneficiary) {
            const beneficiaryData: Record<string, string> = {
              type: transferType,
              nickname: beneficiaryNickname.trim(),
            }

            if (transferType === "local") {
              beneficiaryData.accountNumber = recipientId.trim()
              beneficiaryData.recipientName = recipient?.recipientName || ""
            } else if (intlMethod === "bank") {
              beneficiaryData.recipientName = intlFields.recipientName || ""
              beneficiaryData.bankName = intlFields.bankName || ""
              beneficiaryData.accountNumber = intlFields.accountNumber || ""
              beneficiaryData.iban = intlFields.accountNumber || ""
              beneficiaryData.country = intlFields.recipientCountry || ""
            } else if (intlMethod === "wire") {
              beneficiaryData.recipientName = intlFields.recipientName || ""
              beneficiaryData.bankName = intlFields.bankName || ""
              beneficiaryData.accountNumber = intlFields.accountNumber || ""
              beneficiaryData.iban = intlFields.iban || intlFields.accountNumber || ""
              beneficiaryData.swiftCode = intlFields.swiftCode || ""
              beneficiaryData.routingNumber = intlFields.routingNumber || ""
              beneficiaryData.bankAddress = intlFields.bankAddress || ""
            } else if (intlMethod === "westernunion" || intlMethod === "moneygram") {
              beneficiaryData.recipientName = intlFields.recipientName || ""
              beneficiaryData.accountNumber = intlFields.mtcn || intlFields.referenceNumber || ""
              beneficiaryData.country = intlFields.recipientCountry || ""
              beneficiaryData.bankAddress = intlFields.recipientAddress || ""
              // Store phone in bankName field for now (beneficiary model needs update)
              beneficiaryData.bankName = intlFields.recipientPhone || ""
            }

            await fetch("/api/user/beneficiaries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(beneficiaryData),
            })
          }
        } catch { /* ignore beneficiary save errors */ }
      }

      // Update beneficiary lastUsedAt if loaded from saved
      if (loadedBeneficiary) {
        try {
          await fetch(`/api/user/beneficiaries/${loadedBeneficiary.id}`, { method: "PATCH" })
        } catch { /* ignore */ }
      }

      setTxResult({ ...data, timestamp: new Date().toISOString() })
      setStep("success")
    } catch {
      setError("Network error. Please try again.")
      setStep("confirm")
    }
  }, [amount, recipientId, description, pin, transferType, intlMethod, intlFields, saveBeneficiary, beneficiaryNickname, loadedBeneficiary, recipient])

  // Run processing animation then submit
  const runProcessingAnimation = useCallback(async () => {
    setStep("processing")
    setProcessingStep(0)
    for (let i = 0; i < processingSteps.length; i++) {
      setProcessingStep(i)
      await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))
    }
    // After animation, submit the actual transfer
    await executeTransfer()
  }, [processingSteps.length, executeTransfer])

  // Run a mini processing animation for verification steps
  const runVerificationAnimation = useCallback(async () => {
    setStep("processing")
    setProcessingStep(0)
    // Show first 2 steps of the animation for verification
    for (let i = 0; i < 2; i++) {
      setProcessingStep(i)
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400))
    }
  }, [])

  // Handle code submission
  const handleCodeSubmit = useCallback(async () => {
    if (!enteredCode.trim()) return
    const currentCode = requiredCodes[currentCodeIndex]
    if (!currentCode) return

    // Show processing animation while verifying
    await runVerificationAnimation()

    const isValid = await verifyCode(currentCode.key, enteredCode)
    if (isValid) {
      setVerifiedCodes((prev) => [...prev, currentCode.key])
      setEnteredCode("")
      
      if (currentCodeIndex < requiredCodes.length - 1) {
        // Move to next code
        setCurrentCodeIndex((prev) => prev + 1)
        setStep("code_verification")
      } else {
        // All codes verified, proceed to final processing and transfer
        runProcessingAnimation()
      }
    } else {
      // Verification failed, go back to code entry
      setStep("code_verification")
    }
  }, [enteredCode, requiredCodes, currentCodeIndex, verifyCode, runVerificationAnimation, runProcessingAnimation])

  // Verify PIN against the server
  const verifyPin = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/user/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Invalid PIN")
        return false
      }
      return true
    } catch {
      setError("Network error. Please try again.")
      return false
    }
  }, [pin])

  // Submit transfer (after PIN)
  const handleSubmit = useCallback(async () => {
    if (pin.length !== 4 || !amount) return
    setSubmitting(true)
    setError("")

    // Show processing animation while verifying PIN
    setStep("processing")
    setProcessingStep(0)
    for (let i = 0; i < 2; i++) {
      setProcessingStep(i)
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400))
    }

    // Verify PIN first
    const pinValid = await verifyPin()
    if (!pinValid) {
      setSubmitting(false)
      setStep("pin")
      setPin("")
      return
    }

    // For international transfers, check if codes are required
    if (transferType === "international") {
      const codes = await fetchTransferCodes()
      if (codes.length > 0) {
        setRequiredCodes(codes)
        setCurrentCodeIndex(0)
        setVerifiedCodes([])
        setEnteredCode("")
        setCodeError("")
        setSubmitting(false)
        setStep("code_verification")
        return
      }
    }

    // No codes required or local transfer - go directly to full processing
    setSubmitting(false)
    runProcessingAnimation()
  }, [pin, amount, transferType, fetchTransferCodes, runProcessingAnimation, verifyPin])

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === 4 && step === "pin") {
      handleSubmit()
    }
  }, [pin, step, handleSubmit])

  // Navigation — flow differs for local vs international
  const flowSteps: Step[] = transferType === "international"
    ? ["choose", "method", "recipient", "amount", "confirm", "pin"]
    : ["choose", "recipient", "amount", "confirm", "pin"]

  const goBack = () => {
    setError("")
    const idx = flowSteps.indexOf(step)
    if (idx > 0) {
      if (step === "pin") setPin("")
      if (step === "method") { setIntlMethod(null); setShowMoreMethods(false) }
      setStep(flowSteps[idx - 1])
    } else router.back()
  }

  const canProceedAmount = parseFloat(amount) > 0 && parseFloat(amount) <= availableBalance

  // Progress
  const STEPS = flowSteps
  const stepIdx = STEPS.indexOf(step)
  const progress = step === "success" ? 100 : ((stepIdx + 1) / STEPS.length) * 100

  // Auto-scroll step indicator and page to top when step changes
  useEffect(() => {
    // Scroll page to top using scrollIntoView for better mobile compatibility
    requestAnimationFrame(() => {
      if (pageTopRef.current) {
        pageTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      } else {
        // Fallback methods
        window.scrollTo({ top: 0, behavior: "smooth" })
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }
    })
    
    // Scroll step indicator
    if (stepsRef.current && stepIdx >= 0) {
      const container = stepsRef.current
      const stepEl = container.querySelector(`[data-step-idx="${stepIdx}"]`) as HTMLElement
      if (stepEl) {
        const containerRect = container.getBoundingClientRect()
        const stepRect = stepEl.getBoundingClientRect()
        const scrollLeft = stepEl.offsetLeft - (containerRect.width / 2) + (stepRect.width / 2)
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" })
      }
    }
  }, [stepIdx, step])

  // Recipient initials
  const recipientInitials = recipient?.recipientName
    ? recipient.recipientName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  const [copied, setCopied] = useState(false)
  const copyRef = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // ── Compliance block ──────────────────────────────────────────────────────
  // A money-laundering flag stops the transfer flow entirely, up-front.
  if (amlBlock.flagged) {
    return (
      <>
        <div ref={pageTopRef} />
        <UserHeader title="Send Money" showBack />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 120px" }}>
          <div style={{
            display: "flex", gap: 12, alignItems: "flex-start",
            background: colors.redBg, border: `1px solid ${colors.red}33`,
            borderRadius: 16, padding: "16px 18px",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: colors.red, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShieldAlert style={{ width: 20, height: 20, color: "#fff" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.red, margin: "2px 0 6px" }}>
                Account flagged for money laundering
              </p>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: colors.textSecondary, margin: 0 }}>
                {amlBlock.reason?.trim() ||
                  "Your account is under compliance review. Transfers are temporarily unavailable. Please contact support."}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/app/support")}
            style={{
              width: "100%", height: 48, marginTop: 16, borderRadius: 14, border: "none", cursor: "pointer",
              background: colors.blue, color: "#fff", fontSize: 15, fontWeight: 600,
            }}
          >
            Contact support
          </button>
          <button
            onClick={() => router.push("/app/dashboard")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              width: "100%", height: 44, marginTop: 10, borderRadius: 14, cursor: "pointer",
              background: "transparent", border: `1px solid ${colors.border}`,
              color: colors.textSecondary, fontSize: 14, fontWeight: 600,
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} /> Back to dashboard
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div ref={pageTopRef} />
      <UserHeader title="Send Money" showBack />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 120px", overflowX: "hidden" }}>

        {/* ── Step indicator ────────────────────────────────────── */}
        {step !== "success" && (
          <div style={{ padding: "20px 0 12px", overflow: "hidden" }}>
            <div 
              ref={stepsRef}
              style={{ 
                display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 0,
                overflowX: "auto", overflowY: "hidden",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
                paddingLeft: 16, paddingRight: 16,
              }}
              className="hide-scrollbar"
            >
              {STEPS.map((s, i) => {
                const active = i <= stepIdx
                const isCurrent = i === stepIdx
                const labels: Record<string, string> = { choose: "Type", method: "Method", recipient: "To", amount: "Amount", confirm: "Review", pin: "PIN" }
                return (
                  <div key={s} data-step-idx={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 44 }}>
                      <div style={{
                        width: isCurrent ? 32 : 24, height: isCurrent ? 32 : 24,
                        borderRadius: "50%",
                        background: active
                          ? isCurrent ? (colors.isDark ? "linear-gradient(135deg, #1A2CCE, #1A2CCE)" : "linear-gradient(135deg, #1A2CCE, #1A2CCE)") : colors.blueBg
                          : colors.bgHover,
                        border: isCurrent ? "none" : `2px solid ${active ? colors.blueBg : colors.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 300ms cubic-bezier(.4,0,.2,1)",
                        boxShadow: isCurrent ? (colors.isDark ? "0 0 16px rgba(26,44,206,0.4)" : "0 0 16px rgba(26,44,206,0.25)") : "none",
                      }}>
                        {i < stepIdx ? (
                          <Check style={{ width: 12, height: 12, color: colors.blue }} />
                        ) : (
                          <span style={{
                            fontSize: isCurrent ? 12 : 10, fontWeight: 700,
                            color: active ? (isCurrent ? "#fff" : colors.textPrimary) : colors.textMuted,
                          }}>{i + 1}</span>
                        )}
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 600, marginTop: 4,
                        color: active ? (isCurrent ? colors.blue : colors.textSecondary) : colors.textMuted,
                        textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
                      }}>{labels[s]}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{
                        width: 28, height: 2, borderRadius: 1, marginBottom: 16,
                        background: i < stepIdx ? colors.blueBg : colors.border,
                        transition: "background 300ms ease",
                        flexShrink: 0,
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Error banner ──────────────────────────────────────── */}
        {error && step !== "pin" && (() => {
          const isKycError = /identity verification|complete kyc|kyc verification/i.test(error)
          return (
            <div style={{
              background: "rgba(240,68,56,0.08)", border: "1px solid rgba(240,68,56,0.15)",
              borderRadius: 14, padding: "12px 16px", marginTop: 8, marginBottom: 4,
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
              <AlertTriangle style={{ width: 16, height: 16, color: "#F04438", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#F04438", flex: 1, minWidth: 0 }}>{error}</span>
              {isKycError && (
                <button
                  onClick={() => router.push("/app/kyc")}
                  style={{
                    fontSize: 12, fontWeight: 700, color: "#fff", background: "#F04438",
                    border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", flexShrink: 0,
                  }}
                >
                  Verify now
                </button>
              )}
              <X onClick={() => setError("")} style={{ width: 14, height: 14, color: "rgba(240,68,56,0.5)", cursor: "pointer", flexShrink: 0 }} />
            </div>
          )
        })()}

        {/* ═══ STEP 0 — CHOOSE TRANSFER TYPE ═══ */}
        {step === "choose" && (
          <div style={{ paddingTop: 16 }}>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: "0 auto 14px",
                background: colors.blueBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: colors.isDark ? "0 0 24px rgba(26,44,206,0.15)" : "0 0 24px rgba(26,44,206,0.1)",
              }}>
                <Send style={{ width: 26, height: 26, color: colors.blue, transform: "rotate(-45deg)" }} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Send Money</p>
              <p style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4 }}>How would you like to transfer?</p>
            </div>

            {/* Local */}
            <div
              onClick={() => { setTransferType("local"); setStep("recipient") }}
              className="pressable"
              style={{
                position: "relative", overflow: "hidden",
                display: "flex", alignItems: "center", gap: 14,
                background: colors.bgElevated,
                border: `1px solid ${colors.border}`,
                borderRadius: 18, padding: "18px 16px", cursor: "pointer",
                marginBottom: 10, transition: "all 200ms ease",
              }}
            >
              <div className="pointer-events-none" style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: colors.blueBg, filter: "blur(20px)" }} />
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: colors.blueBg,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Users style={{ width: 20, height: 20, color: colors.blue }} />
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Local Transfer</p>
                <p style={{ fontSize: 12, color: colors.textTertiary, margin: "3px 0 0" }}>Send to local accounts instantly</p>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#F79009", background: "rgba(247,144,9,0.1)", padding: "2px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 3 }}>{"\u26A1"} Instant</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#12B76A", background: "rgba(18,183,106,0.1)", padding: "2px 8px", borderRadius: 6 }}>0% Fee</span>
                </div>
              </div>
              <ArrowRight style={{ width: 18, height: 18, color: "rgba(26,44,206,0.5)", flexShrink: 0 }} />
            </div>

            {/* International */}
            <div
              onClick={() => { setTransferType("international"); setIntlMethod(null); setShowMoreMethods(false); setIntlFields({}); setStep("method") }}
              className="pressable"
              style={{
                position: "relative", overflow: "hidden",
                display: "flex", alignItems: "center", gap: 14,
                background: colors.bgElevated,
                border: `1px solid ${colors.border}`,
                borderRadius: 18, padding: "18px 16px", cursor: "pointer",
                transition: "all 200ms ease",
              }}
            >
              <div className="pointer-events-none" style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(167,139,250,0.06)", filter: "blur(20px)" }} />
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: "rgba(167,139,250,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Globe style={{ width: 20, height: 20, color: "#A78BFA" }} />
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>International Transfer</p>
                <p style={{ fontSize: 12, color: colors.textTertiary, margin: "3px 0 0" }}>Global transfers within 72 hours</p>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#12B76A", background: "rgba(18,183,106,0.1)", padding: "2px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 3 }}>{"\u{1F6E1}\uFE0F"} Secure</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#A78BFA", background: "rgba(167,139,250,0.1)", padding: "2px 8px", borderRadius: 6 }}>SWIFT</span>
                </div>
              </div>
              <ArrowRight style={{ width: 18, height: 18, color: "rgba(167,139,250,0.5)", flexShrink: 0 }} />
            </div>
          </div>
        )}

        {/* ═══ STEP 1B — SELECT INTERNATIONAL METHOD ═══ */}
        {step === "method" && (
          <div style={{ paddingTop: 16 }}>
            <button onClick={goBack} className="pressable" style={{ background: "none", border: "none", color: colors.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 0", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>

            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Select Transfer Method</p>
            <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 20px" }}>Choose how you&apos;d like to send funds internationally</p>

            {/* Primary methods grid — 2 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* Bank Transfer */}
              <div
                onClick={() => { setIntlMethod("bank"); setIntlFields({}); setStep("recipient") }}
                className="pressable"
                style={{
                  position: "relative", overflow: "hidden",
                  background: intlMethod === "bank" ? colors.blueBg : colors.bgElevated,
                  border: `1px solid ${intlMethod === "bank" ? colors.blue : colors.border}`,
                  borderRadius: 16, padding: "18px 14px", cursor: "pointer",
                  transition: "all 200ms ease",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, marginBottom: 10,
                  background: colors.blueBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Banknote style={{ width: 18, height: 18, color: colors.blue }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: "0 0 3px" }}>Bank Transfer</p>
                <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, lineHeight: 1.3 }}>Send to any bank account worldwide.</p>
              </div>

              {/* Wire Transfer */}
              <div
                onClick={() => { setIntlMethod("wire"); setIntlFields({}); setStep("recipient") }}
                className="pressable"
                style={{
                  position: "relative", overflow: "hidden",
                  background: intlMethod === "wire" ? colors.blueBg : colors.bgElevated,
                  border: `1px solid ${intlMethod === "wire" ? colors.blue : colors.border}`,
                  borderRadius: 16, padding: "18px 14px", cursor: "pointer",
                  transition: "all 200ms ease",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, marginBottom: 10,
                  background: colors.blueBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Building style={{ width: 18, height: 18, color: colors.blue }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: "0 0 3px" }}>Wire Transfer</p>
                <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, lineHeight: 1.3 }}>Transfer funds directly to international bank accounts.</p>
              </div>

              {/* Cryptocurrency */}
              <div
                onClick={() => { setIntlMethod("crypto"); setIntlFields({ network: "Bitcoin (BTC)" }); setStep("recipient") }}
                className="pressable"
                style={{
                  position: "relative", overflow: "hidden",
                  background: intlMethod === "crypto" ? colors.yellowBg : colors.bgElevated,
                  border: `1px solid ${intlMethod === "crypto" ? colors.yellow : colors.border}`,
                  borderRadius: 16, padding: "18px 14px", cursor: "pointer",
                  transition: "all 200ms ease",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, marginBottom: 10,
                  background: colors.yellowBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bitcoin style={{ width: 18, height: 18, color: colors.yellow }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: "0 0 3px" }}>Cryptocurrency</p>
                <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, lineHeight: 1.3 }}>Send funds to your cryptocurrency wallet.</p>
              </div>

              {/* PayPal */}
              <div
                onClick={() => { setIntlMethod("paypal"); setIntlFields({}); setStep("recipient") }}
                className="pressable"
                style={{
                  position: "relative", overflow: "hidden",
                  background: intlMethod === "paypal" ? colors.blueBg : colors.bgElevated,
                  border: `1px solid ${intlMethod === "paypal" ? colors.blue : colors.border}`,
                  borderRadius: 16, padding: "18px 14px", cursor: "pointer",
                  transition: "all 200ms ease",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, marginBottom: 10,
                  background: colors.blueBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <CreditCard style={{ width: 18, height: 18, color: colors.blue }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: "0 0 3px" }}>PayPal</p>
                <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, lineHeight: 1.3 }}>Transfer funds to your PayPal account.</p>
              </div>

              {/* Wise */}
              <div
                onClick={() => { setIntlMethod("wise"); setIntlFields({}); setStep("recipient") }}
                className="pressable"
                style={{
                  position: "relative", overflow: "hidden",
                  background: intlMethod === "wise" ? colors.greenBg : colors.bgElevated,
                  border: `1px solid ${intlMethod === "wise" ? colors.green : colors.border}`,
                  borderRadius: 16, padding: "18px 14px", cursor: "pointer",
                  transition: "all 200ms ease",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, marginBottom: 10,
                  background: colors.greenBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <DollarSign style={{ width: 18, height: 18, color: colors.green }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: "0 0 3px" }}>Wise Transfer</p>
                <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, lineHeight: 1.3 }}>Transfer with lower fees using Wise.</p>
              </div>

              {/* Cash App */}
              <div
                onClick={() => { setIntlMethod("cashapp"); setIntlFields({}); setStep("recipient") }}
                className="pressable"
                style={{
                  position: "relative", overflow: "hidden",
                  background: intlMethod === "cashapp" ? colors.greenBg : colors.bgElevated,
                  border: `1px solid ${intlMethod === "cashapp" ? colors.green : colors.border}`,
                  borderRadius: 16, padding: "18px 14px", cursor: "pointer",
                  transition: "all 200ms ease",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, marginBottom: 10,
                  background: colors.greenBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <DollarSign style={{ width: 18, height: 18, color: colors.green }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: "0 0 3px" }}>Cash App</p>
                <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, lineHeight: 1.3 }}>Quick transfers to your Cash App account.</p>
              </div>

              {/* More Options */}
              <div
                onClick={() => setShowMoreMethods(!showMoreMethods)}
                className="pressable"
                style={{
                  position: "relative", overflow: "hidden",
                  background: showMoreMethods ? "rgba(167,139,250,0.08)" : colors.bgElevated,
                  border: `1px solid ${showMoreMethods ? "rgba(167,139,250,0.3)" : colors.border}`,
                  borderRadius: 16, padding: "18px 14px", cursor: "pointer",
                  transition: "all 200ms ease",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, marginBottom: 10,
                  background: "rgba(167,139,250,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <MoreHorizontal style={{ width: 18, height: 18, color: "#A78BFA" }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: "0 0 3px" }}>More Options</p>
                <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, lineHeight: 1.3 }}>Zelle, Venmo, Revolut, and more.</p>
              </div>
            </div>

            {/* Expanded more options */}
            {showMoreMethods && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
                {([
                  { key: "zelle" as IntlMethod, label: "Zelle", color: "#6D28D9" },
                  { key: "venmo" as IntlMethod, label: "Venmo", color: "#3D95CE" },
                  { key: "revolut" as IntlMethod, label: "Revolut", color: "#EC4899" },
                  { key: "westernunion" as IntlMethod, label: "Western Union", color: "#FFCC00" },
                  { key: "moneygram" as IntlMethod, label: "MoneyGram", color: "#FF6600" },
                ]).map((m) => (
                  <div
                    key={m.key}
                    onClick={() => { setIntlMethod(m.key); setIntlFields({}); setStep("recipient") }}
                    className="pressable"
                    style={{
                      background: colors.bgElevated,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14, padding: "14px 10px", cursor: "pointer",
                      textAlign: "center", transition: "all 200ms ease",
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, margin: "0 auto 8px",
                      background: `linear-gradient(135deg, ${m.color}26, ${m.color}0D)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Send style={{ width: 16, height: 16, color: m.color, transform: "rotate(-45deg)" }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>{m.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2 — RECIPIENT ═══ */}
        {step === "recipient" && (
          <div style={{ paddingTop: 16 }}>
            <button onClick={goBack} className="pressable" style={{ background: "none", border: "none", color: colors.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 0", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>

            {/* From account card */}
            <div style={{
              background: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 16,
              padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: colors.blueBg,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Wallet style={{ width: 18, height: 18, color: colors.blue }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sending from</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: "2px 0 0" }}>{isCrypto ? "Bitcoin Wallet" : "USD Account"}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: 0, fontVariantNumeric: "tabular-nums" }}>
                  {sym}{availableBalance.toLocaleString("en-US", { minimumFractionDigits: frac, maximumFractionDigits: frac })}
                </p>
                <p style={{ fontSize: 10, color: colors.textMuted, margin: "1px 0 0" }}>Available</p>
              </div>
            </div>

            {/* ── LOCAL: Account lookup ── */}
            {transferType === "local" && (
              <>
                <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Find Recipient</p>
                <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 16px" }}>
                  Enter the recipient&apos;s account number
                </p>

                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: colors.bgElevated, border: `1px solid ${colors.border}`,
                  borderRadius: 14, padding: "0 14px", marginBottom: 12,
                  transition: "border-color 200ms",
                }}>
                  <Search style={{ width: 18, height: 18, color: colors.textMuted, flexShrink: 0 }} />
                  <input
                    type="text"
                    value={recipientId}
                    onChange={(e) => { setRecipientId(e.target.value); setRecipient(null); setError("") }}
                    placeholder="e.g. 2048391056"
                    style={{
                      flex: 1, padding: "15px 0", background: "transparent", border: "none",
                      outline: "none", color: colors.textPrimary, fontSize: 15, fontWeight: 500,
                    }}
                  />
                </div>

                {recipientId.trim().length > 0 && recipientId.trim().length < 3 && (
                  <p style={{ fontSize: 11, color: "#F04438", margin: "-8px 0 12px", display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle style={{ width: 10, height: 10 }} /> Account number must be at least 3 characters
                  </p>
                )}

                <button
                  onClick={lookupRecipient}
                  disabled={lookingUp || recipientId.trim().length < 3}
                  className="pressable"
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                    background: (!lookingUp && recipientId.trim().length >= 3) 
                      ? (colors.isDark ? "linear-gradient(135deg, #1A2CCE 0%, #1A2CCE 100%)" : "linear-gradient(135deg, #1A2CCE 0%, #1A2CCE 100%)") 
                      : colors.bgHover,
                    color: (!lookingUp && recipientId.trim().length >= 3) ? "#fff" : colors.textMuted,
                    fontSize: 15, fontWeight: 700, cursor: (!lookingUp && recipientId.trim().length >= 3) ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    marginBottom: 16,
                    boxShadow: (!lookingUp && recipientId.trim().length >= 3) ? (colors.isDark ? "0 4px 16px rgba(26,44,206,0.3)" : "0 4px 16px rgba(26,44,206,0.2)") : "none",
                  }}
                >
                  {lookingUp ? <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Looking up...</> : "Find Account"}
                </button>

                {recipient && (
                  <div style={{
                    background: colors.bgElevated, border: `1px solid ${colors.green}33`,
                    borderRadius: 16, padding: "16px", marginBottom: 16,
                    boxShadow: colors.isDark ? "0 0 20px rgba(18,183,106,0.05)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: "50%",
                        background: colors.greenBg,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        fontSize: 16, fontWeight: 800, color: colors.green,
                      }}>
                        {recipientInitials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>{recipient.recipientName}</p>
                        <p style={{ fontSize: 12, color: colors.textTertiary, margin: "3px 0 0" }}>{recipient.accountNumber} · {recipient.currency}</p>
                      </div>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(18,183,106,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <CheckCircle2 style={{ width: 16, height: 16, color: "#12B76A" }} />
                      </div>
                    </div>
                  </div>
                )}

                {recipient && (
                  <button
                    onClick={() => { setStep("amount"); setError("") }}
                    className="pressable"
                    style={{
                      width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                      background: colors.isDark ? "linear-gradient(135deg, #1A2CCE 0%, #1A2CCE 100%)" : "linear-gradient(135deg, #1A2CCE 0%, #1A2CCE 100%)",
                      color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: colors.isDark ? "0 4px 16px rgba(26,44,206,0.3)" : "0 4px 16px rgba(26,44,206,0.2)",
                    }}
                  >
                    Continue <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </>
            )}

            {/* ── INTERNATIONAL: Method-specific forms ── */}
            {transferType === "international" && intlMethod && (() => {
              const methodLabels: Record<IntlMethod, string> = {
                bank: "Bank Transfer", wire: "Wire Transfer", crypto: "Cryptocurrency", paypal: "PayPal",
                wise: "Wise Transfer", cashapp: "Cash App", zelle: "Zelle", venmo: "Venmo", revolut: "Revolut",
                westernunion: "Western Union", moneygram: "MoneyGram",
              }

              const fieldConfigs: Record<IntlMethod, { key: string; label: string; placeholder: string; type?: string; options?: string[] }[]> = {
                bank: [
                  { key: "recipientName", label: "Recipient Full Name", placeholder: "John Doe" },
                  { key: "accountNumber", label: "Account Number (IBAN)", placeholder: "e.g. GB29NWBK60161331926819" },
                  { key: "bankName", label: "Bank Name", placeholder: "e.g. HSBC, Barclays" },
                  { key: "recipientCountry", label: "Recipient Country", placeholder: "Auto-detected from IBAN" },
                ],
                wire: [
                  { key: "recipientName", label: "Recipient Full Name", placeholder: "John Doe" },
                  { key: "bankName", label: "Bank Name", placeholder: "e.g. HSBC, Barclays" },
                  { key: "accountNumber", label: "Account Number / IBAN", placeholder: "e.g. GB29NWBK60161331926819" },
                  { key: "swiftCode", label: "SWIFT / BIC Code", placeholder: "e.g. HBUKGB4B" },
                  { key: "routingNumber", label: "Routing Number", placeholder: "e.g. 026009593" },
                  { key: "bankAddress", label: "Bank Address", placeholder: "123 Bank Street, London" },
                ],
                crypto: [
                  { key: "walletAddress", label: "Bitcoin Wallet Address", placeholder: "e.g. bc1qxy2kgdygjrsqtzq2n0yrf..." },
                  { key: "network", label: "Network", placeholder: "Bitcoin (BTC)" },
                  { key: "memo", label: "Memo / Tag (if required)", placeholder: "Optional memo or destination tag" },
                ],
                paypal: [
                  { key: "recipientName", label: "Recipient Name", placeholder: "John Doe" },
                  { key: "paypalEmail", label: "PayPal Email Address", placeholder: "recipient@email.com", type: "email" },
                ],
                wise: [
                  { key: "recipientName", label: "Recipient Full Name", placeholder: "John Doe" },
                  { key: "wiseEmail", label: "Wise Email Address", placeholder: "recipient@email.com", type: "email" },
                  { key: "accountNumber", label: "Account Number / IBAN", placeholder: "e.g. GB29NWBK60161331926819" },
                  { key: "currency", label: "Recipient Currency", placeholder: "e.g. EUR, GBP, USD" },
                ],
                cashapp: [
                  { key: "recipientName", label: "Recipient Name", placeholder: "John Doe" },
                  { key: "cashtag", label: "Cash Tag", placeholder: "e.g. $johndoe" },
                ],
                zelle: [
                  { key: "recipientName", label: "Recipient Name", placeholder: "John Doe" },
                  { key: "zelleEmail", label: "Zelle Email or Phone", placeholder: "recipient@email.com or +1..." },
                ],
                venmo: [
                  { key: "recipientName", label: "Recipient Name", placeholder: "John Doe" },
                  { key: "venmoUsername", label: "Venmo Username", placeholder: "e.g. @johndoe" },
                ],
                revolut: [
                  { key: "recipientName", label: "Recipient Full Name", placeholder: "John Doe" },
                  { key: "revolutTag", label: "Revolut Tag or Phone", placeholder: "e.g. @johndoe or +44..." },
                  { key: "accountNumber", label: "Account Number / IBAN (optional)", placeholder: "e.g. GB29NWBK60161331926819" },
                ],
                westernunion: [
                  { key: "recipientName", label: "Recipient Full Name", placeholder: "John Doe" },
                  { key: "recipientCountry", label: "Recipient Country", placeholder: "e.g. United States, United Kingdom" },
                  { key: "recipientCity", label: "Recipient City", placeholder: "e.g. New York, London" },
                  { key: "recipientAddress", label: "Recipient Address", placeholder: "123 Main Street, Apt 4B" },
                  { key: "recipientPhone", label: "Recipient Phone Number", placeholder: "+1 234 567 8900" },
                  { key: "mtcn", label: "MTCN (Money Transfer Control Number)", placeholder: "10-digit tracking number (for receiving)" },
                ],
                moneygram: [
                  { key: "recipientName", label: "Recipient Full Name", placeholder: "John Doe" },
                  { key: "recipientCountry", label: "Recipient Country", placeholder: "e.g. United States, United Kingdom" },
                  { key: "recipientCity", label: "Recipient City", placeholder: "e.g. New York, London" },
                  { key: "recipientAddress", label: "Recipient Address", placeholder: "123 Main Street, Apt 4B" },
                  { key: "recipientPhone", label: "Recipient Phone Number", placeholder: "+1 234 567 8900" },
                  { key: "referenceNumber", label: "Reference Number", placeholder: "8-digit reference number (for receiving)" },
                ],
              }

              const fields = fieldConfigs[intlMethod] || []
              const requiredFields = fields.filter(f => !f.placeholder.startsWith("Optional") && !f.label.includes("optional"))
              const allFilled = requiredFields.every(f => (intlFields[f.key] || "").trim().length > 0)
              const isFieldRequired = (f: { key: string; label: string; placeholder: string }) =>
                !f.placeholder.startsWith("Optional") && !f.label.includes("optional")
              const isFieldEmpty = (key: string) => !(intlFields[key] || "").trim()

              return (
                <>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(167,139,250,0.08)", borderRadius: 8, padding: "4px 10px", marginBottom: 14,
                  }}>
                    <Globe style={{ width: 12, height: 12, color: "#A78BFA" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#A78BFA" }}>{methodLabels[intlMethod]}</span>
                  </div>

                  <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Recipient Details</p>
                  <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 16px" }}>
                    Enter the details for your {methodLabels[intlMethod].toLowerCase()} transfer
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                    {fields.map((f) => {
                      const required = isFieldRequired(f)
                      const empty = isFieldEmpty(f.key)
                      const showWarning = required && empty && Object.keys(intlFields).length > 0
                      // Recipient country for a bank transfer is derived from the IBAN — read-only.
                      // The crypto network is fixed to Bitcoin — also read-only.
                      const isAutoCountry = (intlMethod === "bank" && f.key === "recipientCountry")
                        || (intlMethod === "crypto" && f.key === "network")
                      return (
                        <div key={f.key}>
                          <label style={{
                            fontSize: 11, fontWeight: 600,
                            color: showWarning ? "#F04438" : colors.textTertiary,
                            marginBottom: 6, display: "flex", alignItems: "center", gap: 4,
                            textTransform: "uppercase", letterSpacing: "0.05em"
                          }}>
                            {f.label}
                            {required && <span style={{ color: "#F04438" }}>*</span>}
                          </label>
                          {f.options ? (
                            <select
                              value={intlFields[f.key] || ""}
                              onChange={(e) => updateIntlField(f.key, e.target.value)}
                              style={{
                                width: "100%", padding: "13px 14px", borderRadius: 14, boxSizing: "border-box",
                                background: colors.bgElevated,
                                border: `1px solid ${showWarning ? "#F04438" : colors.border}`,
                                color: colors.textPrimary, fontSize: 14, fontWeight: 500, outline: "none",
                                transition: "border-color 200ms", cursor: "pointer",
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = colors.blue}
                              onBlur={(e) => e.currentTarget.style.borderColor = showWarning ? "#F04438" : colors.border}
                            >
                              <option value="">{f.placeholder}</option>
                              {f.options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={f.type || "text"}
                              value={intlFields[f.key] || ""}
                              onChange={(e) => { if (!isAutoCountry) updateIntlField(f.key, e.target.value) }}
                              placeholder={f.placeholder}
                              readOnly={isAutoCountry}
                              style={{
                                width: "100%", padding: "13px 14px", borderRadius: 14, boxSizing: "border-box",
                                background: isAutoCountry ? colors.bgHover : colors.bgElevated,
                                border: `1px solid ${showWarning ? "#F04438" : colors.border}`,
                                color: isAutoCountry ? colors.textSecondary : colors.textPrimary,
                                fontSize: 14, fontWeight: 500, outline: "none",
                                transition: "border-color 200ms",
                                cursor: isAutoCountry ? "default" : "text",
                              }}
                              onFocus={(e) => { if (!isAutoCountry) e.currentTarget.style.borderColor = colors.blue }}
                              onBlur={(e) => e.currentTarget.style.borderColor = showWarning ? "#F04438" : colors.border}
                            />
                          )}
                          {showWarning && (
                            <p style={{ fontSize: 11, color: "#F04438", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                              <AlertTriangle style={{ width: 10, height: 10 }} /> This field is required
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {!allFilled && Object.keys(intlFields).length > 0 && (
                    <div style={{
                      background: "rgba(240,68,56,0.08)", border: "1px solid rgba(240,68,56,0.15)",
                      borderRadius: 12, padding: "10px 14px", marginBottom: 16,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: "#F04438", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#F04438" }}>
                        Please fill in all required fields marked with *
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => allFilled && setStep("amount")}
                    disabled={!allFilled}
                    className="pressable"
                    style={{
                      width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                      background: allFilled 
                        ? (colors.isDark ? "linear-gradient(135deg, #1A2CCE 0%, #1A2CCE 100%)" : "linear-gradient(135deg, #1A2CCE 0%, #1A2CCE 100%)") 
                        : colors.bgHover,
                      color: allFilled ? "#fff" : colors.textMuted,
                      fontSize: 15, fontWeight: 700, cursor: allFilled ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: allFilled ? (colors.isDark ? "0 4px 16px rgba(26,44,206,0.3)" : "0 4px 16px rgba(26,44,206,0.2)") : "none",
                    }}
                  >
                    Continue <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                </>
              )
            })()}
          </div>
        )}

        {/* ═══ STEP 2 — AMOUNT ═══ */}
        {step === "amount" && selectedAccount && (
          <div style={{ paddingTop: 16 }}>
            <button onClick={goBack} className="pressable" style={{ background: "none", border: "none", color: colors.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 0", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>

            {/* Recipient mini-bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: colors.bgElevated, borderRadius: 12, padding: "10px 14px", marginBottom: 20,
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: transferType === "international"
                  ? "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.08))"
                  : "linear-gradient(135deg, rgba(18,183,106,0.2), rgba(18,183,106,0.08))",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                fontSize: 11, fontWeight: 800, color: transferType === "international" ? "#A78BFA" : "#12B76A",
              }}>
                {transferType === "international" ? <Globe style={{ width: 14, height: 14 }} /> : recipientInitials}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                  To: {transferType === "international" ? (intlFields.recipientName || intlFields.walletAddress?.slice(0, 12) + "..." || "Recipient") : recipient?.recipientName}
                </p>
              </div>
              <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>
                {transferType === "international" && intlMethod
                  ? ({ bank: "Bank", wire: "Wire", crypto: "Crypto", paypal: "PayPal", wise: "Wise", cashapp: "Cash App", zelle: "Zelle", venmo: "Venmo", revolut: "Revolut", westernunion: "Western Union", moneygram: "MoneyGram" } as Record<string, string>)[intlMethod]
                  : recipientId}
              </p>
            </div>

            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>How much?</p>

            {/* Amount display */}
            <div style={{
              background: colors.bgElevated, border: `1px solid ${colors.borderBlue}`,
              borderRadius: 20, padding: "32px 20px 24px", textAlign: "center", marginTop: 16, marginBottom: 16,
              position: "relative", overflow: "hidden",
            }}>
              <div className="pointer-events-none" style={{ position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)", width: 180, height: 100, borderRadius: "50%", background: colors.blueBg, filter: "blur(30px)" }} />
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2, position: "relative" }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: colors.textMuted }}>{sym}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    background: "transparent", border: "none", outline: "none",
                    fontSize: 44, fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.02em",
                    width: "100%", maxWidth: 220, textAlign: "center",
                  }}
                />
              </div>
              {/* Fiat equivalent (BTC transfers only) */}
              {isCrypto && (
                <p style={{ fontSize: 15, color: colors.textSecondary, fontWeight: 600, margin: "6px 0 0", position: "relative" }}>
                  {btcRate
                    ? `≈ ${formatAmount(fiatEquivalent || 0)}`
                    : "Fetching exchange rate…"}
                </p>
              )}
              {/* Balance chip */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: colors.bgHover, borderRadius: 20, padding: "5px 14px", marginTop: 12,
              }}>
                <Wallet style={{ width: 12, height: 12, color: colors.textMuted }} />
                <span style={{ fontSize: 12, color: colors.textTertiary, fontWeight: 500 }}>
                  Available: {sym}{availableBalance.toLocaleString("en-US", { minimumFractionDigits: frac, maximumFractionDigits: frac })}
                </span>
              </div>
              {isCrypto && btcRate && (
                <p style={{ fontSize: 11, color: colors.textMuted, margin: "8px 0 0" }}>
                  1 BTC ≈ {formatAmount(btcRate)}
                </p>
              )}
              {parseFloat(amount) > availableBalance && (
                <p style={{ fontSize: 12, color: "#F04438", marginTop: 8, fontWeight: 600 }}>Exceeds available balance</p>
              )}
              {amount && parseFloat(amount) <= 0 && (
                <p style={{ fontSize: 12, color: "#F04438", marginTop: 8, fontWeight: 600 }}>Amount must be greater than 0</p>
              )}
              {!amount && (
                <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>Enter an amount to continue</p>
              )}
            </div>

            {/* Quick amounts */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
              {(isCrypto ? [0.001, 0.005, 0.01, 0.05] : [50, 100, 250, 500]).map((v) => {
                const isActive = amount === String(v)
                return (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="pressable"
                    style={{
                      background: isActive ? colors.blueBg : colors.bgElevated,
                      border: `1px solid ${isActive ? colors.blue : colors.border}`,
                      borderRadius: 24, padding: "8px 18px", cursor: "pointer",
                      fontSize: 13, fontWeight: 700,
                      color: isActive ? colors.blue : colors.textSecondary,
                      boxShadow: isActive ? (colors.isDark ? "0 0 12px rgba(26,44,206,0.15)" : "0 0 12px rgba(26,44,206,0.1)") : "none",
                      transition: "all 200ms ease",
                    }}
                  >
                    {isCrypto ? `₿${v}` : `$${v}`}
                  </button>
                )
              })}
              <button
                onClick={() => setAmount(String(availableBalance))}
                className="pressable"
                style={{
                  background: colors.bgElevated, border: `1px solid ${colors.border}`,
                  borderRadius: 24, padding: "8px 18px", cursor: "pointer",
                  fontSize: 13, fontWeight: 700, color: colors.textSecondary,
                }}
              >
                Max
              </button>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Note (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this for?"
                maxLength={200}
                style={{
                  width: "100%", padding: "13px 14px", borderRadius: 14, boxSizing: "border-box",
                  background: colors.bgElevated, border: `1px solid ${colors.border}`,
                  color: colors.textPrimary, fontSize: 14, fontWeight: 500, outline: "none",
                }}
              />
            </div>

            <button
              onClick={() => canProceedAmount && setStep("confirm")}
              disabled={!canProceedAmount}
              className="pressable"
              style={{
                width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
                background: canProceedAmount 
                  ? (colors.isDark ? "linear-gradient(135deg, #1A2CCE 0%, #1A2CCE 100%)" : "linear-gradient(135deg, #1A2CCE 0%, #1A2CCE 100%)") 
                  : colors.bgHover,
                color: canProceedAmount ? "#fff" : colors.textMuted,
                fontSize: 15, fontWeight: 700, cursor: canProceedAmount ? "pointer" : "default",
                boxShadow: canProceedAmount ? (colors.isDark ? "0 4px 16px rgba(26,44,206,0.3)" : "0 4px 16px rgba(26,44,206,0.2)") : "none",
              }}
            >
              Review Transfer
            </button>
          </div>
        )}

        {/* ═══ STEP 3 — CONFIRM ═══ */}
        {step === "confirm" && selectedAccount && (
          <div style={{ paddingTop: 16 }}>
            <button onClick={goBack} className="pressable" style={{ background: "none", border: "none", color: colors.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "4px 0", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>

            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 16px" }}>Review Transfer</p>

            {/* From → To visual flow */}
            <div style={{
              background: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 20,
              padding: "20px 16px", marginBottom: 16, position: "relative", overflow: "hidden",
            }}>
              <div className="pointer-events-none" style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: colors.blueBg, filter: "blur(30px)" }} />

              {/* Amount hero */}
              <div style={{ textAlign: "center", marginBottom: 20, position: "relative" }}>
                <p style={{ fontSize: 38, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>
                  {sym}{parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: frac, maximumFractionDigits: frac })}
                </p>
                <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: 500 }}>
                  {transferType === "international" && intlMethod
                    ? ({ bank: "Bank Transfer", wire: "Wire Transfer", crypto: "Cryptocurrency", paypal: "PayPal", wise: "Wise Transfer", cashapp: "Cash App", zelle: "Zelle", venmo: "Venmo", revolut: "Revolut", westernunion: "Western Union", moneygram: "MoneyGram" } as Record<string, string>)[intlMethod]
                    : "Local Transfer"} · {isCrypto ? "BTC" : "USD"}
                </p>
              </div>

              {/* From */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: colors.blueBg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Wallet style={{ width: 16, height: 16, color: colors.blue }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, color: colors.textMuted, margin: 0, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>From</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, margin: "1px 0 0" }}>{isCrypto ? "Bitcoin Wallet" : "Fiat Account"}</p>
                </div>
              </div>

              {/* Arrow line */}
              <div style={{ display: "flex", alignItems: "center", marginLeft: 18, marginBottom: 12 }}>
                <div style={{ width: 2, height: 20, background: colors.blueBg, borderRadius: 1 }} />
                <ArrowRight style={{ width: 14, height: 14, color: colors.blue, marginLeft: 8, transform: "rotate(90deg)" }} />
              </div>

              {/* To */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {transferType === "international" ? (
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.08))",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Globe style={{ width: 16, height: 16, color: "#A78BFA" }} />
                  </div>
                ) : (
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(18,183,106,0.2), rgba(18,183,106,0.08))",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    fontSize: 13, fontWeight: 800, color: "#12B76A",
                  }}>
                    {recipientInitials}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, color: colors.textMuted, margin: 0, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>To</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, margin: "1px 0 0" }}>
                    {transferType === "international" ? (intlFields.recipientName || intlFields.walletAddress?.slice(0, 20) + "..." || "Recipient") : recipient?.recipientName}
                  </p>
                  <p style={{ fontSize: 11, color: colors.textMuted, margin: "1px 0 0" }}>
                    {transferType === "international"
                      ? (intlFields.paypalEmail || intlFields.wiseEmail || intlFields.cashtag || intlFields.zelleEmail || intlFields.venmoUsername || intlFields.revolutTag || intlFields.accountNumber || intlFields.walletAddress?.slice(0, 24) + "..." || "")
                      : recipientId}
                  </p>
                </div>
              </div>
            </div>

            {/* Details card */}
            <div style={{
              background: colors.bgElevated, border: `1px solid ${colors.border}`,
              borderRadius: 16, padding: "2px 16px", marginBottom: 16,
            }}>
              {transferType === "international" && intlMethod ? (() => {
                const parsedAmount = parseFloat(amount) || 0
                return (
                  <>
                    <ConfirmRow label="Method" value={({ bank: "Bank Transfer", wire: "Wire Transfer", crypto: "Cryptocurrency", paypal: "PayPal", wise: "Wise Transfer", cashapp: "Cash App", zelle: "Zelle", venmo: "Venmo", revolut: "Revolut", westernunion: "Western Union", moneygram: "MoneyGram" } as Record<string, string>)[intlMethod]} />
                    {intlMethod === "bank" && intlFields.bankName && <ConfirmRow label="Bank" value={intlFields.bankName} />}
                    {intlMethod === "bank" && intlFields.recipientCountry && <ConfirmRow label="Country" value={intlFields.recipientCountry} />}
                    {intlMethod === "wire" && intlFields.swiftCode && <ConfirmRow label="SWIFT Code" value={intlFields.swiftCode} />}
                    {intlMethod === "wire" && intlFields.bankName && <ConfirmRow label="Bank" value={intlFields.bankName} />}
                    {intlMethod === "crypto" && intlFields.network && <ConfirmRow label="Network" value={intlFields.network} />}
                    <ConfirmRow label="Total Debit" value={fmtAmt(parsedAmount)} valueColor={colors.blue} />
                    {isCrypto && btcRate && <ConfirmRow label="Fiat Value" value={`≈ ${formatAmount(parsedAmount * btcRate)}`} />}
                    {description && <ConfirmRow label="Note" value={description} />}
                    <ConfirmRow label="Estimated Arrival" value={
                      intlMethod === "crypto" ? "10-60 minutes"
                      : intlMethod === "wire" ? "1-3 business days"
                      : intlMethod === "wise" ? "1-2 business days"
                      : "Within 24 hours"
                    } noBorder />
                  </>
                )
              })() : (
                <>
                  <ConfirmRow label="Network" value="Internal" />
                  {description && <ConfirmRow label="Note" value={description} />}
                  <ConfirmRow label="Estimated Arrival" value="Instant" noBorder />
                </>
              )}
            </div>

            {/* Save Beneficiary Option - only for local and wire transfers, and not already loaded from saved */}
            {!loadedBeneficiary && (transferType === "local" || (transferType === "international" && intlMethod === "wire")) && (
              <div style={{
                background: colors.bgElevated, border: `1px solid ${colors.border}`,
                borderRadius: 16, padding: 16, marginBottom: 16,
              }}>
                <div 
                  onClick={() => setSaveBeneficiary(!saveBeneficiary)}
                  style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: saveBeneficiary ? colors.blue : "transparent",
                    border: `2px solid ${saveBeneficiary ? colors.blue : colors.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 200ms ease",
                  }}>
                    {saveBeneficiary && <Check style={{ width: 14, height: 14, color: "#fff" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                      Save as beneficiary
                    </p>
                    <p style={{ fontSize: 12, color: colors.textMuted, margin: "2px 0 0" }}>
                      Quick access for future transfers
                    </p>
                  </div>
                  <UserPlus style={{ width: 18, height: 18, color: saveBeneficiary ? colors.blue : colors.textMuted }} />
                </div>

                {saveBeneficiary && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ 
                      fontSize: 11, fontWeight: 600, color: colors.textMuted, 
                      marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" 
                    }}>
                      Nickname <span style={{ color: "#F04438" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={beneficiaryNickname}
                      onChange={(e) => setBeneficiaryNickname(e.target.value)}
                      placeholder={`e.g. ${recipient?.recipientName || intlFields.recipientName || "John's Account"}`}
                      maxLength={100}
                      style={{
                        width: "100%", padding: "12px 14px", borderRadius: 12, boxSizing: "border-box",
                        background: colors.bgHover, border: `1px solid ${colors.border}`,
                        color: colors.textPrimary, fontSize: 14, fontWeight: 500, outline: "none",
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Show loaded beneficiary indicator */}
            {loadedBeneficiary && (
              <div style={{
                background: "rgba(26,44,206,0.08)", border: "1px solid rgba(26,44,206,0.2)",
                borderRadius: 12, padding: "10px 14px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <Bookmark style={{ width: 16, height: 16, color: colors.blue, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: colors.blue, fontWeight: 500 }}>
                  Sending to saved beneficiary: <strong>{loadedBeneficiary.nickname}</strong>
                </span>
              </div>
            )}

            <button
              onClick={() => { setStep("pin"); setPin(""); setError("") }}
              disabled={saveBeneficiary && !beneficiaryNickname.trim()}
              className="pressable"
              style={{
                width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
                background: (saveBeneficiary && !beneficiaryNickname.trim()) 
                  ? colors.bgHover 
                  : (colors.isDark ? "linear-gradient(135deg, #12B76A 0%, #059669 100%)" : "linear-gradient(135deg, #059669 0%, #047857 100%)"),
                color: (saveBeneficiary && !beneficiaryNickname.trim()) ? colors.textMuted : "#fff",
                fontSize: 15, fontWeight: 700, cursor: (saveBeneficiary && !beneficiaryNickname.trim()) ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: (saveBeneficiary && !beneficiaryNickname.trim()) ? "none" : (colors.isDark ? "0 4px 16px rgba(18,183,106,0.3)" : "0 4px 16px rgba(5,150,105,0.2)"),
              }}
            >
              <Lock style={{ width: 16, height: 16 }} /> Authorize Transfer
            </button>
          </div>
        )}

        {/* ═══ STEP 4 — PIN PAD ═══ */}
        {step === "pin" && (
          <div style={{ paddingTop: 28, textAlign: "center" }} ref={pinInputRef}>
            {/* Shield icon */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: colors.blueBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: colors.isDark ? "0 0 24px rgba(26,44,206,0.12)" : "0 0 24px rgba(26,44,206,0.08)",
            }}>
              <Shield style={{ width: 32, height: 32, color: colors.blue }} />
            </div>

            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Enter Transfer PIN</p>
            <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 28px" }}>
              4-digit PIN to authorize {sym}{parseFloat(amount || "0").toLocaleString("en-US", { minimumFractionDigits: frac })}
            </p>

            {/* PIN dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 16 }}>
              {[0, 1, 2, 3].map((i) => {
                const filled = i < pin.length
                return (
                  <div key={i} style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: filled ? colors.blue : "transparent",
                    border: `2.5px solid ${filled ? colors.blue : colors.border}`,
                    transition: "all 200ms cubic-bezier(.4,0,.2,1)",
                    transform: filled ? "scale(1.15)" : "scale(1)",
                    boxShadow: filled ? (colors.isDark ? "0 0 12px rgba(26,44,206,0.4)" : "0 0 12px rgba(26,44,206,0.25)") : "none",
                  }} />
                )
              })}
            </div>

            {/* Error */}
            {error && (
              <p style={{ fontSize: 13, color: colors.red, margin: "4px 0 12px", fontWeight: 600 }}>{error}</p>
            )}

            {/* Loading */}
            {submitting && (
              <div style={{ margin: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Loader2 style={{ width: 20, height: 20, color: colors.blue, animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 14, color: colors.textSecondary }}>Processing...</span>
              </div>
            )}

            {/* Numpad */}
            {!submitting && (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10, maxWidth: 264, margin: "20px auto 0",
              }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((key) => {
                  if (key === "") return <div key="empty" />
                  const isDel = key === "del"
                  return (
                    <button
                      key={key}
                      onClick={isDel ? removePinDigit : () => addPinDigit(key)}
                      style={{
                        width: "100%", height: 56, borderRadius: 14, border: "none",
                        background: colors.bgElevated,
                        fontSize: isDel ? 0 : 22, fontWeight: 600, color: colors.textPrimary,
                        cursor: "pointer", transition: "all 120ms ease",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      onMouseDown={(e) => { e.currentTarget.style.background = colors.blueBg; e.currentTarget.style.transform = "scale(0.95)" }}
                      onMouseUp={(e) => { e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.transform = "scale(1)" }}
                      onTouchStart={(e) => { e.currentTarget.style.background = colors.blueBg; e.currentTarget.style.transform = "scale(0.95)" }}
                      onTouchEnd={(e) => { e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.transform = "scale(1)" }}
                    >
                      {isDel ? <Delete style={{ width: 22, height: 22, color: colors.textSecondary }} /> : key}
                    </button>
                  )
                })}
              </div>
            )}

            <button onClick={goBack} style={{
              background: "none", border: "none", color: colors.textMuted,
              fontSize: 13, fontWeight: 500, cursor: "pointer", marginTop: 24,
            }}>
              Cancel
            </button>
          </div>
        )}

        {/* ═══ STEP 5 — CODE VERIFICATION ═══ */}
        {step === "code_verification" && requiredCodes.length > 0 && (
          <div style={{ paddingTop: 20 }}>
            {/* Warning banner */}
            <div style={{
              background: "linear-gradient(135deg, rgba(247,144,9,0.12), rgba(234,88,12,0.08))",
              border: "1px solid rgba(247,144,9,0.3)",
              borderRadius: 16, padding: "16px", marginBottom: 24,
              position: "relative", overflow: "hidden",
            }}>
              <div className="pointer-events-none" style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(247,144,9,0.15)", filter: "blur(20px)" }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, position: "relative" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "rgba(247,144,9,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <AlertTriangle style={{ width: 20, height: 20, color: "#F79009" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#F79009", margin: "0 0 4px" }}>
                    Verification Required
                  </p>
                  <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0, lineHeight: 1.5 }}>
                    {requiredCodes[currentCodeIndex]?.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              {requiredCodes.map((code, idx) => (
                <div key={code.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: idx < currentCodeIndex ? colors.greenBg : idx === currentCodeIndex ? colors.yellowBg : colors.bgHover,
                    border: `2px solid ${idx < currentCodeIndex ? colors.green : idx === currentCodeIndex ? "#F79009" : colors.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 300ms ease",
                  }}>
                    {idx < currentCodeIndex ? (
                      <Check style={{ width: 14, height: 14, color: colors.green }} />
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: idx === currentCodeIndex ? "#F79009" : colors.textMuted }}>{idx + 1}</span>
                    )}
                  </div>
                  {idx < requiredCodes.length - 1 && (
                    <div style={{ width: 24, height: 2, background: idx < currentCodeIndex ? colors.green : colors.border, borderRadius: 1 }} />
                  )}
                </div>
              ))}
            </div>

            {/* Current code label */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(247,144,9,0.15), rgba(234,88,12,0.1))",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 0 24px rgba(247,144,9,0.15)",
              }}>
                <ShieldCheck style={{ width: 28, height: 28, color: "#F79009" }} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>
                Enter {requiredCodes[currentCodeIndex]?.label}
              </p>
              <p style={{ fontSize: 13, color: colors.textTertiary, margin: 0 }}>
                Step {currentCodeIndex + 1} of {requiredCodes.length}
              </p>
            </div>

            {/* Code input */}
            <div style={{
              background: colors.bgElevated, border: `1px solid ${codeError ? "#F04438" : colors.border}`,
              borderRadius: 14, padding: "0 16px", marginBottom: 12,
              transition: "border-color 200ms",
            }}>
              <input
                type="text"
                value={enteredCode}
                onChange={(e) => { setEnteredCode(e.target.value.toUpperCase()); setCodeError("") }}
                placeholder="Enter verification code"
                autoFocus
                style={{
                  width: "100%", padding: "16px 0", background: "transparent", border: "none",
                  outline: "none", color: colors.textPrimary, fontSize: 16, fontWeight: 600,
                  textAlign: "center", letterSpacing: "0.1em", fontFamily: "monospace",
                }}
              />
            </div>

            {/* Error */}
            {codeError && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(240,68,56,0.08)", border: "1px solid rgba(240,68,56,0.2)",
              }}>
                <AlertTriangle style={{ width: 14, height: 14, color: "#F04438", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#F04438" }}>{codeError}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleCodeSubmit}
              disabled={verifyingCode || !enteredCode.trim()}
              className="pressable"
              style={{
                width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
                background: (!verifyingCode && enteredCode.trim())
                  ? "linear-gradient(135deg, #F79009 0%, #D97706 100%)"
                  : colors.bgHover,
                color: (!verifyingCode && enteredCode.trim()) ? "#fff" : colors.textMuted,
                fontSize: 15, fontWeight: 700, cursor: (!verifyingCode && enteredCode.trim()) ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: (!verifyingCode && enteredCode.trim()) ? "0 4px 16px rgba(247,144,9,0.3)" : "none",
                marginBottom: 12,
              }}
            >
              {verifyingCode ? (
                <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Verifying...</>
              ) : (
                <><ShieldCheck style={{ width: 16, height: 16 }} /> Verify Code</>
              )}
            </button>

            {/* Contact support */}
            <p style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: 16 }}>
              Don&apos;t have a code? Contact your account manager or support team.
            </p>
          </div>
        )}

        {/* ═══ STEP 6 — PROCESSING ═══ */}
        {step === "processing" && (
          <div style={{ paddingTop: 40, textAlign: "center" }}>
            {/* Animated processing icon */}
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: colors.blueBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 28px",
              position: "relative",
              boxShadow: colors.isDark ? "0 0 40px rgba(26,44,206,0.2)" : "0 0 40px rgba(26,44,206,0.15)",
            }}>
              {/* Spinning ring */}
              <div style={{
                position: "absolute", inset: -4,
                border: `3px solid transparent`,
                borderTopColor: colors.blue,
                borderRadius: "50%",
                animation: "spin 1.5s linear infinite",
              }} />
              <Shield style={{ width: 40, height: 40, color: colors.blue }} />
            </div>

            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 8px" }}>
              Processing Transfer
            </p>
            <p style={{ fontSize: 14, color: colors.textTertiary, margin: "0 0 32px" }}>
              Please wait while we securely process your transaction
            </p>

            {/* Processing steps */}
            <div style={{
              background: colors.bgElevated, border: `1px solid ${colors.border}`,
              borderRadius: 16, padding: "20px", textAlign: "left",
            }}>
              {processingSteps.map((pStep, idx) => {
                const Icon = pStep.icon
                const isActive = idx === processingStep
                const isComplete = idx < processingStep
                const isPending = idx > processingStep

                return (
                  <div key={idx} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 0",
                    borderBottom: idx < processingSteps.length - 1 ? `1px solid ${colors.border}` : "none",
                    opacity: isPending ? 0.4 : 1,
                    transition: "opacity 300ms ease",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: isComplete ? colors.greenBg : isActive ? colors.blueBg : colors.bgHover,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      transition: "all 300ms ease",
                    }}>
                      {isComplete ? (
                        <Check style={{ width: 18, height: 18, color: colors.green }} />
                      ) : isActive ? (
                        <Loader2 style={{ width: 18, height: 18, color: colors.blue, animation: "spin 1s linear infinite" }} />
                      ) : (
                        <Icon style={{ width: 18, height: 18, color: colors.textMuted }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: 14, fontWeight: 600, margin: 0,
                        color: isComplete ? colors.green : isActive ? colors.textPrimary : colors.textMuted,
                      }}>
                        {pStep.label}
                      </p>
                      {isActive && (
                        <p style={{ fontSize: 11, color: colors.textTertiary, margin: "2px 0 0" }}>
                          In progress...
                        </p>
                      )}
                      {isComplete && (
                        <p style={{ fontSize: 11, color: colors.green, margin: "2px 0 0" }}>
                          Completed
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Security note */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginTop: 24, padding: "10px 16px",
              background: colors.bgHover, borderRadius: 10,
            }}>
              <Lock style={{ width: 12, height: 12, color: colors.textMuted }} />
              <span style={{ fontSize: 11, color: colors.textMuted }}>
                256-bit SSL encrypted • {BANK_NAME} Secure Transfer
              </span>
            </div>
          </div>
        )}

        {/* ═══ STEP 7 — SUCCESS ═══ */}
        {step === "success" && txResult && (
          <div style={{ paddingTop: 36, textAlign: "center" }}>
            {/* Animated checkmark */}
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: colors.greenBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: colors.isDark ? "0 0 32px rgba(18,183,106,0.15)" : "0 0 32px rgba(5,150,105,0.1)",
              animation: "successPulse 2s ease-in-out infinite",
            }}>
              <CheckCircle2 style={{ width: 40, height: 40, color: colors.green }} />
            </div>

            <p style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: "0 0 4px" }}>
              Transfer Successful!
            </p>
            <p style={{ fontSize: 15, color: colors.textTertiary, margin: "0 0 28px" }}>
              {sym}{txResult.amount.toLocaleString("en-US", { minimumFractionDigits: frac, maximumFractionDigits: frac })} to {txResult.recipientName}
            </p>

            {/* Receipt card */}
            <div id="transfer-receipt" style={{
              background: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 18,
              padding: "20px 16px", marginBottom: 16, textAlign: "left",
              position: "relative", overflow: "hidden",
            }}>
              <div className="pointer-events-none print-hidden" style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: colors.greenBg, filter: "blur(20px)" }} />

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Transaction Receipt</span>
                  <p style={{ fontSize: 10, color: colors.textMuted, margin: "2px 0 0" }}>{BANK_NAME}</p>
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: colors.greenBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: colors.green }} />
                </div>
              </div>
              <div style={{ height: 1, borderTop: `1px dashed ${colors.border}`, marginBottom: 14 }} />

              <ReceiptRow label="Amount" value={`${sym}${txResult.amount.toLocaleString("en-US", { minimumFractionDigits: frac, maximumFractionDigits: frac })}`} bold />
              {txResult.fee !== undefined && txResult.fee > 0 && (
                <ReceiptRow label="Fee" value={`${sym}${txResult.fee.toLocaleString("en-US", { minimumFractionDigits: frac, maximumFractionDigits: frac })}`} />
              )}
              {txResult.total !== undefined && txResult.fee !== undefined && txResult.fee > 0 && (
                <ReceiptRow label="Total Debited" value={`${sym}${txResult.total.toLocaleString("en-US", { minimumFractionDigits: frac, maximumFractionDigits: frac })}`} bold />
              )}
              <ReceiptRow label="Recipient" value={txResult.recipientName} />
              <ReceiptRow label="Reference" value={txResult.reference} mono />
              <ReceiptRow label="Date & Time" value={txResult.timestamp ? new Date(txResult.timestamp).toLocaleString() : new Date().toLocaleString()} />
              <ReceiptRow label="Transfer Type" value={transferType === "international" ? `International (${intlMethod || "Wire"})` : "Local Transfer"} />
              {description && <ReceiptRow label="Description" value={description} />}
              <ReceiptRow label="Status" value="Completed" status />

              <div style={{ height: 1, borderTop: `1px dashed ${colors.border}`, marginTop: 14, marginBottom: 14 }} />
              
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock style={{ width: 12, height: 12, color: colors.textMuted }} />
                <span style={{ fontSize: 10, color: colors.textMuted }}>
                  {transferType === "international" ? "Estimated arrival: 1-3 business days" : "Funds transferred instantly"}
                </span>
              </div>
            </div>

            {/* Action buttons row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => copyRef(txResult.reference)}
                className="pressable"
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  background: colors.bgHover, border: `1px solid ${colors.border}`,
                  color: colors.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {copied ? <><Check style={{ width: 14, height: 14, color: colors.green }} /> Copied!</> : <><Copy style={{ width: 14, height: 14 }} /> Copy Ref</>}
              </button>
              <button
                onClick={() => {
                  const receiptHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Transfer Receipt - ${txResult.reference}</title>
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .logo { font-size: 24px; font-weight: 700; color: #0F4C81; margin-bottom: 4px; }
                        .subtitle { font-size: 12px; color: #6B7280; }
                        .success-badge { display: inline-flex; align-items: center; gap: 6px; background: #D1FAE5; color: #059669; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 16px 0; }
                        .amount { font-size: 32px; font-weight: 800; color: #111827; margin: 16px 0 8px; }
                        .recipient { font-size: 14px; color: #6B7280; }
                        .divider { border-top: 1px dashed #E5E7EB; margin: 20px 0; }
                        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
                        .row:last-child { border-bottom: none; }
                        .label { font-size: 13px; color: #6B7280; }
                        .value { font-size: 13px; font-weight: 600; color: #111827; text-align: right; }
                        .mono { font-family: monospace; letter-spacing: 0.02em; }
                        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
                        .footer-text { font-size: 11px; color: #9CA3AF; }
                        @media print { body { padding: 20px; } }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="logo">${BANK_NAME}</div>
                        <div class="subtitle">Transaction Receipt</div>
                        <div class="success-badge">✓ Transfer Successful</div>
                        <div class="amount">${sym}${txResult.amount.toLocaleString("en-US", { minimumFractionDigits: frac, maximumFractionDigits: frac })}</div>
                        <div class="recipient">to ${txResult.recipientName}</div>
                      </div>
                      <div class="divider"></div>
                      <div class="row"><span class="label">Reference</span><span class="value mono">${txResult.reference}</span></div>
                      <div class="row"><span class="label">Date & Time</span><span class="value">${new Date().toLocaleString()}</span></div>
                      <div class="row"><span class="label">Transfer Type</span><span class="value">${transferType === "international" ? "International Wire" : "Local Transfer"}</span></div>
                      ${description ? `<div class="row"><span class="label">Description</span><span class="value">${description}</span></div>` : ""}
                      <div class="row"><span class="label">Status</span><span class="value" style="color: #059669;">Completed</span></div>
                      <div class="footer">
                        <div class="footer-text">This is an official transaction receipt from ${BANK_NAME}.</div>
                        <div class="footer-text">For support, contact our customer service team.</div>
                      </div>
                    </body>
                    </html>
                  `
                  const printWindow = window.open("", "_blank")
                  if (printWindow) {
                    printWindow.document.write(receiptHtml)
                    printWindow.document.close()
                    printWindow.focus()
                    setTimeout(() => printWindow.print(), 250)
                  }
                }}
                className="pressable"
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  background: colors.bgHover, border: `1px solid ${colors.border}`,
                  color: colors.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Printer style={{ width: 14, height: 14 }} /> Print
              </button>
            </div>

            <button
              onClick={() => router.push("/app/dashboard")}
              className="pressable"
              style={{
                width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
                background: colors.isDark ? "linear-gradient(135deg, #1A2CCE 0%, #1A2CCE 100%)" : "linear-gradient(135deg, #1A2CCE 0%, #1A2CCE 100%)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10,
                boxShadow: colors.isDark ? "0 4px 16px rgba(26,44,206,0.3)" : "0 4px 16px rgba(26,44,206,0.2)",
              }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setStep("choose"); setRecipientId(""); setRecipient(null)
                setAmount(""); setDescription(""); setPin(""); setTxResult(null); setError("")
                setIntlMethod(null); setIntlFields({}); setShowMoreMethods(false)
                setRequiredCodes([]); setCurrentCodeIndex(0); setVerifiedCodes([]); setEnteredCode("")
              }}
              className="pressable"
              style={{
                width: "100%", padding: "13px 0", borderRadius: 14,
                background: "transparent", border: `1px solid ${colors.border}`,
                color: colors.textSecondary, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Send Another
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes successPulse {
          0%, 100% { box-shadow: 0 0 32px rgba(18,183,106,0.15); }
          50% { box-shadow: 0 0 48px rgba(18,183,106,0.25); }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ConfirmRow({ label, value, valueColor, noBorder }: { label: string; value: string; valueColor?: string; noBorder?: boolean }) {
  const colors = useThemeColors()
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "13px 0",
      borderBottom: noBorder ? "none" : `1px solid ${colors.border}`,
    }}>
      <span style={{ fontSize: 13, color: colors.textMuted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: valueColor || colors.textPrimary, textAlign: "right", maxWidth: "60%", wordBreak: "break-all" }}>{value}</span>
    </div>
  )
}

function ReceiptRow({ label, value, bold, mono, status }: { label: string; value: string; bold?: boolean; mono?: boolean; status?: boolean }) {
  const colors = useThemeColors()
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: colors.textMuted }}>{label}</span>
      {status ? (
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.green, background: colors.greenBg, padding: "3px 10px", borderRadius: 6 }}>{value}</span>
      ) : (
        <span style={{
          fontSize: bold ? 15 : 13,
          fontWeight: bold ? 700 : 600,
          color: colors.textPrimary,
          fontFamily: mono ? "monospace" : "inherit",
          letterSpacing: mono ? "0.02em" : undefined,
        }}>{value}</span>
      )}
    </div>
  )
}
