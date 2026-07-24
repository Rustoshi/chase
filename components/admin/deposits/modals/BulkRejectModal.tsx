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
  requests:  DepositRequestItem[]
}

export function BulkRejectModal({ open, onClose, onSuccess, requests }: Props) {
  const [reason,   setReason]   = useState("")
  const [progress, setProgress] = useState<number | null>(null)
  const [error,    setError]    = useState("")

  useEffect(() => {
    if (open) { setReason(""); setProgress(null); setError("") }
  }, [open])

  const handleSubmit = async () => {
    if (reason.trim().length < 10) { setError("Provide a reason of at least 10 characters"); return }
    setError("")
    setProgress(0)

    let failed = 0
    for (let i = 0; i < requests.length; i++) {
      setProgress(i + 1)
      const res = await fetch(`/api/admin/deposit-requests/${requests[i].id}/reject`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ adminNote: reason.trim() }),
      })
      if (!res.ok) failed++
    }

    setProgress(null)

    if (failed > 0) {
      toast({
        title:       `Bulk reject: ${requests.length - failed} succeeded, ${failed} failed`,
        variant:     "destructive",
      })
    } else {
      toast({ title: `${requests.length} deposit requests rejected`, variant: "success" })
    }

    onSuccess()
    onClose()
  }

  const shown    = requests.slice(0, 5)
  const overflow = requests.length - shown.length

  const fmtAmt = (r: DepositRequestItem) =>
    `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(r.requestedAmount)} ${r.requestedCurrency}`

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Reject {requests.length} Requests</DialogTitle>
          <DialogDescription>
            A single rejection reason will be applied to all selected requests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Request list */}
          <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 text-sm">
            {shown.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-slate-700">{r.user.firstName} {r.user.lastName}</span>
                <span className="font-medium">{fmtAmt(r)}</span>
              </div>
            ))}
            {overflow > 0 && (
              <div className="px-3 py-2 text-xs text-slate-400">+ {overflow} more</div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="br-reason">Shared rejection reason <span className="text-red-500">*</span></Label>
            <Textarea
              id="br-reason"
              placeholder="Reason applied to all requests…"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Progress */}
          {progress !== null && (
            <div className="space-y-1">
              <p className="text-sm text-slate-600">
                Rejecting {progress} of {requests.length}…
              </p>
              <div className="h-1.5 w-full rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#1A2CCE] transition-all"
                  style={{ width: `${(progress / requests.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={progress !== null}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={progress !== null || reason.trim().length < 10}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
          >
            {progress !== null ? `Rejecting ${progress}/${requests.length}…` : `Reject all ${requests.length} requests`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
