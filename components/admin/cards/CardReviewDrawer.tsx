"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { X, AlertTriangle, Loader2, Check } from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import type { CardDetail } from "@/lib/services/card.service"
import { CardBrandMark } from "@/components/CardBrandLogo"

interface Props {
  cardId:   string | null
  onClose:  () => void
  onAction: () => void
}

type CardTypeKey = "virtual_debit" | "physical_debit" | "virtual_credit" | "physical_credit"

const CARD_TYPE_INFO: Record<CardTypeKey, { label: string; desc: string; isCredit: boolean }> = {
  virtual_debit:    { label: "Virtual debit",    isCredit: false, desc: "Instant, no physical card. Deducts from account balance." },
  physical_debit:   { label: "Physical debit",   isCredit: false, desc: "Requires mailing. 3–5 business days." },
  virtual_credit:   { label: "Virtual credit",   isCredit: true,  desc: "Instant credit card. Subject to credit limit." },
  physical_credit:  { label: "Physical credit",  isCredit: true,  desc: "Mailed credit card. Subject to credit limit." },
}

const CREDIT_PRESETS = [500, 1000, 2500, 5000, 10000]
const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || "BANK"

function CardNetworkLogo({ network }: { network: string }) {
  return <CardBrandMark network={network} className="h-5 w-auto" />
}

function CardPreview({
  cardType, last4, holderName, expiry, cardNetwork,
}: { cardType: CardTypeKey; last4: string; holderName: string; expiry: string; cardNetwork?: string }) {
  const info = CARD_TYPE_INFO[cardType] ?? CARD_TYPE_INFO.virtual_debit
  const isCredit = info.isCredit
  return (
    <div className="relative rounded-2xl p-5 text-white overflow-hidden"
      style={{
        background: isCredit
          ? "linear-gradient(135deg, #0F4C81 0%, #1a3a5c 100%)"
          : "linear-gradient(135deg, #1a2a4a 0%, #0f1e36 100%)",
        aspectRatio: "1.585",
        maxWidth: 320,
      }}>
      {/* Shimmer */}
      <div className="absolute inset-0 opacity-10"
        style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)" }} />
      {/* Logo */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs font-bold tracking-widest opacity-80">{BANK_NAME.toUpperCase()}</p>
          <p className="text-xs opacity-50">{info.label.toUpperCase()}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-xs font-bold">{BANK_NAME.charAt(0).toUpperCase()}</span>
        </div>
      </div>
      {/* Chip */}
      <div className="w-10 h-7 rounded bg-white/20 mb-4" />
      {/* Number */}
      <p className="tracking-widest text-sm font-mono mb-4 opacity-90">
        **** **** **** {last4}
      </p>
      {/* Footer */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs opacity-50">CARD HOLDER</p>
          <p className="text-xs font-semibold tracking-wide">{holderName || "FULL NAME"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-50">EXPIRES</p>
          <p className="text-xs font-semibold">{expiry}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <CardNetworkLogo network={cardNetwork || "visa"} />
          <p className="text-[10px] font-bold opacity-70">{isCredit ? "CREDIT" : "DEBIT"}</p>
        </div>
      </div>
    </div>
  )
}

export function CardReviewDrawer({ cardId, onClose, onAction }: Props) {
  const { toast } = useToast()

  const [card,      setCard]      = useState<CardDetail | null>(null)
  const [loading,   setLoading]   = useState(false)

  const [cardType,      setCardType]      = useState<CardTypeKey>("virtual_debit")
  const [creditLimit,   setCreditLimit]   = useState("")
  const [spendingLimit, setSpendingLimit] = useState("")
  const [adminNote,     setAdminNote]     = useState("")
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [rejectMode,    setRejectMode]    = useState(false)
  const [rejectReason,  setRejectReason]  = useState("")
  const [submitting,    setSubmitting]    = useState(false)

  // Preview last 4 — randomized once per open
  const last4 = useMemo(() => Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join(""), [cardId])
  const expiry = useMemo(() => {
    const yr = new Date().getFullYear() + (Math.random() < 0.5 ? 3 : 4)
    const mo = Math.floor(Math.random() * 12) + 1
    return `${String(mo).padStart(2, "0")}/${String(yr).slice(-2)}`
  }, [cardId])

  const fetchCard = useCallback(async () => {
    if (!cardId) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/cards/${cardId}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load card details")
      }
      setCard(data)
      
      // Determine the full card type from cardType + isVirtual
      const baseType = data.cardType === "credit" ? "credit" : "debit"
      const isVirtual = data.isVirtual ?? true
      const fullCardType = `${isVirtual ? "virtual" : "physical"}_${baseType}` as CardTypeKey
      setCardType(fullCardType)
      
      // Prefill limits from user's application
      if (data.preferredLimit) {
        setCreditLimit(String(data.preferredLimit))
      } else if (data.creditLimit) {
        setCreditLimit(String(data.creditLimit))
      }
      if (data.dailySpendLimit) {
        setSpendingLimit(String(data.dailySpendLimit))
      } else if (data.spendingLimit) {
        setSpendingLimit(String(data.spendingLimit))
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to load card", variant: "destructive" })
      onClose()
    } finally {
      setLoading(false)
    }
  }, [cardId, toast, onClose])

  useEffect(() => { fetchCard() }, [fetchCard])

  const cardTypeInfo = CARD_TYPE_INFO[cardType] ?? CARD_TYPE_INFO.virtual_debit
  const isCredit    = cardTypeInfo.isCredit
  const holderName  = card ? `${card.userFirstName} ${card.userLastName}`.toUpperCase() : ""

  async function handleApprove() {
    if (!card) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/cards/${card.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardType,
          creditLimit:   parseFloat(creditLimit)   || 1000,
          spendingLimit: parseFloat(spendingLimit) || 500,
          adminNote: adminNote || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      toast({ title: "Card approved", description: `Card ending in ${last4} is now active.` })
      onAction()
      onClose()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject() {
    if (!card || rejectReason.length < 10) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/cards/${card.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      toast({ title: "Application rejected" })
      onAction()
      onClose()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (!cardId) return null

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[560px] bg-white flex flex-col h-full shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Review card application</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && card && (
          <div className="flex-1 p-5 space-y-5">
            {/* Applicant */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A2CCE] text-white flex items-center justify-center font-semibold text-sm">
                  {card.userFirstName?.[0]}{card.userLastName?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{card.userName}</p>
                  <p className="text-xs text-gray-500">{card.userEmail}</p>
                </div>
                <span className={[
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  card.userKycStatus === "verified" ? "bg-emerald-100 text-emerald-700" :
                  card.userKycStatus === "pending"  ? "bg-amber-100   text-amber-700"   :
                  "bg-gray-100 text-gray-500",
                ].join(" ")}>KYC: {card.userKycStatus}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded-lg p-2.5">
                  <p className="text-gray-400">Requested card type</p>
                  <p className="font-medium capitalize mt-0.5">
                    {card.isVirtual ? "Virtual" : "Physical"} {card.cardType}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2.5">
                  <p className="text-gray-400">Card network</p>
                  <p className="font-medium capitalize mt-0.5">{card.cardNetwork || "Visa"}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5">
                  <p className="text-gray-400">Applied</p>
                  <p className="font-medium mt-0.5">{new Date(card.appliedAt).toLocaleDateString()}</p>
                </div>
                {(card.preferredLimit || card.creditLimit) && (
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-gray-400">Requested credit limit</p>
                    <p className="font-medium mt-0.5">{fmt(card.preferredLimit || card.creditLimit || 0)}</p>
                  </div>
                )}
                {(card.dailySpendLimit || card.spendingLimit) && (
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-gray-400">Requested spending limit</p>
                    <p className="font-medium mt-0.5">{fmt(card.dailySpendLimit || card.spendingLimit || 0)}</p>
                  </div>
                )}
              </div>

              {/* Delivery address for physical cards */}
              {!card.isVirtual && card.deliveryAddress && (
                <div className="mt-2 bg-white rounded-lg p-2.5 text-xs">
                  <p className="text-gray-400">Delivery address (mails in 3–5 business days)</p>
                  <p className="font-medium mt-0.5 text-gray-800">
                    {[card.deliveryAddress.street, card.deliveryAddress.city, card.deliveryAddress.state, card.deliveryAddress.zip, card.deliveryAddress.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
            </div>

            {/* KYC warning for credit */}
            {isCredit && card.userKycStatus !== "verified" && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  User KYC is not verified. Credit card approval requires verified KYC.
                </p>
              </div>
            )}

            {/* Card type selector */}
            <div>
              <Label className="mb-2 block text-sm">Card type</Label>
              <div className="space-y-2">
                {(Object.entries(CARD_TYPE_INFO) as [CardTypeKey, typeof CARD_TYPE_INFO[CardTypeKey]][]).map(([key, info]) => (
                  <label key={key} className={[
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    cardType === key
                      ? "border-[#1A2CCE] bg-[#1A2CCE]/5 ring-1 ring-[#1A2CCE]/30"
                      : "border-gray-200 hover:border-gray-300",
                  ].join(" ")}>
                    <input type="radio" name="cardType" value={key}
                      checked={cardType === key}
                      onChange={() => setCardType(key)}
                      className="mt-0.5 accent-[#1A2CCE]"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{info.label}</p>
                      <p className="text-xs text-gray-500">{info.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Limits */}
            <div className="space-y-3">
              {isCredit && (
                <div>
                  <Label className="mb-1.5 block text-sm">Credit limit</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <Input type="number" className="pl-7" value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)} placeholder="e.g. 2500" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {CREDIT_PRESETS.map((p) => (
                      <button key={p} onClick={() => setCreditLimit(String(p))}
                        className={[
                          "text-xs px-2 py-0.5 rounded border",
                          creditLimit === String(p)
                            ? "bg-[#1A2CCE] text-white border-[#1A2CCE]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-400",
                        ].join(" ")}>
                        {fmt(p)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label className="mb-1.5 block text-sm">
                  Spending limit (per transaction)
                  {isCredit && <span className="text-gray-400 ml-1">— set lower than credit limit</span>}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <Input type="number" className="pl-7" value={spendingLimit}
                    onChange={(e) => setSpendingLimit(e.target.value)} placeholder="e.g. 500" />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Admin note (optional)</Label>
                <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Internal note…" rows={2} />
              </div>
            </div>

            {/* Card preview */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Card preview</p>
              <CardPreview cardType={cardType} last4={last4} holderName={holderName} expiry={expiry} cardNetwork={card?.cardNetwork} />
            </div>

            {/* Reject mode */}
            {rejectMode && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-red-700">Rejection reason (required)</p>
                <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this application is being rejected…" rows={3} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleReject}
                    disabled={rejectReason.length < 10 || submitting}
                    className="bg-red-600 hover:bg-red-700 text-white">
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm rejection"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectMode(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {card && !loading && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            {confirmApprove ? (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-xs text-emerald-800">
                  You are about to approve a <strong>{cardTypeInfo.label}</strong> card for{" "}
                  <strong>{card.userName}</strong>.
                  {isCredit && creditLimit && ` Credit limit: ${fmt(parseFloat(creditLimit) || 0)}.`}
                  {" "}The card will be activated immediately.
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApprove} disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    {submitting
                      ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Approving…</>
                      : <><Check className="w-4 h-4 mr-1" /> Confirm approval</>}
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmApprove(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => { setRejectMode(false); setConfirmApprove(true) }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Approve card
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setConfirmApprove(false); setRejectMode(true) }}
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
