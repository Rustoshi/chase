"use client"

import { useState, useEffect } from "react"
import { useForm }        from "react-hook-form"
import { zodResolver }    from "@hookform/resolvers/zod"
import { z }              from "zod"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input }          from "@/components/ui/input"
import { Label }          from "@/components/ui/label"
import { Button }         from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"
import { Checkbox }       from "@/components/ui/checkbox"
import { toast }          from "@/components/ui/use-toast"
import { cn }             from "@/lib/utils"
import type { AccountData, UserDetail } from "@/lib/services/user.service"

const Schema = z.object({
  accountId:   z.string().min(1, "Select an account"),
  amount:      z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required").max(500),
})

type FormValues = z.infer<typeof Schema>

interface Props {
  open:          boolean
  onClose:       () => void
  onSuccess:     () => void
  user:          UserDetail
  preselect?:    string   // accountId to pre-select
}

function fmtBalance(account: AccountData): string {
  if (account.walletType === "bitcoin") {
    return `${account.btcBalance.toFixed(8)} BTC`
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: account.currency }).format(account.balance)
}

function fmtAccountLabel(account: AccountData): string {
  if (account.walletType === "bitcoin") return `Bitcoin wallet (${account.btcAddress?.slice(0, 10)}…)`
  return `${account.currency} — ${account.accountNumber}`
}

export function AdjustBalanceModal({ open, onClose, onSuccess, user, preselect }: Props) {
  const [confirmed, setConfirmed] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(Schema),
      defaultValues: { accountId: preselect ?? "", amount: "", description: "" },
    })

  useEffect(() => {
    if (open) {
      setValue("accountId", preselect ?? user.accounts[0]?.id ?? "")
      setValue("amount", "")
      setValue("description", "")
      setConfirmed(false)
    }
  }, [open, preselect, user.accounts, setValue])

  const watchAccountId = watch("accountId")
  const watchAmount    = watch("amount")
  const selectedAccount = user.accounts.find((a) => a.id === watchAccountId)
  const isBitcoin       = selectedAccount?.walletType === "bitcoin"
  const amountNum       = parseFloat(watchAmount) || 0

  const previewNewBalance = (): string | null => {
    if (!selectedAccount || !watchAmount) return null
    if (isBitcoin) {
      const newBal = selectedAccount.btcBalance + amountNum
      return `${newBal.toFixed(8)} BTC`
    }
    const newBal = selectedAccount.balance + amountNum
    return new Intl.NumberFormat("en-US", { style: "currency", currency: selectedAccount.currency }).format(newBal)
  }

  const onSubmit = async (values: FormValues) => {
    if (!confirmed) {
      toast({ title: "Please confirm the adjustment", variant: "destructive" })
      return
    }

    const parsedAmount = parseFloat(values.amount)
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      toast({ title: "Invalid amount", variant: "destructive" })
      return
    }

    // Convert to smallest unit: cents for fiat, satoshis for BTC
    const amountInSmallestUnit = isBitcoin
      ? Math.round(parsedAmount * 1e8)
      : Math.round(parsedAmount * 100)

    const res = await fetch(`/api/admin/users/${user.id}/adjust-balance`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId:   values.accountId,
        amount:      amountInSmallestUnit,
        description: values.description,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast({ title: "Adjustment failed", description: data.error ?? "Unknown error", variant: "destructive" })
      return
    }

    toast({ title: "Balance adjusted", variant: "success" })
    onSuccess()
    onClose()
  }

  const newBalance  = previewNewBalance()
  const isDebit     = amountNum < 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Balance</DialogTitle>
          <DialogDescription>Directly credit or debit an account. Use a positive number to credit, negative to debit.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
          <div className="space-y-1.5">
            <Label>Account</Label>
            <Select value={watchAccountId} onValueChange={(v) => setValue("accountId", v)}>
              {user.accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {fmtAccountLabel(a)} — {fmtBalance(a)}
                </SelectItem>
              ))}
            </Select>
            {errors.accountId && <p className="text-xs text-red-500">{errors.accountId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adj-amount">
              Amount {isBitcoin ? "(BTC)" : `(${selectedAccount?.currency ?? "USD"})`}
            </Label>
            <Input
              id="adj-amount"
              type="number"
              step={isBitcoin ? "0.00000001" : "0.01"}
              placeholder={isBitcoin ? "e.g. 0.005 or -0.001" : "e.g. 100.00 or -25.50"}
              {...register("amount")}
            />
            {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adj-desc">Description</Label>
            <Input id="adj-desc" placeholder="Reason for adjustment…" {...register("description")} />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          {/* Preview */}
          {selectedAccount && watchAmount && (
            <div className={cn(
              "rounded-lg border p-3 text-sm",
              isDebit ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
            )}>
              This will <strong>{isDebit ? "debit" : "credit"}</strong>{" "}
              <strong>{fmtAccountLabel(selectedAccount)}</strong>{" "}
              by <strong>{Math.abs(amountNum).toFixed(isBitcoin ? 8 : 2)} {isBitcoin ? "BTC" : selectedAccount.currency}</strong>.
              {newBalance && (
                <> New balance: <strong>{newBalance}</strong>.</>
              )}
            </div>
          )}

          <Checkbox
            id="adj-confirm"
            label="I confirm this balance adjustment is authorized"
            checked={confirmed}
            onCheckedChange={(v) => setConfirmed(!!v)}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !confirmed}>
              {isSubmitting ? "Processing…" : "Apply adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
