"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from "lucide-react"
import { Sheet, SheetHeader, SheetTitle, SheetClose, SheetBody } from "@/components/ui/sheet"
import { Button }   from "@/components/ui/button"
import { Badge }    from "@/components/ui/badge"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast }    from "@/components/ui/use-toast"
import { ProofModal } from "@/components/admin/deposits/ProofModal"
import type { DepositRequestDetail } from "@/lib/services/deposit.service"

const fmt = (n: number, currency: string) =>
  `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: currency === "BTC" ? 8 : 2,
  }).format(n)} ${currency}`

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—"

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Confirmed</Badge>
  if (status === "rejected")  return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 flex-shrink-0 w-36">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
    </div>
  )
}

interface Props {
  requestId: string | null
  onClose:   () => void
  onAction:  () => void
}

export function DepositDetailDrawer({ requestId, onClose, onAction }: Props) {
  const open = requestId !== null

  const [detail,       setDetail]       = useState<DepositRequestDetail | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [proofOpen,    setProofOpen]    = useState(false)
  const [actionResult, setActionResult] = useState<"confirmed" | "rejected" | null>(null)

  // Confirm inline form
  const [confirmAmount, setConfirmAmount] = useState("")
  const [confirmNote,   setConfirmNote]   = useState("")
  const [confirmErr,    setConfirmErr]    = useState("")
  const [submitting,    setSubmitting]    = useState(false)

  // Reject inline form
  const [rejectReason, setRejectReason] = useState("")
  const [rejectErr,    setRejectErr]    = useState("")

  const [activeForm, setActiveForm] = useState<"confirm" | "reject" | null>(null)

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/deposit-requests/${id}`)
      const data = await res.json()
      if (res.ok) {
        setDetail(data.request)
        setConfirmAmount(String(data.request.requestedAmount))
      } else {
        toast({ title: data.error ?? "Failed to load request", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (requestId) {
      setDetail(null)
      setActionResult(null)
      setActiveForm(null)
      setConfirmErr("")
      setRejectErr("")
      setConfirmNote("")
      setRejectReason("")
      fetchDetail(requestId)
    }
  }, [requestId, fetchDetail])

  const handleConfirm = async () => {
    const num = parseFloat(confirmAmount)
    if (isNaN(num) || num <= 0) { setConfirmErr("Enter a valid positive amount"); return }
    setConfirmErr("")
    setSubmitting(true)
    const res = await fetch(`/api/admin/deposit-requests/${requestId}/confirm`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ confirmedAmount: num, adminNote: confirmNote }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setConfirmErr(data.error ?? "Confirmation failed")
      return
    }
    toast({ title: "Deposit confirmed & credited", variant: "success" })
    setActionResult("confirmed")
    onAction()
    setTimeout(onClose, 1500)
  }

  const handleReject = async () => {
    if (rejectReason.trim().length < 10) { setRejectErr("Provide at least 10 characters"); return }
    setRejectErr("")
    setSubmitting(true)
    const res = await fetch(`/api/admin/deposit-requests/${requestId}/reject`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ adminNote: rejectReason.trim() }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setRejectErr(data.error ?? "Rejection failed")
      return
    }
    toast({ title: "Deposit request rejected", variant: "success" })
    setActionResult("rejected")
    onAction()
    setTimeout(onClose, 1500)
  }

  const displayCurrency = detail?.account.walletType === "bitcoin"
    ? "BTC"
    : (detail?.requestedCurrency ?? "USD")

  return (
    <>
      <Sheet open={open} onClose={onClose} width="560px">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <SheetTitle>Deposit Request</SheetTitle>
            {detail && <StatusBadge status={detail.status} />}
          </div>
          <div className="flex items-center gap-2">
            {detail && (
              <button
                onClick={() => fetchDetail(detail.id)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <SheetClose onClose={onClose} />
          </div>
        </SheetHeader>

        <SheetBody className="space-y-6">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading…
            </div>
          )}

          {/* Action result banner */}
          {actionResult && (
            <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
              actionResult === "confirmed"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {actionResult === "confirmed"
                ? <><CheckCircle className="h-4 w-4" /> Deposit confirmed and credited</>
                : <><XCircle    className="h-4 w-4" /> Deposit request rejected</>
              }
            </div>
          )}

          {detail && !loading && (
            <>
              {/* User */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">User</h3>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 divide-y divide-slate-100">
                  <Row label="Name"    value={`${detail.user.firstName} ${detail.user.lastName}`} />
                  <Row label="Email"   value={detail.user.email} />
                  <Row label="Account" value={detail.account.accountNumber} />
                  <Row label="Balance" value={
                    detail.account.walletType === "bitcoin"
                      ? fmt(detail.account.btcBalance, "BTC")
                      : fmt(detail.account.balance, detail.account.currency)
                  } />
                </div>
              </section>

              {/* Deposit details */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Deposit Details</h3>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 divide-y divide-slate-100">
                  <Row label="Requested"      value={fmt(detail.requestedAmount, displayCurrency)} />
                  {detail.confirmedAmount != null && (
                    <Row label="Confirmed"    value={fmt(detail.confirmedAmount, displayCurrency)} />
                  )}
                  <Row label="Payment method" value={detail.paymentMethod.name} />
                  <Row label="Submitted"      value={fmtDate(detail.createdAt)} />
                  {detail.reviewedAt && (
                    <Row label="Reviewed"     value={fmtDate(detail.reviewedAt)} />
                  )}
                  {detail.txReference && (
                    <Row label="Tx reference" value={<code className="text-xs bg-slate-100 px-1 rounded">{detail.txReference}</code>} />
                  )}
                  {detail.notes && (
                    <Row label="User notes"   value={detail.notes} />
                  )}
                </div>
              </section>

              {/* Proof */}
              {detail.proofUrl && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Proof of Payment</h3>
                  <div
                    className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-900 cursor-pointer"
                    style={{ height: 160 }}
                    onClick={() => setProofOpen(true)}
                  >
                    {detail.proofUrl.toLowerCase().includes(".pdf") ? (
                      <div className="flex h-full items-center justify-center gap-2 text-slate-400 text-sm">
                        <span className="font-bold text-white">PDF</span>
                        <span>Click to view</span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={detail.proofUrl}
                        alt="Proof of payment"
                        className="h-full w-full object-contain"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                      <ExternalLink className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <button
                    onClick={() => setProofOpen(true)}
                    className="mt-1.5 text-xs text-[#1A2CCE] hover:underline"
                  >
                    View full size
                  </button>
                </section>
              )}

              {/* Review history */}
              {(detail.reviewedBy || detail.adminNote) && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Review History</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 divide-y divide-slate-100">
                    {detail.reviewedBy && (
                      <Row label="Reviewed by" value={`${detail.reviewedBy.firstName} ${detail.reviewedBy.lastName}`} />
                    )}
                    {detail.adminNote && (
                      <Row label="Admin note"  value={detail.adminNote} />
                    )}
                  </div>
                </section>
              )}

              {/* Credited transaction */}
              {detail.creditedTransaction && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Credited Transaction</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 divide-y divide-slate-100">
                    <Row label="Reference" value={<code className="text-xs bg-slate-100 px-1 rounded">{detail.creditedTransaction.reference}</code>} />
                    <Row label="Amount"    value={fmt(detail.creditedTransaction.amount, detail.creditedTransaction.currency)} />
                    <Row label="Status"    value={detail.creditedTransaction.status} />
                    <Row label="Date"      value={fmtDate(detail.creditedTransaction.createdAt)} />
                  </div>
                </section>
              )}

              {/* Inline actions — only for pending */}
              {detail.status === "pending" && !actionResult && (
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</h3>

                  {activeForm === null && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setActiveForm("confirm")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" /> Confirm
                      </Button>
                      <Button
                        onClick={() => setActiveForm("reject")}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  )}

                  {activeForm === "confirm" && (
                    <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-medium text-emerald-800">Confirm & credit deposit</p>
                      <div className="space-y-1.5">
                        <Label htmlFor="dd-amount">Amount ({displayCurrency})</Label>
                        <Input
                          id="dd-amount"
                          type="number"
                          step={detail.account.walletType === "bitcoin" ? "0.00000001" : "0.01"}
                          value={confirmAmount}
                          onChange={(e) => setConfirmAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dd-note">Admin note (optional)</Label>
                        <Input
                          id="dd-note"
                          placeholder="Internal note…"
                          value={confirmNote}
                          onChange={(e) => setConfirmNote(e.target.value)}
                        />
                      </div>
                      {confirmErr && <p className="text-sm text-red-600">{confirmErr}</p>}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleConfirm}
                          disabled={submitting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {submitting ? "Processing…" : "Confirm & credit"}
                        </Button>
                        <Button variant="outline" onClick={() => { setActiveForm(null); setConfirmErr("") }} disabled={submitting}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeForm === "reject" && (
                    <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-medium text-red-800">Reject deposit request</p>
                      <div className="space-y-1.5">
                        <Label htmlFor="dd-reason">Reason <span className="text-red-500">*</span></Label>
                        <Textarea
                          id="dd-reason"
                          rows={3}
                          placeholder="Explain why this deposit is being rejected…"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <p className="text-xs text-slate-400">{rejectReason.length}/500 — min 10 characters</p>
                      </div>
                      {rejectErr && <p className="text-sm text-red-600">{rejectErr}</p>}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleReject}
                          disabled={submitting || rejectReason.trim().length < 10}
                          className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
                        >
                          {submitting ? "Rejecting…" : "Reject request"}
                        </Button>
                        <Button variant="outline" onClick={() => { setActiveForm(null); setRejectErr("") }} disabled={submitting}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </SheetBody>
      </Sheet>

      {proofOpen && detail?.proofUrl && (
        <ProofModal proofUrl={detail.proofUrl} onClose={() => setProofOpen(false)} />
      )}
    </>
  )
}
