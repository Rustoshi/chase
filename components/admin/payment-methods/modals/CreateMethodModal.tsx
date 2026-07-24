"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, Bold, Italic, List, Link as LinkIcon, Lock, Upload, X, Image as ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { renderMarkdownLite } from "@/lib/utils/markdownLite"
import Image from "next/image"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  open:        boolean
  onOpenChange:(v: boolean) => void
  onSuccess:   (method: Record<string, unknown>) => void
  /** If provided, we are in edit mode — form is pre-filled, slug is locked */
  existing?:   Record<string, unknown> | null
}

type FeeType = "none" | "percent" | "fixed" | "both"

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

const TYPE_OPTIONS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "paypal",        label: "PayPal" },
  { value: "bitcoin",       label: "Bitcoin" },
  { value: "venmo",         label: "Venmo" },
  { value: "cash_app",      label: "Cash App" },
  { value: "zelle",         label: "Zelle" },
  { value: "wire",          label: "Wire transfer" },
  { value: "crypto_other",  label: "Other crypto" },
  { value: "giftcard",      label: "Gift Card" },
]

const GIFT_CARD_BRANDS = [
  "Amazon", "iTunes/Apple", "Google Play", "Steam", "Visa", 
  "eBay", "Walmart", "Target", "Nike", "Sephora", "Other"
]

const MAX_INSTRUCTIONS = 2000

// ── Slug helpers ──────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

// ── Markdown toolbar ──────────────────────────────────────────────────────────

function insertAtCursor(
  ref:    React.RefObject<HTMLTextAreaElement>,
  setter: (v: string) => void,
  before: string,
  after:  string
) {
  const el  = ref.current
  if (!el) return
  const s   = el.selectionStart
  const e   = el.selectionEnd
  const val = el.value
  const selected = val.slice(s, e) || "text"
  const newVal = val.slice(0, s) + before + selected + after + val.slice(e)
  setter(newVal)
  setTimeout(() => {
    el.focus()
    el.setSelectionRange(s + before.length, s + before.length + selected.length)
  }, 0)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateMethodModal({ open, onOpenChange, onSuccess, existing }: Props) {
  const { toast }  = useToast()
  const isEdit     = !!existing
  const taRef      = useRef<HTMLTextAreaElement>(null)

  const [name,          setName]          = useState("")
  const [slug,          setSlug]          = useState("")
  const [slugDirty,     setSlugDirty]     = useState(false)
  const [slugStatus,    setSlugStatus]    = useState<"idle" | "ok" | "taken" | "checking">("idle")
  const [type,          setType]          = useState("bank_transfer")
  const [icon,          setIcon]          = useState("")
  const [depositTarget, setDepositTarget] = useState<"fiat" | "bitcoin">("fiat")
  const [feeType,       setFeeType]       = useState<FeeType>("none")
  const [feePercent,    setFeePercent]    = useState("0")
  const [feeFixed,      setFeeFixed]      = useState("0")
  const [minAmount,     setMinAmount]     = useState("0")
  const [maxAmount,     setMaxAmount]     = useState("0")
  const [sortOrder,     setSortOrder]     = useState("0")
  const [instructions,  setInstructions]  = useState("")
  const [enableNow,     setEnableNow]     = useState(false)
  const [submitting,    setSubmitting]    = useState(false)
  const [preview,       setPreview]       = useState(false)
  const slugDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Logo upload state
  const [logoFile,      setLogoFile]      = useState<File | null>(null)
  const [logoPreview,   setLogoPreview]   = useState("")
  const [logoUrl,       setLogoUrl]       = useState("")
  const [logoPublicId,  setLogoPublicId]  = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  
  // Payment info state
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({})
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])

  // Pre-fill for edit mode
  useEffect(() => {
    if (!open) return
    if (existing) {
      setName(String(existing.name ?? ""))
      setSlug(String(existing.slug ?? ""))
      setType(String(existing.type ?? "bank_transfer"))
      setIcon(String(existing.icon ?? ""))
      setDepositTarget((existing.depositTarget as "fiat" | "bitcoin") ?? "fiat")
      const fp = Number(existing.feePercent ?? 0)
      const ff = Number(existing.feeFixed ?? 0)
      if (fp > 0 && ff > 0) setFeeType("both")
      else if (fp > 0)       setFeeType("percent")
      else if (ff > 0)       setFeeType("fixed")
      else                   setFeeType("none")
      setFeePercent(String(fp))
      setFeeFixed(String(ff))
      setMinAmount(String(existing.minAmount ?? 0))
      setMaxAmount(String(existing.maxAmount ?? 0))
      setSortOrder(String(existing.sortOrder ?? 0))
      setInstructions(String(existing.instructions ?? ""))
      setEnableNow(Boolean(existing.isEnabled))
      setSlugStatus("ok")
      // Logo
      setLogoUrl(String(existing.logoUrl ?? ""))
      setLogoPublicId(String(existing.logoPublicId ?? ""))
      setLogoPreview(String(existing.logoUrl ?? ""))
      setLogoFile(null)
      // Payment info
      const pi = (existing.paymentInfo ?? {}) as PaymentInfo
      setPaymentInfo(pi)
      setSelectedBrands(pi.acceptedBrands ?? [])
    } else {
      setName(""); setSlug(""); setType("bank_transfer"); setIcon("")
      setDepositTarget("fiat"); setFeeType("none"); setFeePercent("0"); setFeeFixed("0")
      setMinAmount("0"); setMaxAmount("0"); setSortOrder("0"); setInstructions("")
      setEnableNow(false); setSlugStatus("idle"); setSlugDirty(false)
      setLogoFile(null); setLogoPreview(""); setLogoUrl(""); setLogoPublicId("")
      setPaymentInfo({}); setSelectedBrands([])
    }
  }, [open, existing])

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEdit && !slugDirty && name) {
      setSlug(toSlug(name))
    }
  }, [name, isEdit, slugDirty])

  // Slug uniqueness check (skip in edit mode — slug is locked)
  const checkSlug = useCallback(async (s: string) => {
    if (isEdit || !s) return
    setSlugStatus("checking")
    try {
      const res  = await fetch(`/api/admin/payment-methods?_check=1`)
      const data = await res.json() as Array<{ slug: string }>
      const taken = (data as Record<string, unknown>[]).some((m) => m.slug === s)
      setSlugStatus(taken ? "taken" : "ok")
    } catch {
      setSlugStatus("idle")
    }
  }, [isEdit])

  useEffect(() => {
    if (slugDebounce.current) clearTimeout(slugDebounce.current)
    if (!slug || isEdit) return
    slugDebounce.current = setTimeout(() => checkSlug(slug), 500)
  }, [slug, checkSlug, isEdit])

  // Fee example
  const feeExample = (() => {
    const fp = parseFloat(feePercent) || 0
    const ff = parseFloat(feeFixed)   || 0
    const fee = 100 * fp / 100 + ff
    return fee > 0 ? `For a $100 deposit: fee = $${fee.toFixed(2)}, net credit = $${(100 - fee).toFixed(2)}` : "No fee for a $100 deposit"
  })()

  // Logo upload handler
  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Logo must be under 2MB", variant: "destructive" })
      return
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" })
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [toast])

  // Upload logo to Cloudinary
  const uploadLogo = useCallback(async (): Promise<{ url: string; publicId: string } | null> => {
    if (!logoFile) return logoUrl ? { url: logoUrl, publicId: logoPublicId } : null
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", logoFile)
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "")
      formData.append("folder", "payment-methods")
      
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Upload failed")
      return { url: data.secure_url, publicId: data.public_id }
    } catch (err) {
      toast({ title: "Logo upload failed", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
      return null
    } finally {
      setUploadingLogo(false)
    }
  }, [logoFile, logoUrl, logoPublicId, toast])

  // Update payment info field
  const updatePaymentInfo = useCallback((field: keyof PaymentInfo, value: string) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }))
  }, [])

  // Toggle brand selection
  const toggleBrand = useCallback((brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }, [])

  async function submit() {
    if (!name || (slugStatus === "taken" && !isEdit)) return
    setSubmitting(true)
    try {
      // Upload logo if needed
      let finalLogoUrl = logoUrl
      let finalLogoPublicId = logoPublicId
      if (logoFile) {
        const uploaded = await uploadLogo()
        if (uploaded) {
          finalLogoUrl = uploaded.url
          finalLogoPublicId = uploaded.publicId
        }
      }

      const fp = feeType === "none" || feeType === "fixed"    ? 0 : parseFloat(feePercent) || 0
      const ff = feeType === "none" || feeType === "percent"  ? 0 : parseFloat(feeFixed)   || 0
      
      // Build payment info based on type
      const finalPaymentInfo: PaymentInfo = { ...paymentInfo }
      if (type === "giftcard") {
        finalPaymentInfo.acceptedBrands = selectedBrands
      }

      const body = {
        name, type, icon: icon || undefined, depositTarget, isEnabled: enableNow,
        feePercent: fp, feeFixed: ff,
        minAmount: parseFloat(minAmount) || 0,
        maxAmount: parseFloat(maxAmount) || 0,
        sortOrder: parseInt(sortOrder)   || 0,
        instructions: instructions || undefined,
        logoUrl: finalLogoUrl || undefined,
        logoPublicId: finalLogoPublicId || undefined,
        paymentInfo: Object.keys(finalPaymentInfo).length > 0 ? finalPaymentInfo : undefined,
        ...(!isEdit ? { slug } : {}),
      }
      const url    = isEdit ? `/api/admin/payment-methods/${String(existing!._id ?? existing!.id)}` : "/api/admin/payment-methods"
      const method = isEdit ? "PATCH" : "POST"
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      toast({ title: isEdit ? "Method updated" : "Method created" })
      onSuccess(data)
      onOpenChange(false)
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" style={{ background: "#FFFFFF", color: "#101828" }}>
        <DialogHeader className="pb-4 border-b" style={{ borderColor: "#EAECF0" }}>
          <DialogTitle style={{ color: "#101828" }}>{isEdit ? "Edit payment method" : "New payment method"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm" style={{ color: "#101828" }}>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bank Transfer" style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
            </div>

            <div>
              <Label className="mb-1.5 block text-sm flex items-center gap-1" style={{ color: "#101828" }}>
                Slug
                {isEdit && <Lock className="w-3 h-3 text-gray-400" />}
              </Label>
              {isEdit ? (
                <Input value={slug} disabled style={{ background: "#F5F6F8", color: "#98A2B3", borderColor: "#EAECF0" }} />
              ) : (
                <div className="relative">
                  <Input
                    value={slug}
                    onChange={(e) => { setSlug(e.target.value); setSlugDirty(true) }}
                    placeholder="bank-transfer"
                    style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }}
                  />
                  {slugStatus === "checking" && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-gray-400" />
                  )}
                  {slugStatus === "ok"    && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 text-xs">✓</span>}
                  {slugStatus === "taken" && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">✗</span>}
                </div>
              )}
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>URL-safe identifier — auto-generated from name</p>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm" style={{ color: "#101828" }}>Type</Label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full h-9 px-3 text-sm border rounded-md"
                style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }}>
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm" style={{ color: "#101828" }}>Icon (Lucide icon name, optional)</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Landmark" style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
            </div>

            {/* Logo upload */}
            <div>
              <Label className="mb-1.5 block text-sm" style={{ color: "#101828" }}>Logo (optional)</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
              {logoPreview ? (
                <div className="relative w-20 h-20 rounded-lg border overflow-hidden group" style={{ borderColor: "#EAECF0" }}>
                  <Image src={logoPreview} alt="Logo preview" fill className="object-contain p-1" />
                  <button
                    onClick={() => { setLogoFile(null); setLogoPreview(""); setLogoUrl(""); setLogoPublicId("") }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "#F04438" }}
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors"
                  style={{ borderColor: "#D0D5DD", color: "#64748B", background: "#FFFFFF" }}
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Upload</span>
                </button>
              )}
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>Max 2MB, displayed on deposit page</p>
            </div>

            <div>
              <Label className="mb-2 block text-sm" style={{ color: "#101828" }}>Deposit target</Label>
              <div className="space-y-2">
                {[
                  { value: "fiat",    label: "Credits fiat account",    desc: "Confirmed deposits added to user's primary fiat account" },
                  { value: "bitcoin", label: "Credits Bitcoin wallet",   desc: "Confirmed deposits added to user's Bitcoin wallet in satoshis" },
                ].map((opt) => (
                  <label key={opt.value} 
                    className="flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all"
                    style={depositTarget === opt.value 
                      ? { borderColor: "#1A2CCE", background: "rgba(26, 44, 206, 0.05)" }
                      : { borderColor: "#EAECF0", background: "#FFFFFF" }
                    }>
                    <input type="radio" name="depositTarget" value={opt.value}
                      checked={depositTarget === opt.value}
                      onChange={() => setDepositTarget(opt.value as "fiat" | "bitcoin")}
                      className="mt-0.5"
                      style={{ accentColor: "#1A2CCE" }}
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#101828" }}>{opt.label}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">
            {/* Fee structure */}
            <div>
              <Label className="mb-2 block text-sm" style={{ color: "#101828" }}>Fee structure</Label>
              <div className="flex gap-2 flex-wrap mb-3">
                {(["none","percent","fixed","both"] as FeeType[]).map((ft) => (
                  <button key={ft} onClick={() => setFeeType(ft)}
                    className="text-xs px-2.5 py-1 rounded border capitalize transition-colors"
                    style={feeType === ft 
                      ? { background: "#1A2CCE", color: "#FFFFFF", borderColor: "#1A2CCE" }
                      : { background: "#FFFFFF", color: "#667085", borderColor: "#EAECF0" }
                    }>
                    {ft}
                  </button>
                ))}
              </div>
              {(feeType === "percent" || feeType === "both") && (
                <div className="mb-2">
                  <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Fee percent (%)</Label>
                  <Input type="number" min={0} step={0.01} value={feePercent} onChange={(e) => setFeePercent(e.target.value)} style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
                </div>
              )}
              {(feeType === "fixed" || feeType === "both") && (
                <div className="mb-2">
                  <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Fixed fee ($)</Label>
                  <Input type="number" min={0} step={0.01} value={feeFixed} onChange={(e) => setFeeFixed(e.target.value)} style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
                </div>
              )}
              <p className="text-xs mt-1 rounded p-2" style={{ color: "#64748B", background: "#F5F6F8" }}>{feeExample}</p>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm" style={{ color: "#101828" }}>Min amount ($)</Label>
                <Input type="number" min={0} value={minAmount} onChange={(e) => setMinAmount(e.target.value)} style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm" style={{ color: "#101828" }}>Max amount ($)</Label>
                <Input type="number" min={0} value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
            </div>
            <p className="text-xs -mt-2" style={{ color: "#64748B" }}>Leave max at 0 for no upper limit</p>

            <div>
              <Label className="mb-1.5 block text-sm" style={{ color: "#101828" }}>Sort order</Label>
              <Input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={enableNow} onChange={(e) => setEnableNow(e.target.checked)} className="rounded" style={{ accentColor: "#1A2CCE" }} />
              <span className="text-sm" style={{ color: "#667085" }}>Enable immediately after {isEdit ? "saving" : "creating"}</span>
            </label>
          </div>
        </div>

        {/* ── FULL WIDTH: Payment Info Fields ── */}
        <div className="mt-6 space-y-4 border-t pt-6" style={{ borderColor: "#EAECF0" }}>
          <Label className="text-sm font-medium" style={{ color: "#101828" }}>Payment Information (shown to users)</Label>
          
          {/* Bank Transfer / Wire fields */}
          {(type === "bank_transfer" || type === "wire") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Bank Name</Label>
                <Input value={paymentInfo.bankName || ""} onChange={(e) => updatePaymentInfo("bankName", e.target.value)} placeholder="Chase Bank" style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
              <div>
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Account Name</Label>
                <Input value={paymentInfo.accountName || ""} onChange={(e) => updatePaymentInfo("accountName", e.target.value)} placeholder="Company LLC" style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
              <div>
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Account Number</Label>
                <Input value={paymentInfo.accountNumber || ""} onChange={(e) => updatePaymentInfo("accountNumber", e.target.value)} placeholder="1234567890" style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
              <div>
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Routing Number</Label>
                <Input value={paymentInfo.routingNumber || ""} onChange={(e) => updatePaymentInfo("routingNumber", e.target.value)} placeholder="021000021" style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
              {type === "wire" && (
                <>
                  <div>
                    <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>SWIFT Code</Label>
                    <Input value={paymentInfo.swiftCode || ""} onChange={(e) => updatePaymentInfo("swiftCode", e.target.value)} placeholder="CHASUS33" style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>IBAN</Label>
                    <Input value={paymentInfo.iban || ""} onChange={(e) => updatePaymentInfo("iban", e.target.value)} placeholder="US12345..." style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Bank Address</Label>
                <Input value={paymentInfo.bankAddress || ""} onChange={(e) => updatePaymentInfo("bankAddress", e.target.value)} placeholder="123 Main St, New York, NY 10001" style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Phone Number <span style={{ color: "#94A3B8" }}>(optional)</span></Label>
                <Input value={paymentInfo.phoneNumber || ""} onChange={(e) => updatePaymentInfo("phoneNumber", e.target.value)} placeholder="+1 (555) 123-4567" style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
            </div>
          )}

          {/* PayPal / Venmo / Zelle / Cash App fields */}
          {(type === "paypal" || type === "venmo" || type === "zelle" || type === "cash_app") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Email</Label>
                <Input type="email" value={paymentInfo.email || ""} onChange={(e) => updatePaymentInfo("email", e.target.value)} placeholder="payments@company.com" style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
              <div>
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Username / Tag</Label>
                <Input value={paymentInfo.username || ""} onChange={(e) => updatePaymentInfo("username", e.target.value)} placeholder={type === "cash_app" ? "$cashtag" : "@username"} style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
              <div>
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Phone Number</Label>
                <Input value={paymentInfo.phoneNumber || ""} onChange={(e) => updatePaymentInfo("phoneNumber", e.target.value)} placeholder="+1 (555) 123-4567" style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
            </div>
          )}

          {/* Bitcoin / Crypto fields */}
          {(type === "bitcoin" || type === "crypto_other") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Wallet Address</Label>
                <Input value={paymentInfo.walletAddress || ""} onChange={(e) => updatePaymentInfo("walletAddress", e.target.value)} placeholder="bc1q..." style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
              <div>
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Network</Label>
                <Input value={paymentInfo.network || ""} onChange={(e) => updatePaymentInfo("network", e.target.value)} placeholder={type === "bitcoin" ? "Bitcoin (BTC)" : "ERC-20, TRC-20, etc."} style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }} />
              </div>
            </div>
          )}

          {/* Gift Card fields */}
          {type === "giftcard" && (
            <div className="space-y-3">
              <div>
                <Label className="mb-2 block text-xs" style={{ color: "#64748B" }}>Accepted Gift Card Brands</Label>
                <div className="flex flex-wrap gap-2">
                  {GIFT_CARD_BRANDS.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className="text-xs px-2.5 py-1.5 rounded-full border transition-colors"
                      style={selectedBrands.includes(brand)
                        ? { background: "#1A2CCE", color: "#FFFFFF", borderColor: "#1A2CCE" }
                        : { background: "#FFFFFF", color: "#667085", borderColor: "#EAECF0" }
                      }
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-1 block text-xs" style={{ color: "#64748B" }}>Redemption Instructions</Label>
                <textarea
                  value={paymentInfo.redemptionInstructions || ""}
                  onChange={(e) => updatePaymentInfo("redemptionInstructions", e.target.value)}
                  placeholder="How users should submit their gift cards..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-md resize-none focus:outline-none"
                  style={{ background: "#FFFFFF", color: "#101828", borderColor: "#EAECF0" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── FULL WIDTH: Instructions ── */}
        <div className="mt-6 space-y-3 border-t pt-6" style={{ borderColor: "#EAECF0" }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Label className="text-sm font-medium" style={{ color: "#101828" }}>Instructions (markdown)</Label>
            <div className="flex gap-2">
              <button onClick={() => setPreview((v) => !v)}
                className="text-xs px-3 py-1 rounded border transition-colors"
                style={{ background: "#FFFFFF", color: "#667085", borderColor: "#EAECF0" }}>
                {preview ? "Edit" : "Preview"}
              </button>
              <span className="text-xs px-2 py-1" style={{ color: instructions.length > MAX_INSTRUCTIONS ? "#F04438" : "#98A2B3" }}>
                {instructions.length}/{MAX_INSTRUCTIONS}
              </span>
            </div>
          </div>

          {!preview ? (
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#EAECF0" }}>
              {/* Toolbar */}
              <div className="flex gap-1 px-2 py-1.5 border-b" style={{ background: "#F5F6F8", borderColor: "#EAECF0" }}>
                {[
                  { icon: <Bold   className="w-3.5 h-3.5" />, before: "**", after: "**" },
                  { icon: <Italic className="w-3.5 h-3.5" />, before: "*",  after: "*"  },
                  { icon: <List   className="w-3.5 h-3.5" />, before: "- ", after: ""   },
                  { icon: <LinkIcon className="w-3.5 h-3.5" />, before: "[", after: "](url)" },
                ].map((btn, i) => (
                  <button key={i} onClick={() => insertAtCursor(taRef, setInstructions, btn.before, btn.after)}
                    className="p-1 rounded transition-colors"
                    style={{ color: "#64748B" }}>
                    {btn.icon}
                  </button>
                ))}
              </div>
              <textarea
                ref={taRef}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={6}
                maxLength={MAX_INSTRUCTIONS}
                placeholder="Enter instructions shown to users when they select this payment method…"
                className="w-full px-3 py-2 text-sm resize-y focus:outline-none font-mono"
                style={{ background: "#FFFFFF", color: "#101828" }}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-4 min-h-[120px] max-h-[200px] overflow-y-auto" style={{ borderColor: "#EAECF0", background: "#F5F6F8" }}>
              <div
                className="prose prose-sm max-w-none text-sm leading-relaxed"
                style={{ color: "#667085" }}
                dangerouslySetInnerHTML={{ __html: renderMarkdownLite(instructions || "_No content_") }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t mt-6" style={{ borderColor: "#EAECF0" }}>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto"
            style={{ background: "#FFFFFF", color: "#667085", borderColor: "#EAECF0" }}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!name || (slugStatus === "taken" && !isEdit) || submitting || instructions.length > MAX_INSTRUCTIONS}
            className="w-full sm:w-auto"
            style={{ background: "#1A2CCE", color: "#FFFFFF", borderColor: "#1A2CCE" }}
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…</>
              : isEdit ? "Save changes" : "Create payment method"}
          </Button>
        </div>
        {isEdit && !!existing?.updatedAt && (
          <p className="text-xs text-center sm:text-right mt-2" style={{ color: "#64748B" }}>
            Last updated: {new Date(existing.updatedAt as string).toLocaleString()}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
