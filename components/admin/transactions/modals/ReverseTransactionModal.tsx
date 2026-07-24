"use client"

import { useState, useEffect } from "react"
import { AlertTriangle }       from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Label }    from "@/components/ui/label"
import { Button }   from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast }    from "@/components/ui/use-toast"
import type { TransactionDetail } from "@/lib/services/transaction.service"

const fmt = (n: number, currency: string) =>
  `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: currency === "BTC" ? 8 : 2,
  }).format(n)} ${currency}`

const CREDIT_TYPES = new Set([
  "deposit", "admin_deposit", "transfer_in", "swap_in", "refund", "loan_disbursement",
])

const PAIRED_TYPES = new Set(["transfer_out", "transfer_in", "swap_in", "swap_out"])

function getWarningText(type: string): string {
  if (type === "deposit" || type === "admin_deposit") {
    return "The credited amount will be deducted from the user's account balance."
  }
  if (type === "withdrawal") {
    return "The debited amount will be credited back to the user's account balance."
  }
  if (type === "transfer_out" || type === "transfer_in") {
    return "Both the debit and credit legs will be reversed. Funds will be returned to the original sender."
  }
  if (type === "swap_in" || type === "swap_out") {
    return "Both wallet balances will be restored to their pre-swap amounts."
  }
  if (type === "refund") {
    return "The refunded amount will be deducted from the account."
  }
  if (type === "loan_disbursement") {
    return "The disbursed loan amount will be deducted from the account."
  }
  return "The transaction will be reversed and the account balance will be adjusted accordingly."
}

interface Props {
  open:        boolean
  onClose:     () => void
  onSuccess:   () => void
  transaction: TransactionDetail
}

export function ReverseTransactionModal({ open, onClose, onSuccess, transaction }: Props) {
  const [reason,    setReason]    = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState("")

  useEffect(() => {
    if (open) { setReason(""); setConfirmed(false); setError("") }
  }, [open])

  const isCredit   = CREDIT_TYPES.has(transaction.type)
  const isPaired   = PAIRED_TYPES.has(transaction.type)
  const currentBal = transaction.account.walletType === "bitcoin"
    ? transaction.account.btcBalance
    : transaction.account.balance

  const afterBal = isCredit
    ? currentBal - transaction.amount
    : currentBal + transaction.amount

  const wouldGoNegative = afterBal < 0

  const handleSubmit = async () => {
    if (reason.trim().length < 10) { setError("Reason must be at least 10 characters"); return }
    if (!confirmed) { setError("Please check the confirmation box"); return }
    setError("")
    setLoading(true)

    const res = await fetch(`/api/admin/transactions/${transaction.id}/reverse`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reason: reason.trim() }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Reversal failed")
      return
    }

    toast({ title: `Transaction ${transaction.reference} reversed`, variant: "success" })
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reverse Transaction</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The account balance will be adjusted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-2">
          {/* Summary */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Reference</span>
              <code className="font-mono text-xs bg-white border border-slate-200 px-1.5 rounded">
                {transaction.reference}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="font-medium capitalize">{transaction.type.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-medium">{fmt(transaction.amount, transaction.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">User</span>
              <span className="font-medium">
                {transaction.user
                  ? `${transaction.user.firstName} ${transaction.user.lastName}`
                  : "System"
                }
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className={`rounded-lg border p-3 text-sm ${
            wouldGoNegative
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}>
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{getWarningText(transaction.type)}</p>
                {isPaired && (
                  <p className="font-medium">This will also reverse the paired transaction.</p>
                )}
              </div>
            </div>
          </div>

          {/* Balance impact */}
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <p className="text-slate-500 mb-1.5 font-medium">Balance Impact</p>
            <div className="flex items-center gap-2 text-slate-700">
              <span>{fmt(currentBal, transaction.currency)}</span>
              <span className="text-slate-400">→</span>
              <span className={wouldGoNegative ? "font-bold text-red-600" : "font-bold"}>
                {fmt(Math.max(afterBal, 0), transaction.currency)}
              </span>
              {wouldGoNegative && (
                <span className="text-xs text-red-600">(insufficient balance)</span>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="rev-reason">
              Reason for reversal <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rev-reason"
              rows={3}
              placeholder="Describe why this transaction is being reversed…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-slate-400">{reason.length}/500 — minimum 10 characters</p>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">
              I understand this action cannot be undone and will permanently alter account balances.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !confirmed || reason.trim().length < 10 || wouldGoNegative}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
          >
            {loading ? "Reversing…" : "Reverse transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
