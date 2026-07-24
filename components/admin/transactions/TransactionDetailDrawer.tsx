"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Sheet, SheetHeader, SheetTitle, SheetClose, SheetBody } from "@/components/ui/sheet"
import { StatusBadge }  from "@/components/admin/StatusBadge"
import { Button }       from "@/components/ui/button"
import { Label }        from "@/components/ui/label"
import { Input }        from "@/components/ui/input"
import { Select, SelectItem } from "@/components/ui/select"
import { Textarea }     from "@/components/ui/textarea"
import { toast }        from "@/components/ui/use-toast"
import { ReverseTransactionModal }  from "@/components/admin/transactions/modals/ReverseTransactionModal"
import { TYPE_LABELS }  from "@/components/admin/transactions/TransactionTypeFilter"
import type { TransactionDetail } from "@/lib/services/transaction.service"

const CREDIT_TYPES = new Set([
  "deposit", "admin_deposit", "transfer_in", "swap_in", "refund", "loan_disbursement",
])
const NON_REVERSIBLE = new Set(["fee", "loan_repayment"])

function fmtDate(s?: string) {
  if (!s) return "—"
  return new Date(s).toLocaleString("en-US", {
    dateStyle: "medium", timeStyle: "medium",
  })
}

function fmtAmt(n: number, currency: string) {
  // Amount is already in human-readable format from the API
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "BTC" ? 8 : 2,
    maximumFractionDigits: currency === "BTC" ? 8 : 2,
  }).format(n)} ${currency}`
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 flex-shrink-0 w-40">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right break-all">{value ?? "—"}</span>
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const COLORS: Record<string, string> = {
    admin_deposit:    "bg-indigo-100 text-indigo-700 border-indigo-200",
    deposit:          "bg-emerald-100 text-emerald-700 border-emerald-200",
    withdrawal:       "bg-amber-100 text-amber-700 border-amber-200",
    transfer_out:     "bg-orange-100 text-orange-700 border-orange-200",
    transfer_in:      "bg-teal-100 text-teal-700 border-teal-200",
    swap_in:          "bg-purple-100 text-purple-700 border-purple-200",
    swap_out:         "bg-purple-50 text-purple-600 border-purple-100",
    fee:              "bg-slate-100 text-slate-600 border-slate-200",
    refund:           "bg-emerald-50 text-emerald-600 border-emerald-100",
    loan_disbursement:"bg-indigo-100 text-indigo-700 border-indigo-200",
    loan_repayment:   "bg-indigo-50 text-indigo-600 border-indigo-100",
    fx_conversion:    "bg-pink-100 text-pink-700 border-pink-200",
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${COLORS[type] ?? "bg-slate-100 text-slate-600"}`}>
      {TYPE_LABELS[type] ?? type.replace(/_/g, " ")}
    </span>
  )
}

interface Props {
  transactionId: string | null
  onClose:       () => void
  onAction:      () => void
}

export function TransactionDetailDrawer({ transactionId, onClose, onAction }: Props) {
  const open = transactionId !== null

  const [detail,       setDetail]       = useState<TransactionDetail | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [notFound,     setNotFound]     = useState(false)
  const [copied,       setCopied]       = useState(false)
  const [metaOpen,     setMetaOpen]     = useState(false)
  const [showReverse,  setShowReverse]  = useState(false)

  // Status update form
  const [statusForm,  setStatusForm]  = useState(false)
  const [newStatus,   setNewStatus]   = useState<"completed" | "failed" | "processing">("completed")
  const [adminNote,   setAdminNote]   = useState("")
  const [statusErr,   setStatusErr]   = useState("")
  const [statusSaving,setStatusSaving]= useState(false)

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true)
    setNotFound(false)
    const res  = await fetch(`/api/admin/transactions/${id}`)
    setLoading(false)
    if (res.status === 404) { setNotFound(true); return }
    if (!res.ok) { toast({ title: "Failed to load transaction", variant: "destructive" }); return }
    const data = await res.json()
    setDetail(data.transaction)
  }, [])

  useEffect(() => {
    if (transactionId) {
      setDetail(null)
      setNotFound(false)
      setShowReverse(false)
      setStatusForm(false)
      setAdminNote("")
      setStatusErr("")
      setMetaOpen(false)
      fetchDetail(transactionId)
    }
  }, [transactionId, fetchDetail])

  const copyRef = async () => {
    if (!detail) return
    await navigator.clipboard.writeText(detail.reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStatusSave = async () => {
    setStatusErr("")
    setStatusSaving(true)
    const res = await fetch(`/api/admin/transactions/${transactionId}/status`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: newStatus, adminNote }),
    })
    setStatusSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setStatusErr(data.error ?? "Update failed")
      return
    }
    toast({ title: "Status updated", variant: "success" })
    setStatusForm(false)
    fetchDetail(transactionId!)
    onAction()
  }

  const isCredit    = detail ? CREDIT_TYPES.has(detail.type) : false
  const isReversible = detail
    ? detail.status === "completed" && !NON_REVERSIBLE.has(detail.type) && !detail.reversalTransaction
    : false
  const canUpdateStatus = detail
    ? detail.status === "pending" || detail.status === "processing"
    : false

  const amountColor = isCredit ? "text-emerald-600" : "text-red-600"
  const amountPrefix = isCredit ? "+" : "-"

  return (
    <>
      <Sheet open={open} onClose={onClose} width="560px">
        <SheetHeader>
          <div className="flex items-center gap-2 min-w-0">
            <SheetTitle className="truncate">Transaction Detail</SheetTitle>
            {detail && <TypeBadge type={detail.type} />}
          </div>
          <div className="flex items-center gap-1.5">
            {detail && (
              <button
                onClick={() => fetchDetail(detail.id)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            )}
            <SheetClose onClose={onClose} />
          </div>
        </SheetHeader>

        <SheetBody className="space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          )}

          {notFound && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <p className="text-sm">Transaction not found.</p>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Reference + Amount Hero */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <code className={`font-mono text-base font-bold ${detail.status === "reversed" ? "line-through text-slate-400" : "text-slate-900"}`}>
                    {detail.reference}
                  </code>
                  {detail.reference.startsWith("REV-") && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 uppercase">
                      Reversal
                    </span>
                  )}
                  <button onClick={copyRef} className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-200">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <div className={`text-2xl font-bold ${amountColor}`}>
                  {amountPrefix}{fmtAmt(detail.amount, detail.currency)}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={detail.status} />
                  {detail.isGenerated && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      Simulated
                    </span>
                  )}
                </div>
              </div>

              {/* Reversal / original banners */}
              {detail.reversalTransaction && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 flex items-center justify-between">
                  <span>This transaction has been reversed.</span>
                  <button
                    onClick={() => { setDetail(null); fetchDetail(detail.reversalTransaction!.id) }}
                    className="text-xs underline flex items-center gap-1"
                  >
                    View reversal <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}
              {detail.originalTransactionId && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm text-indigo-700 flex items-center justify-between">
                  <span>This is a reversal transaction.</span>
                  <button
                    onClick={() => { setDetail(null); fetchDetail(detail.originalTransactionId!) }}
                    className="text-xs underline flex items-center gap-1"
                  >
                    View original <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Transaction Info */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Transaction Info</h3>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 divide-y divide-slate-100">
                  <Row label="Date & time"  value={fmtDate(detail.createdAt)} />
                  <Row label="Processed at" value={fmtDate(detail.processedAt)} />
                  <Row label="Currency"     value={detail.currency} />
                  <Row label="Amount"       value={fmtAmt(detail.amount, detail.currency)} />
                  {detail.feeAmount != null && detail.feeAmount > 0 && (
                    <Row label="Fee"        value={fmtAmt(detail.feeAmount, detail.currency)} />
                  )}
                  {detail.feePercent != null && (
                    <Row label="Fee %"      value={`${detail.feePercent}%`} />
                  )}
                  {detail.exchangeRate != null && (
                    <Row label="Exchange rate"     value={detail.exchangeRate.toFixed(6)} />
                  )}
                  {detail.convertedAmount != null && detail.convertedCurrency && (
                    <Row label="Converted amount"  value={fmtAmt(detail.convertedAmount, detail.convertedCurrency)} />
                  )}
                  {detail.btcRateAtTime != null && (
                    <Row label="BTC rate at time"  value={`$${detail.btcRateAtTime.toLocaleString()}`} />
                  )}
                  {detail.transferType && (
                    <Row label="Transfer type" value={detail.transferType.replace(/_/g, " ")} />
                  )}
                  {detail.swapFromWallet && (
                    <Row label="Swap from" value={detail.swapFromWallet} />
                  )}
                  {detail.swapToWallet && (
                    <Row label="Swap to"   value={detail.swapToWallet} />
                  )}
                  {detail.description && (
                    <Row label="Description" value={detail.description} />
                  )}
                  <Row label="Generated"  value={detail.isGenerated ? "Yes (simulated)" : "No"} />
                </div>
              </section>

              {/* User & Account */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Parties</h3>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 divide-y divide-slate-100">
                  <Row
                    label="User"
                    value={
                      detail.user ? (
                        <a
                          href={`/admin/users/${detail.user.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#1A2CCE] hover:underline"
                        >
                          {detail.user.firstName} {detail.user.lastName}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : "System"
                    }
                  />
                  {detail.user && (
                    <Row label="Email" value={detail.user.email} />
                  )}
                  <Row label="Account"        value={<code className="text-xs">{detail.account.accountNumber}</code>} />
                  <Row label="Account type"   value={`${detail.account.walletType} (${detail.account.currency})`} />
                  <Row label="Current balance" value={
                    detail.account.walletType === "bitcoin"
                      ? fmtAmt(detail.account.btcBalance, "BTC")
                      : fmtAmt(detail.account.balance, detail.account.currency)
                  } />
                  {detail.toAccount && (
                    <Row label="To account"   value={<code className="text-xs">{detail.toAccount.accountNumber}</code>} />
                  )}
                  {detail.fromAccount && (
                    <Row label="From account" value={<code className="text-xs">{detail.fromAccount.accountNumber}</code>} />
                  )}
                </div>
              </section>

              {/* External recipient */}
              {detail.externalRecipientFull && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">External Recipient</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 divide-y divide-slate-100">
                    {detail.externalRecipientFull.name           && <Row label="Name"           value={detail.externalRecipientFull.name} />}
                    {detail.externalRecipientFull.accountNumber  && <Row label="Account number" value={detail.externalRecipientFull.accountNumber} />}
                    {detail.externalRecipientFull.routingNumber  && <Row label="Routing number" value={detail.externalRecipientFull.routingNumber} />}
                    {detail.externalRecipientFull.bankName       && <Row label="Bank"           value={detail.externalRecipientFull.bankName} />}
                    {detail.externalRecipientFull.swiftCode      && <Row label="SWIFT"          value={detail.externalRecipientFull.swiftCode} />}
                    {detail.externalRecipientFull.iban           && <Row label="IBAN"           value={detail.externalRecipientFull.iban} />}
                    {detail.externalRecipientFull.country        && <Row label="Country"        value={detail.externalRecipientFull.country} />}
                  </div>
                </section>
              )}

              {/* Metadata */}
              {detail.metadata && Object.keys(detail.metadata).length > 0 && (
                <section>
                  <button
                    onClick={() => setMetaOpen((o) => !o)}
                    className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2"
                  >
                    Raw Metadata
                    {metaOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {metaOpen && (
                    <pre className="rounded-lg border border-slate-200 bg-slate-900 p-3 text-[11px] text-slate-200 font-mono overflow-x-auto">
                      {JSON.stringify(detail.metadata, null, 2)}
                    </pre>
                  )}
                </section>
              )}

              {/* Actions */}
              {(isReversible || canUpdateStatus) && (
                <section className="border-t border-slate-100 pt-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</h3>

                  {isReversible && !statusForm && (
                    <Button
                      onClick={() => setShowReverse(true)}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 w-full"
                    >
                      Reverse this transaction
                    </Button>
                  )}

                  {canUpdateStatus && !showReverse && (
                    <div>
                      {!statusForm ? (
                        <Button
                          variant="outline"
                          onClick={() => setStatusForm(true)}
                          className="w-full"
                        >
                          Update status
                        </Button>
                      ) : (
                        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="space-y-1.5">
                            <Label>New status</Label>
                            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as typeof newStatus)}>
                              {detail.status === "pending" && (
                                <SelectItem value="processing">Processing</SelectItem>
                              )}
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="status-note">Admin note</Label>
                            <Input
                              id="status-note"
                              placeholder="Reason for this status change…"
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                            />
                          </div>
                          {statusErr && <p className="text-sm text-red-600">{statusErr}</p>}
                          <div className="flex gap-2">
                            <Button
                              onClick={handleStatusSave}
                              disabled={statusSaving}
                              className="bg-[#1A2CCE] hover:bg-[#1A2CCE]/90 text-white"
                            >
                              {statusSaving ? "Saving…" : "Save"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => { setStatusForm(false); setStatusErr("") }}
                              disabled={statusSaving}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {detail.status === "reversed" && !detail.originalTransactionId && (
                <p className="text-sm text-slate-400 text-center py-2">
                  This transaction has been reversed. No further actions available.
                </p>
              )}
            </>
          )}
        </SheetBody>
      </Sheet>

      {showReverse && detail && (
        <ReverseTransactionModal
          open={showReverse}
          onClose={() => setShowReverse(false)}
          onSuccess={() => {
            setShowReverse(false)
            fetchDetail(transactionId!)
            onAction()
          }}
          transaction={detail}
        />
      )}
    </>
  )
}
