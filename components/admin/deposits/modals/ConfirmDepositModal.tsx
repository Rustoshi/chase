"use client"

import { useState, useEffect }  from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Button }   from "@/components/ui/button"
import { toast }    from "@/components/ui/use-toast"
import type { DepositRequestItem } from "@/lib/services/deposit.service"

const fmtAmt = (n: number, currency: string) =>
  `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: currency === "BTC" ? 8 : 2 }).format(n)} ${currency}`

interface Props {
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
  request:   DepositRequestItem
}

export function ConfirmDepositModal({ open, onClose, onSuccess, request }: Props) {
  const isBitcoin     = request.account.walletType === "bitcoin"
  const displayCurrency = isBitcoin ? "BTC" : request.requestedCurrency

  const [amount,    setAmount]    = useState(String(request.requestedAmount))
  const [note,      setNote]      = useState("")
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState("")

  useEffect(() => {
    if (open) {
      setAmount(String(request.requestedAmount))
      setNote("")
      setError("")
    }
  }, [open, request.requestedAmount])

  const confirmedNum  = parseFloat(amount)
  const isDifferent   = !isNaN(confirmedNum) && Math.abs(confirmedNum - request.requestedAmount) > 0.0001

  const handleSubmit = async () => {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) { setError("Enter a valid positive amount"); return }
    setLoading(true)
    setError("")

    const res = await fetch(`/api/admin/deposit-requests/${request.id}/confirm`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ confirmedAmount: num, adminNote: note }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Confirmation failed")
      return
    }

    toast({ title: "Deposit confirmed & credited", variant: "success" })
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Deposit</DialogTitle>
          <DialogDescription>
            Credit {request.user.firstName} {request.user.lastName}&apos;s account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Request summary */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">User</span>
              <span className="font-medium">{request.user.firstName} {request.user.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Method</span>
              <span className="font-medium">{request.paymentMethod.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Requested</span>
              <span className="font-medium">{fmtAmt(request.requestedAmount, displayCurrency)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cd-amount">
              Confirmed amount ({displayCurrency})
            </Label>
            <Input
              id="cd-amount"
              type="number"
              step={isBitcoin ? "0.00000001" : "0.01"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {isDifferent && (
              <p className="text-xs text-amber-600">
                Note: you are crediting a different amount than requested ({fmtAmt(request.requestedAmount, displayCurrency)}).
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cd-note">Admin note (optional)</Label>
            <Input
              id="cd-note"
              placeholder="Internal note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? "Processing…" : "Confirm & credit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
