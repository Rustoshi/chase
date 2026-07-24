"use client"

import { useEffect } from "react"
import { useForm }        from "react-hook-form"
import { zodResolver }    from "@hookform/resolvers/zod"
import { z }              from "zod"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { toast }          from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import { ArrowDownCircle, ArrowUpCircle, Calendar, Mail, AlertTriangle } from "lucide-react"
import type { AccountData, UserDetail } from "@/lib/services/user.service"
import {
  DASH, ModalHeader, Field, TextInput, NativeSelect, SectionCard, InfoBox,
  PrimaryButton, GhostButton, ModalFooter,
} from "./_ui"

const TRANSFER_SCOPES = [
  { value: "local_transfer", label: "Local Transfer" },
  { value: "international_transfer", label: "International Transfer" },
  { value: "check", label: "Check" },
  { value: "crypto", label: "Crypto" },
  { value: "wire_transfer", label: "Wire Transfer" },
  { value: "ach_transfer", label: "ACH Transfer" },
  { value: "internal", label: "Internal Transfer" },
] as const

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || "NovaPay"

const Schema = z.object({
  accountId:     z.string().min(1, "Select an account"),
  amount:        z.string().min(1, "Amount is required"),
  senderName:    z.string().min(1, "Sender name is required").max(200),
  senderBank:    z.string().max(200).optional(),
  receiverName:  z.string().min(1, "Receiver name is required").max(200),
  receiverBank:  z.string().max(200).optional(),
  transferScope: z.string().min(1, "Select transfer scope"),
  description:   z.string().max(500).optional(),
  transactionDate: z.string().min(1, "Date is required"),
  sendEmail:     z.boolean(),
})

type FormValues = z.infer<typeof Schema>

interface Props {
  open:          boolean
  onClose:       () => void
  onSuccess:     () => void
  user:          UserDetail
  preselect?:    string
  mode:          "credit" | "debit"
}

function fmtBalance(account: AccountData, currency: string): string {
  if (account.walletType === "bitcoin") {
    return `${account.btcBalance.toFixed(8)} BTC`
  }
  return formatCurrency(account.balance, currency)
}

function fmtAccountLabel(account: AccountData, currency: string): string {
  if (account.walletType === "bitcoin") return `Bitcoin wallet (${account.btcAddress?.slice(0, 10)}…)`
  return `${currency} — ${account.accountNumber}`
}

function getDefaultDateTime(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

export function TransactionModal({ open, onClose, onSuccess, user, preselect, mode }: Props) {
  const isCredit = mode === "credit"
  const userFullName = `${user.firstName} ${user.lastName}`
  // Display fiat amounts in the user's preferred currency (matches their portal)
  const userCurrency = user.preferredCurrency || "USD"

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(Schema),
      defaultValues: {
        accountId: preselect ?? "",
        amount: "",
        senderName: isCredit ? "" : userFullName,
        senderBank: isCredit ? "" : BANK_NAME,
        receiverName: isCredit ? userFullName : "",
        receiverBank: isCredit ? BANK_NAME : "",
        transferScope: "local_transfer",
        description: "",
        transactionDate: getDefaultDateTime(),
        sendEmail: false,
      },
    })

  useEffect(() => {
    if (open) {
      reset({
        accountId: preselect ?? (user.accounts || [])[0]?.id ?? "",
        amount: "",
        senderName: isCredit ? "" : userFullName,
        senderBank: isCredit ? "" : BANK_NAME,
        receiverName: isCredit ? userFullName : "",
        receiverBank: isCredit ? BANK_NAME : "",
        transferScope: "local_transfer",
        description: "",
        transactionDate: getDefaultDateTime(),
        sendEmail: false,
      })
    }
  }, [open, preselect, user.accounts, reset, isCredit, userFullName])

  const watchAccountId = watch("accountId")
  const watchAmount    = watch("amount")
  const watchScope     = watch("transferScope")
  const watchEmail     = watch("sendEmail")
  const accounts = user.accounts || []
  const selectedAccount = accounts.find((a) => a.id === watchAccountId)
  const isBitcoin       = selectedAccount?.walletType === "bitcoin"
  const amountNum       = parseFloat(watchAmount) || 0

  const previewNewBalance = (): string | null => {
    if (!selectedAccount || !watchAmount || amountNum <= 0) return null
    const delta = isCredit ? amountNum : -amountNum
    if (isBitcoin) {
      const newBal = selectedAccount.btcBalance + delta
      if (newBal < 0) return null
      return `${newBal.toFixed(8)} BTC`
    }
    const newBal = selectedAccount.balance + delta
    if (newBal < 0) return null
    return formatCurrency(newBal, userCurrency)
  }

  const onSubmit = async (values: FormValues) => {
    const parsedAmount = parseFloat(values.amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Amount must be a positive number", variant: "destructive" })
      return
    }

    // Convert to smallest unit: cents for fiat, satoshis for BTC
    // For debit, make it negative
    const amountInSmallestUnit = isBitcoin
      ? Math.round(parsedAmount * 1e8) * (isCredit ? 1 : -1)
      : Math.round(parsedAmount * 100) * (isCredit ? 1 : -1)

    const res = await fetch(`/api/admin/users/${user.id}/transaction`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId:       values.accountId,
        amount:          amountInSmallestUnit,
        senderName:      values.senderName,
        senderBank:      values.senderBank || "",
        receiverName:    values.receiverName,
        receiverBank:    values.receiverBank || "",
        transferScope:   values.transferScope,
        description:     values.description || "",
        transactionDate: values.transactionDate,
        sendEmail:       values.sendEmail,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast({ title: "Transaction failed", description: data.error ?? "Unknown error", variant: "destructive" })
      return
    }

    toast({ title: `${isCredit ? "Credit" : "Debit"} successful`, variant: "success" })
    onSuccess()
    onClose()
  }

  const newBalance = previewNewBalance()
  const insufficientFunds = !isCredit && selectedAccount && amountNum > 0 && (
    (isBitcoin && selectedAccount.btcBalance < amountNum) ||
    (!isBitcoin && selectedAccount.balance < amountNum)
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-6 sm:p-7" style={{ fontFamily: DASH.font }}>
        <DialogTitle className="sr-only">{isCredit ? "Credit Account" : "Debit Account"}</DialogTitle>

        <ModalHeader
          icon={isCredit ? ArrowDownCircle : ArrowUpCircle}
          tone={isCredit ? "success" : "danger"}
          title={isCredit ? "Credit account" : "Debit account"}
          description={isCredit ? "Add funds to the user's account" : "Remove funds from the user's account"}
        />

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 22 }}>
          {/* Account */}
          <Field label="Account" error={errors.accountId?.message}>
            <NativeSelect
              value={watchAccountId}
              onChange={(e) => setValue("accountId", e.target.value)}
            >
              {accounts.length === 0 && <option value="">No accounts</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {fmtAccountLabel(a, userCurrency)} — {fmtBalance(a, userCurrency)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          {/* Amount */}
          <Field
            label={`Amount ${isBitcoin ? "(BTC)" : `(${userCurrency})`}`}
            htmlFor="tx-amount"
            error={errors.amount?.message}
          >
            <TextInput
              id="tx-amount"
              type="number"
              step={isBitcoin ? "0.00000001" : "0.01"}
              min="0"
              placeholder={isBitcoin ? "e.g. 0.005" : "e.g. 100.00"}
              {...register("amount")}
            />
          </Field>

          {/* Sender */}
          <SectionCard title="From (sender)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="Name" htmlFor="tx-sender-name" error={errors.senderName?.message}>
                <TextInput id="tx-sender-name" placeholder="Sender name" {...register("senderName")} />
              </Field>
              <Field label="Bank" htmlFor="tx-sender-bank" optional>
                <TextInput id="tx-sender-bank" placeholder="Bank name" {...register("senderBank")} />
              </Field>
            </div>
          </SectionCard>

          {/* Receiver */}
          <SectionCard title="To (receiver)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="Name" htmlFor="tx-receiver-name" error={errors.receiverName?.message}>
                <TextInput id="tx-receiver-name" placeholder="Receiver name" {...register("receiverName")} />
              </Field>
              <Field label="Bank" htmlFor="tx-receiver-bank" optional>
                <TextInput id="tx-receiver-bank" placeholder="Bank name" {...register("receiverBank")} />
              </Field>
            </div>
          </SectionCard>

          {/* Scope */}
          <Field label="Transfer scope" error={errors.transferScope?.message}>
            <NativeSelect value={watchScope} onChange={(e) => setValue("transferScope", e.target.value)}>
              {TRANSFER_SCOPES.map((scope) => (
                <option key={scope.value} value={scope.value}>{scope.label}</option>
              ))}
            </NativeSelect>
          </Field>

          {/* Description */}
          <Field label="Description" htmlFor="tx-desc" optional error={errors.description?.message}>
            <TextInput id="tx-desc" placeholder="Transaction description…" {...register("description")} />
          </Field>

          {/* Date */}
          <Field
            label="Date & time"
            htmlFor="tx-date"
            hint="Can be backdated if needed"
            error={errors.transactionDate?.message}
          >
            <div style={{ position: "relative" }}>
              <Calendar size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: DASH.textMuted, pointerEvents: "none" }} />
              <TextInput id="tx-date" type="datetime-local" style={{ paddingLeft: 40 }} {...register("transactionDate")} />
            </div>
          </Field>

          {/* Send email */}
          <label
            htmlFor="tx-email"
            style={{
              display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
              padding: "12px 14px", borderRadius: DASH.radiusInner,
              backgroundColor: DASH.surface2, border: `1px solid ${DASH.border}`,
            }}
          >
            <input
              id="tx-email"
              type="checkbox"
              checked={watchEmail}
              onChange={(e) => setValue("sendEmail", e.target.checked)}
              style={{ width: 18, height: 18, accentColor: DASH.primary, cursor: "pointer" }}
            />
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: DASH.text }}>
              <Mail size={15} style={{ color: DASH.textMuted }} />
              Send email notification to user
            </span>
          </label>

          {/* Preview */}
          {selectedAccount && amountNum > 0 && (
            insufficientFunds ? (
              <InfoBox tone="danger" icon={AlertTriangle} title="Insufficient funds for this debit" />
            ) : (
              <InfoBox tone={isCredit ? "success" : "warning"}>
                This will <strong>{isCredit ? "credit" : "debit"}</strong>{" "}
                <strong>{fmtAccountLabel(selectedAccount, userCurrency)}</strong>{" "}
                by <strong>{amountNum.toFixed(isBitcoin ? 8 : 2)} {isBitcoin ? "BTC" : userCurrency}</strong>.
                {newBalance && <> New balance: <strong>{newBalance}</strong>.</>}
              </InfoBox>
            )
          )}

          <ModalFooter>
            <GhostButton type="button" onClick={onClose} disabled={isSubmitting}>Cancel</GhostButton>
            <PrimaryButton
              type="submit"
              tone={isCredit ? "success" : "danger"}
              disabled={isSubmitting || !!insufficientFunds}
            >
              {isSubmitting ? "Processing…" : isCredit ? "Credit account" : "Debit account"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
