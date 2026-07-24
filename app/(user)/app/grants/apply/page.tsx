"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, Upload,
  Camera, X, FileText, DollarSign, AlertTriangle,
  Briefcase, GraduationCap, Home, Heart, Zap, User, Bitcoin,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"

// ── Types ────────────────────────────────────────────────────────────────────

interface Account {
  _id: string
  accountNumber: string
  currency: string
  balance: number
  walletType: "fiat" | "bitcoin"
  btcBalance?: number
}

interface UploadedDoc {
  name: string
  docUrl: string
  docPublicId: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const GRANT_TYPES = [
  { value: "personal",  label: "Personal",  desc: "General financial assistance",        icon: User },
  { value: "business",  label: "Business",  desc: "Startup or growth funding",           icon: Briefcase },
  { value: "education", label: "Education", desc: "Tuition, books, training",            icon: GraduationCap },
  { value: "housing",   label: "Housing",   desc: "Rent or home repair assistance",      icon: Home },
  { value: "medical",   label: "Medical",   desc: "Healthcare & medical expenses",       icon: Heart },
  { value: "emergency", label: "Emergency", desc: "Urgent unexpected expenses",          icon: Zap },
]

const STEPS = ["Grant Type", "Details", "Documents", "Deposit Account", "Review"]

// ── Component ────────────────────────────────────────────────────────────────

export default function GrantApplyPage() {
  const router = useRouter()
  const colors = useThemeColors()
  const { symbol: currencySymbol, formatAmount } = useCurrency()
  const [step, setStep] = useState(0)

  // Form state
  const [grantType, setGrantType] = useState("")
  const [amount, setAmount] = useState("")
  const [purpose, setPurpose] = useState("")
  const [supportingInfo, setSupportingInfo] = useState("")
  const [documents, setDocuments] = useState<UploadedDoc[]>([])
  const [depositAccountId, setDepositAccountId] = useState("")

  // Accounts
  const [accounts, setAccounts] = useState<Account[]>([])

  // Upload
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<{ referenceNumber: string; _id: string } | null>(null)

  // Fetch accounts on mount
  useEffect(() => {
    fetch("/api/user/accounts")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.accounts) {
          // Get all accounts (fiat and bitcoin)
          const allAccounts = d.accounts as Account[]
          setAccounts(allAccounts)
          // Auto-select fiat account if only one exists
          const fiatAccounts = allAccounts.filter((a) => a.walletType === "fiat")
          if (fiatAccounts.length === 1) setDepositAccountId(fiatAccounts[0]._id)
        }
      })
      .catch(() => {})
  }, [])

  // File upload handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) { setUploadError("File must be under 10MB"); return }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowed.includes(file.type)) { setUploadError("Only JPG, PNG, WebP, or PDF"); return }

    setUploading(true)
    setUploadError("")

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      if (!cloudName) throw new Error("Upload not configured")

      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "deposit_proofs")
      formData.append("folder", "grant-documents")

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      setDocuments((prev) => [...prev, {
        name: file.name,
        docUrl: data.secure_url,
        docPublicId: data.public_id,
      }])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function removeDoc(idx: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== idx))
  }

  // Submit
  async function handleSubmit() {
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/user/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grantType,
          amount: parseFloat(amount),
          purpose: purpose.trim(),
          supportingInfo: supportingInfo.trim() || undefined,
          documents,
          depositAccountId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Submission failed")

      setSuccess({ referenceNumber: data.grant.referenceNumber, _id: data.grant._id })
      setStep(5) // success step
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  // Validation per step
  function canProceed(): boolean {
    if (step === 0) return !!grantType
    if (step === 1) return !!amount && parseFloat(amount) > 0 && purpose.trim().length >= 10
    if (step === 2) return true // docs are optional
    if (step === 3) return !!depositAccountId
    return true
  }

  const selectedType = GRANT_TYPES.find((t) => t.value === grantType)

  return (
    <>
      <UserHeader title="Apply for Grant" showBack />

      <div className="px-4 py-5 lg:px-6 space-y-5 max-w-[600px] mx-auto">
        {/* Progress */}
        {step < 5 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-medium" style={{ color: colors.textTertiary }}>
                Step {step + 1} of {STEPS.length}
              </p>
              <p className="text-[12px] font-semibold" style={{ color: colors.blue }}>{STEPS[step]}</p>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: colors.border }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: colors.blue }}
              />
            </div>
          </div>
        )}

        {/* ── Step 0: Grant Type ──────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>Select Grant Type</p>
            <div className="grid grid-cols-2 gap-3">
              {GRANT_TYPES.map((gt) => {
                const sel = grantType === gt.value
                const Icon = gt.icon
                return (
                  <button
                    key={gt.value}
                    onClick={() => setGrantType(gt.value)}
                    className="text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
                    style={{
                      background: sel ? colors.greenBg : colors.bgElevated,
                      border: sel ? `1.5px solid ${colors.green}4D` : `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl mb-2" style={{ background: sel ? colors.greenBg : colors.bgHover }}>
                      <Icon className="h-4 w-4" style={{ color: sel ? colors.green : colors.textTertiary }} />
                    </div>
                    <p className="text-[14px] font-semibold" style={{ color: sel ? colors.green : colors.textPrimary }}>{gt.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>{gt.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step 1: Details ───────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>Grant Details</p>

            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide block mb-1" style={{ color: colors.textTertiary }}>
                Requested Amount (USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full h-12 rounded-xl px-4 text-[15px] outline-none transition-all"
                style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
              />
            </div>

            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide block mb-1" style={{ color: colors.textTertiary }}>
                Purpose / Reason
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe why you need this grant (minimum 10 characters)"
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-[15px] outline-none transition-all resize-none"
                style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
              />
              <p className="text-[11px] mt-1" style={{ color: purpose.trim().length >= 10 ? colors.textMuted : colors.yellow }}>
                {purpose.trim().length}/10 characters minimum
              </p>
            </div>

            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide block mb-1" style={{ color: colors.textTertiary }}>
                Additional Information (Optional)
              </label>
              <textarea
                value={supportingInfo}
                onChange={(e) => setSupportingInfo(e.target.value)}
                placeholder="Any extra details to support your application"
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-[15px] outline-none transition-all resize-none"
                style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Documents ───────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>Supporting Documents</p>
              <p className="text-[12px] mt-1" style={{ color: colors.textTertiary }}>
                Upload any supporting documents (optional but recommended)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload area */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-xl p-6 text-center transition-all active:scale-[0.99]"
              style={{ background: colors.bgHover, border: `2px dashed ${colors.border}` }}
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" style={{ color: colors.blue }} />
              ) : (
                <Camera className="h-8 w-8 mx-auto mb-2" style={{ color: colors.textMuted }} />
              )}
              <p className="text-[13px] font-semibold" style={{ color: colors.textSecondary }}>
                {uploading ? "Uploading..." : "Tap to upload"}
              </p>
              <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
                JPG, PNG, WebP, or PDF — Max 10MB
              </p>
            </button>

            {uploadError && (
              <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: colors.redBg, border: `1px solid ${colors.red}26` }}>
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.red }} />
                <p className="text-[13px]" style={{ color: colors.red }}>{uploadError}</p>
              </div>
            )}

            {/* Uploaded docs list */}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ background: colors.bgHover, border: `1px solid ${colors.border}` }}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: colors.blueBg }}>
                      <FileText className="h-4 w-4" style={{ color: colors.blue }} />
                    </div>
                    <p className="text-[13px] font-medium flex-1 truncate" style={{ color: colors.textPrimary }}>{doc.name}</p>
                    <button onClick={() => removeDoc(i)} className="p-1">
                      <X className="h-4 w-4" style={{ color: colors.textMuted }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Deposit Account ───────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>Select Deposit Account</p>
            <p className="text-[12px]" style={{ color: colors.textTertiary }}>
              Approved grant funds will be deposited to this account.
            </p>

            <div className="space-y-2">
              {accounts.map((acc) => {
                const sel = depositAccountId === acc._id
                const isBitcoin = acc.walletType === "bitcoin"
                const displayBalance = isBitcoin 
                  ? `${((acc.btcBalance || 0) / 1e8).toFixed(8)} BTC`
                  : `${currencySymbol}${(acc.balance / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                const accountLabel = isBitcoin ? "Bitcoin Wallet" : `${acc.currency} Account`
                const iconBg = isBitcoin ? "rgba(247,147,26,0.12)" : colors.blueBg
                const iconColor = isBitcoin ? "#F7931A" : colors.blue
                
                return (
                  <button
                    key={acc._id}
                    onClick={() => setDepositAccountId(acc._id)}
                    className="w-full text-left rounded-xl p-4 flex items-center gap-3 transition-all"
                    style={{
                      background: sel ? colors.greenBg : colors.bgElevated,
                      border: sel ? `1.5px solid ${colors.green}4D` : `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: sel ? colors.greenBg : iconBg }}>
                      {isBitcoin ? (
                        <Bitcoin className="h-5 w-5" style={{ color: sel ? colors.green : iconColor }} />
                      ) : (
                        <DollarSign className="h-5 w-5" style={{ color: sel ? colors.green : iconColor }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-medium" style={{ color: colors.textPrimary }}>{accountLabel}</p>
                      <p className="text-[12px]" style={{ color: colors.textMuted }}>····{acc.accountNumber.slice(-4)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>{displayBalance}</p>
                      {sel && <CheckCircle2 className="h-4 w-4 mt-1 ml-auto" style={{ color: colors.green }} />}
                    </div>
                  </button>
                )
              })}
            </div>

            {accounts.length === 0 && (
              <div className="rounded-xl p-4 text-center" style={{ background: colors.redBg, border: `1px solid ${colors.red}1A` }}>
                <p className="text-[13px]" style={{ color: colors.red }}>No accounts found. Please create an account first.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Review ──────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>Review Your Application</p>

            <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
              <div className="divide-y" style={{ borderColor: colors.border }}>
                <ReviewRow label="Grant Type" value={selectedType?.label || grantType} colors={colors} />
                <ReviewRow label="Requested Amount" value={formatAmount(parseFloat(amount))} highlight colors={colors} />
                <ReviewRow label="Purpose" value={purpose} colors={colors} />
                {supportingInfo && <ReviewRow label="Additional Info" value={supportingInfo} colors={colors} />}
                <ReviewRow label="Documents" value={documents.length > 0 ? `${documents.length} file(s)` : "None"} colors={colors} />
                <ReviewRow label="Deposit Account" value={(() => {
                  const acc = accounts.find((a) => a._id === depositAccountId)
                  if (!acc) return "—"
                  const label = acc.walletType === "bitcoin" ? "Bitcoin Wallet" : `${acc.currency} Account`
                  return `${label} ····${acc.accountNumber.slice(-4)}`
                })()} colors={colors} />
              </div>
            </div>

            {error && (
              <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: colors.redBg, border: `1px solid ${colors.red}26` }}>
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.red }} />
                <p className="text-[13px]" style={{ color: colors.red }}>{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Success ─────────────────────────── */}
        {step === 5 && success && (
          <div className="rounded-2xl p-8 text-center" style={{ background: colors.bgElevated, border: `1px solid ${colors.green}26` }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: colors.greenBg }}>
              <CheckCircle2 className="h-8 w-8" style={{ color: colors.green }} />
            </div>
            <p className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>Application Submitted</p>
            <p className="mt-2 text-[14px]" style={{ color: colors.textTertiary }}>
              Your grant application has been submitted for review.
            </p>
            <div className="mt-4 rounded-xl p-3" style={{ background: colors.bgHover }}>
              <p className="text-[11px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Reference Number</p>
              <p className="text-[16px] font-semibold mt-0.5" style={{ color: colors.textPrimary }}>{success.referenceNumber}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => router.push(`/app/grants/${success._id}`)}
                className="flex-1 h-11 rounded-xl text-[14px] font-semibold transition-all text-white"
                style={{ background: colors.green }}
              >
                View Details
              </button>
              <button
                onClick={() => router.push("/app/grants")}
                className="flex-1 h-11 rounded-xl text-[14px] font-semibold transition-all"
                style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textSecondary }}
              >
                Back to Grants
              </button>
            </div>
          </div>
        )}

        {/* ── Navigation ──────────────────────────────── */}
        {step < 5 && (
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="h-12 px-5 rounded-xl text-[14px] font-semibold transition-all flex items-center gap-2"
                style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textSecondary }}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex-1 h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: canProceed() ? colors.blue : colors.bgHover,
                  opacity: canProceed() ? 1 : 0.5,
                }}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: submitting ? colors.bgHover : colors.green }}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  <>Submit Application</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────

interface RowColors {
  textTertiary: string
  textPrimary: string
  green: string
}

function ReviewRow({ label, value, highlight, colors }: { label: string; value: string; highlight?: boolean; colors: RowColors }) {
  return (
    <div className="flex items-start justify-between px-4 py-3 gap-4">
      <span className="text-[13px] flex-shrink-0" style={{ color: colors.textTertiary }}>{label}</span>
      <span className="text-[13px] font-medium text-right" style={{ color: highlight ? colors.green : colors.textPrimary }}>{value}</span>
    </div>
  )
}
