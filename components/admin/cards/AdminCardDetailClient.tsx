"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, CreditCard, Wifi } from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { CardBrandMark } from "@/components/CardBrandLogo"
import type { CardDetail } from "@/lib/services/card.service"

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })

const STATUS_OPTIONS   = ["pending", "approved", "rejected", "active", "frozen", "blocked", "cancelled"]
const DELIVERY_OPTIONS = ["", "processing", "shipped", "delivered"]

const inputCls  = "h-10"
const selectCls = "w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A2CCE]/30"

function formatCardNumber(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 19)
  return digits.replace(/(.{4})/g, "$1 ").trim()
}

export function AdminCardDetailClient({ card }: { card: CardDetail }) {
  const router    = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    cardholderName:  card.cardholderName ?? "",
    cardNumber:      card.cardNumber ? formatCardNumber(card.cardNumber) : "",
    cvv:             card.cvv ?? "",
    expiryMonth:     card.expiryMonth ? String(card.expiryMonth) : "",
    expiryYear:      card.expiryYear ? String(card.expiryYear) : "",
    cardPin:         card.cardPin ?? "",
    cardNetwork:     card.cardNetwork ?? "visa",
    cardType:        card.cardType ?? "debit",
    isVirtual:       card.isVirtual,
    creditLimit:     card.creditLimit != null ? String(card.creditLimit) : "",
    spendingLimit:   card.spendingLimit != null ? String(card.spendingLimit) : "",
    dailySpendLimit: card.dailySpendLimit != null ? String(card.dailySpendLimit) : "",
    status:          card.status,
    deliveryStatus:  card.deliveryStatus ?? "",
    adminNote:       card.adminNote ?? "",
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      const body = {
        cardholderName:  form.cardholderName,
        cardNumber:      form.cardNumber,
        cvv:             form.cvv,
        expiryMonth:     form.expiryMonth ? Number(form.expiryMonth) : undefined,
        expiryYear:      form.expiryYear ? Number(form.expiryYear) : undefined,
        cardPin:         form.cardPin,
        cardNetwork:     form.cardNetwork as "visa" | "mastercard" | "amex",
        cardType:        form.cardType as "debit" | "credit",
        isVirtual:       form.isVirtual,
        creditLimit:     form.creditLimit ? Number(form.creditLimit) : undefined,
        spendingLimit:   form.spendingLimit ? Number(form.spendingLimit) : undefined,
        dailySpendLimit: form.dailySpendLimit ? Number(form.dailySpendLimit) : undefined,
        status:          form.status,
        adminNote:       form.adminNote,
        ...(form.isVirtual ? {} : { deliveryStatus: form.deliveryStatus || undefined }),
      }
      const res  = await fetch(`/api/admin/cards/${card.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Update failed")
      toast({ title: "Card updated", description: "All changes have been saved." })
      router.refresh()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const last4 = form.cardNumber.replace(/\D/g, "").slice(-4)

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/admin/cards" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to cards
      </Link>

      {/* Header + preview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manage Card</h1>
          <p className="text-sm text-gray-500 mt-1">
            {card.userName} · {card.userEmail}
          </p>
        </div>

        {/* Mini card preview */}
        <div
          className="relative w-full sm:w-64 rounded-xl p-4 text-white overflow-hidden flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #1a2a4a 0%, #0f1e36 60%, #0f3460 100%)", minHeight: 128 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-white/60">
              {form.isVirtual ? "Virtual" : "Physical"} {form.cardType}
            </span>
            {form.isVirtual ? <Wifi className="w-4 h-4 text-white/50" /> : <CreditCard className="w-4 h-4 text-white/50" />}
          </div>
          <p className="mt-5 font-mono text-[15px] tracking-widest text-white/90">
            {form.cardNumber || "•••• •••• •••• ••••"}
          </p>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-[12px] text-white/80 truncate max-w-[9rem]">{form.cardholderName || "CARDHOLDER"}</span>
            <CardBrandMark network={form.cardNetwork} className="h-5 w-auto" />
          </div>
        </div>
      </div>

      {/* Card details */}
      <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Card details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Cardholder name</Label>
            <Input className={inputCls} value={form.cardholderName}
              onChange={(e) => set("cardholderName", e.target.value)} placeholder="JOHN DOE" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Network</Label>
            <select className={selectCls} value={form.cardNetwork} onChange={(e) => set("cardNetwork", e.target.value)}>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-gray-600">Card number</Label>
            <Input className={`${inputCls} font-mono`} value={form.cardNumber}
              onChange={(e) => set("cardNumber", formatCardNumber(e.target.value))}
              inputMode="numeric" placeholder="4111 1111 1111 1111" />
          </div>

          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Exp. month</Label>
              <Input className={inputCls} value={form.expiryMonth} inputMode="numeric"
                onChange={(e) => set("expiryMonth", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="MM" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Exp. year</Label>
              <Input className={inputCls} value={form.expiryYear} inputMode="numeric"
                onChange={(e) => set("expiryYear", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="YYYY" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">CVV</Label>
              <Input className={inputCls} value={form.cvv} inputMode="numeric"
                onChange={(e) => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Card PIN (4 digits)</Label>
            <Input className={inputCls} value={form.cardPin} inputMode="numeric"
              onChange={(e) => set("cardPin", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Type</Label>
            <select className={selectCls} value={form.cardType} onChange={(e) => set("cardType", e.target.value)}>
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Format</Label>
            <select className={selectCls} value={form.isVirtual ? "virtual" : "physical"}
              onChange={(e) => set("isVirtual", e.target.value === "virtual")}>
              <option value="virtual">Virtual</option>
              <option value="physical">Physical</option>
            </select>
          </div>
        </div>
      </section>

      {/* Limits */}
      <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Limits &amp; balance</h2>
          <span className="text-xs text-gray-400">Balance: {fmt((card.balance ?? 0) / 100)}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Credit limit ($)</Label>
            <Input className={inputCls} value={form.creditLimit} inputMode="decimal"
              onChange={(e) => set("creditLimit", e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Spending limit ($)</Label>
            <Input className={inputCls} value={form.spendingLimit} inputMode="decimal"
              onChange={(e) => set("spendingLimit", e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Daily spend limit ($)</Label>
            <Input className={inputCls} value={form.dailySpendLimit} inputMode="decimal"
              onChange={(e) => set("dailySpendLimit", e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Status &amp; notes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Card status</Label>
            <select className={selectCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          {!form.isVirtual && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Delivery status</Label>
              <select className={selectCls} value={form.deliveryStatus} onChange={(e) => set("deliveryStatus", e.target.value)}>
                {DELIVERY_OPTIONS.map((s) => <option key={s || "none"} value={s}>{s ? s[0].toUpperCase() + s.slice(1) : "— None —"}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-gray-600">Admin note</Label>
            <Textarea rows={2} className="resize-none text-sm" value={form.adminNote}
              onChange={(e) => set("adminNote", e.target.value)} placeholder="Internal note about this card…" />
          </div>
        </div>
        {card.referenceNumber && (
          <p className="text-xs text-gray-400">Reference: <span className="font-mono">{card.referenceNumber}</span></p>
        )}
      </section>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-4 sm:mx-0 bg-white/90 backdrop-blur border-t border-gray-200 px-4 sm:px-0 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/admin/cards">Cancel</Link>
        </Button>
        <Button onClick={save} disabled={saving}
          className="w-full sm:w-auto bg-[#1A2CCE] hover:bg-[#1A2CCE]/90">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save changes"}
        </Button>
      </div>
    </div>
  )
}
