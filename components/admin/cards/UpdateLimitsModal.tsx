"use client"

import { useState } from "react"
import { Loader2 }  from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import type { CardDetail } from "@/lib/services/card.service"

interface Props {
  card:         CardDetail
  open:         boolean
  onOpenChange: (v: boolean) => void
  onSuccess:    () => void
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })

export function UpdateLimitsModal({ card, open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast()

  const [creditLimit,   setCreditLimit]   = useState(String(card.creditLimit  ?? ""))
  const [spendingLimit, setSpendingLimit] = useState(String(card.spendingLimit ?? ""))
  const [submitting,    setSubmitting]    = useState(false)

  const newCredit   = parseFloat(creditLimit)
  const newSpending = parseFloat(spendingLimit)

  async function submit() {
    setSubmitting(true)
    try {
      const body: Record<string, number> = {}
      if (!isNaN(newCredit)   && newCredit   > 0) body.creditLimit   = newCredit
      if (!isNaN(newSpending) && newSpending > 0) body.spendingLimit = newSpending
      if (Object.keys(body).length === 0) return

      const res  = await fetch(`/api/admin/cards/${card.id}/limits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Update failed")
      toast({ title: "Limits updated", description: "Card limits have been updated." })
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update card limits</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {/* Current */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <p className="text-xs font-medium text-gray-500 mb-2">Current limits</p>
            <div className="flex justify-between">
              <span className="text-gray-500">Credit limit</span>
              <span>{card.creditLimit != null ? fmt(card.creditLimit) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Spending limit</span>
              <span>{card.spendingLimit != null ? fmt(card.spendingLimit) : "—"}</span>
            </div>
          </div>

          {/* New values */}
          <div>
            <Label className="mb-1.5 block text-sm">New credit limit</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input type="number" className="pl-7" value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)} min={1} />
            </div>
            {card.creditLimit != null && !isNaN(newCredit) && newCredit > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {fmt(card.creditLimit)} → <span className="font-medium text-gray-700">{fmt(newCredit)}</span>
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">New spending limit (per transaction)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input type="number" className="pl-7" value={spendingLimit}
                onChange={(e) => setSpendingLimit(e.target.value)} min={1} />
            </div>
            {card.spendingLimit != null && !isNaN(newSpending) && newSpending > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {fmt(card.spendingLimit)} → <span className="font-medium text-gray-700">{fmt(newSpending)}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={submit} disabled={submitting} className="w-full sm:w-auto bg-[#1A2CCE] hover:bg-[#1A2CCE]/90">
              {submitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Updating…</> : "Update limits"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
