"use client"

import { useState } from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import type { LoanDetail } from "@/lib/services/loan.service"

interface Props {
  loan:      LoanDetail
  open:      boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })

export function RecordPaymentModal({ loan, open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast()

  const outstanding      = loan.outstandingBalance ?? loan.amount
  const suggested        = loan.monthlyPayment ?? outstanding
  const accountBalance   = loan.primaryAccount?.balance ?? 0

  const [amount,      setAmount]      = useState(String(Math.min(suggested, outstanding).toFixed(2)))
  const [submitting,  setSubmitting]  = useState(false)

  const parsed       = parseFloat(amount)
  const isValid      = !isNaN(parsed) && parsed > 0
  const willClose    = isValid && parsed >= outstanding
  const overBalance  = isValid && parsed > accountBalance

  async function submit() {
    if (!isValid) return
    const finalAmount = Math.min(parsed, outstanding)
    setSubmitting(true)
    try {
      const res  = await fetch(`/api/admin/loans/${loan.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentAmount: finalAmount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Payment failed")
      toast({ title: "Payment recorded", description: `$${finalAmount.toFixed(2)} recorded successfully.` })
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record loan payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Loan summary */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Loan amount</span>
              <span className="font-medium">{fmt(loan.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Outstanding balance</span>
              <span className="font-semibold text-gray-900">{fmt(outstanding)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Monthly payment</span>
              <span>{loan.monthlyPayment != null ? fmt(loan.monthlyPayment) : "—"}</span>
            </div>
            {loan.nextPaymentDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Next payment due</span>
                <span className={loan.isOverdue ? "text-red-600 font-medium" : "text-gray-700"}>
                  {new Date(loan.nextPaymentDate).toLocaleDateString()}
                  {loan.isOverdue && ` (${loan.daysOverdue}d overdue)`}
                </span>
              </div>
            )}
          </div>

          {loan.isOverdue && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              This loan is {loan.daysOverdue} day{loan.daysOverdue !== 1 ? "s" : ""} overdue.
            </div>
          )}

          {/* Amount input */}
          <div>
            <Label className="mb-1.5 block text-sm">Payment amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input
                type="number"
                className="pl-7"
                value={amount}
                min={0.01}
                step={0.01}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {willClose && (
              <p className="text-xs text-amber-600 mt-1">
                This will fully close the loan (capped at {fmt(outstanding)}).
              </p>
            )}
          </div>

          {/* Balance impact */}
          {loan.primaryAccount && isValid && (
            <div className={[
              "rounded-lg p-3 text-xs",
              overBalance ? "bg-red-50 border border-red-200" : "bg-indigo-50 border border-indigo-100",
            ].join(" ")}>
              <p className="font-medium mb-1 text-gray-700">Balance impact</p>
              <p>
                <span className="text-gray-500">Account balance: </span>
                <span>{fmt(accountBalance)}</span>
                <span className="text-gray-400 mx-1">→</span>
                <span className={overBalance ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}>
                  {fmt(accountBalance - Math.min(parsed, outstanding))}
                </span>
              </p>
              {overBalance && (
                <p className="text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Insufficient account balance for this payment.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={submit}
              disabled={!isValid || overBalance || submitting}
              className="bg-[#1A2CCE] hover:bg-[#1A2CCE]/90"
            >
              {submitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Recording…</> : "Record payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
