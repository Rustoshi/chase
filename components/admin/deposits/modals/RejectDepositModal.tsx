"use client"

import { useState, useEffect }  from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Label }    from "@/components/ui/label"
import { Button }   from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast }    from "@/components/ui/use-toast"
import type { DepositRequestItem } from "@/lib/services/deposit.service"

interface Props {
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
  request:   DepositRequestItem
}

export function RejectDepositModal({ open, onClose, onSuccess, request }: Props) {
  const [reason,  setReason]  = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  useEffect(() => {
    if (open) { setReason(""); setError("") }
  }, [open])

  const handleSubmit = async () => {
    if (reason.trim().length < 10) { setError("Please provide a reason of at least 10 characters"); return }
    setLoading(true)
    setError("")

    const res = await fetch(`/api/admin/deposit-requests/${request.id}/reject`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ adminNote: reason.trim() }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Rejection failed")
      return
    }

    toast({ title: "Deposit request rejected", variant: "success" })
    onSuccess()
    onClose()
  }

  const fmtAmt = new Intl.NumberFormat("en-US", { style: "currency", currency: request.requestedCurrency === "BTC" ? "USD" : request.requestedCurrency }).format(request.requestedAmount)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Deposit Request</DialogTitle>
          <DialogDescription>
            Reject this request from {request.user.firstName} {request.user.lastName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Summary */}
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
              <span className="text-slate-500">Amount</span>
              <span className="font-medium">{fmtAmt} {request.requestedCurrency}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rd-reason">Reason for rejection <span className="text-red-500">*</span></Label>
            <Textarea
              id="rd-reason"
              placeholder="Explain why this deposit is being rejected…"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-slate-400">{reason.length}/500 — minimum 10 characters</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || reason.trim().length < 10}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
          >
            {loading ? "Rejecting…" : "Reject request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
