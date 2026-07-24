"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, ChevronRight, ChevronLeft, Check } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label }   from "@/components/ui/label"
import { Input }   from "@/components/ui/input"
import { Button }  from "@/components/ui/button"
import { toast }   from "@/components/ui/use-toast"

interface UserSearchResult {
  id:        string
  firstName: string
  lastName:  string
  email:     string
  accounts:  AccountOption[]
}

interface AccountOption {
  id:            string
  accountNumber: string
  currency:      string
  walletType:    string
  balance:       number
  btcBalance:    number
}

const TX_TYPES = [
  {
    value: "admin_deposit" as const,
    label: "Admin Deposit",
    hint:  "Credits the user's account balance",
    color: "text-emerald-700",
  },
  {
    value: "withdrawal" as const,
    label: "Withdrawal",
    hint:  "Debits the user's account (e.g. reversing an overpayment)",
    color: "text-amber-700",
  },
  {
    value: "fee" as const,
    label: "Fee",
    hint:  "Deducts a platform fee from the account",
    color: "text-slate-600",
  },
  {
    value: "refund" as const,
    label: "Refund",
    hint:  "Credits a refund to the account",
    color: "text-indigo-700",
  },
] as const

type TxType = typeof TX_TYPES[number]["value"]

function fmt(n: number, currency: string, decimals = 2) {
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)} ${currency}`
}

interface Props {
  open:                boolean
  onClose:             () => void
  onSuccess:           () => void
  prefilledAccountId?: string
  prefilledUserId?:    string
}

export function CreateTransactionModal({
  open, onClose, onSuccess, prefilledAccountId, prefilledUserId,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(prefilledAccountId ? 2 : 1)

  // Step 1
  const [search,      setSearch]      = useState("")
  const [searching,   setSearching]   = useState(false)
  const [userResults, setUserResults] = useState<UserSearchResult[]>([])
  const [selUser,     setSelUser]     = useState<UserSearchResult | null>(null)
  const [selAccount,  setSelAccount]  = useState<AccountOption | null>(null)

  // Step 2
  const [txType,       setTxType]       = useState<TxType>("admin_deposit")
  const [amount,       setAmount]       = useState("")
  const [description,  setDescription]  = useState("")
  const [customRef,    setCustomRef]    = useState(false)
  const [reference,    setReference]    = useState("")
  const [step2Err,     setStep2Err]     = useState("")

  // Step 3
  const [submitting,   setSubmitting]   = useState(false)
  const [submitErr,    setSubmitErr]    = useState("")

  useEffect(() => {
    if (open) {
      setStep(prefilledAccountId ? 2 : 1)
      setSearch(""); setUserResults([]); setSelUser(null); setSelAccount(null)
      setTxType("admin_deposit"); setAmount(""); setDescription("")
      setCustomRef(false); setReference(""); setStep2Err(""); setSubmitErr("")
    }
  }, [open, prefilledAccountId])

  // Debounced user search
  useEffect(() => {
    if (search.trim().length < 2) { setUserResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const res  = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&limit=8`)
      const data = await res.json().catch(() => ({}))
      setSearching(false)
      if (res.ok && Array.isArray(data.users)) {
        setUserResults(
          data.users.map((u: Record<string, unknown>) => ({
            id:        String(u._id ?? u.id ?? ""),
            firstName: String(u.firstName ?? ""),
            lastName:  String(u.lastName  ?? ""),
            email:     String(u.email     ?? ""),
            accounts:  [],
          }))
        )
      }
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const selectUser = useCallback(async (user: UserSearchResult) => {
    setSelUser(user)
    // Fetch their accounts
    const res  = await fetch(`/api/admin/users/${user.id}`)
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.accounts) {
      const accs = (data.accounts ?? []) as Record<string, unknown>[]
      const mapped: AccountOption[] = accs.map((a) => ({
        id:            String(a.id ?? a._id ?? ""),
        accountNumber: String(a.accountNumber ?? ""),
        currency:      String(a.currency      ?? "USD"),
        walletType:    String(a.walletType     ?? "fiat"),
        balance:       Number(a.balance    ?? 0),
        btcBalance:    Number(a.btcBalance ?? 0),
      }))
      setSelUser((u) => u ? { ...u, accounts: mapped } : u)
    }
  }, [])

  const proceedToStep2 = () => {
    if (!selAccount) return
    setStep(2)
  }

  const validateStep2 = (): boolean => {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) { setStep2Err("Enter a valid positive amount"); return false }
    if (!description.trim())     { setStep2Err("Description is required"); return false }
    if (customRef && !reference.trim()) { setStep2Err("Enter a reference or disable custom reference"); return false }
    setStep2Err("")
    return true
  }

  const handleSubmit = async () => {
    if (!validateStep2()) { setStep(2); return }
    setSubmitting(true)
    setSubmitErr("")

    const accountId = prefilledAccountId || selAccount?.id
    const currency  = selAccount?.currency ?? "USD"

    const res = await fetch("/api/admin/transactions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        type:        txType,
        amount:      parseFloat(amount),
        currency,
        description: description.trim(),
        reference:   customRef && reference.trim() ? reference.trim() : undefined,
      }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setSubmitErr(data.error ?? "Failed to create transaction")
      setStep(3)
      return
    }

    toast({ title: "Transaction created successfully", variant: "success" })
    onSuccess()
    onClose()
  }

  const isBTC      = selAccount?.walletType === "bitcoin"
  const amountNum  = parseFloat(amount) || 0
  const isDebit    = txType === "withdrawal" || txType === "fee"
  const curBalance = isBTC ? (selAccount?.btcBalance ?? 0) : (selAccount?.balance ?? 0)
  const afterBal   = isDebit ? curBalance - amountNum : curBalance + amountNum
  const currency   = selAccount?.currency ?? "USD"

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
        </DialogHeader>

        {/* Progress indicators */}
        <div className="flex items-center gap-2 px-6 -mt-1">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold
                ${step === s ? "bg-[#1A2CCE] text-white" : step > s ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                {step > s ? <Check className="h-3 w-3" /> : s}
              </div>
              <span className={`text-xs ${step === s ? "text-slate-700" : "text-slate-400"}`}>
                {s === 1 ? "Select account" : s === 2 ? "Details" : "Confirm"}
              </span>
              {s < 3 && <div className="h-px w-6 bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="px-6 pb-2 space-y-4">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search users by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {searching && (
                <p className="text-sm text-slate-400 text-center py-4">Searching…</p>
              )}

              {!searching && userResults.length === 0 && search.length >= 2 && (
                <p className="text-sm text-slate-400 text-center py-4">No users found</p>
              )}

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {userResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors
                      ${selUser?.id === u.id
                        ? "border-[#1A2CCE] bg-[#1A2CCE]/5"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <p className="font-medium text-slate-800">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </button>
                ))}
              </div>

              {selUser && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Select Account
                  </p>
                  {selUser.accounts.length === 0 && (
                    <p className="text-sm text-slate-400">Loading accounts…</p>
                  )}
                  {selUser.accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelAccount(a)}
                      className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors
                        ${selAccount?.id === a.id
                          ? "border-[#1A2CCE] bg-[#1A2CCE]/5"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-slate-600">{a.accountNumber}</span>
                        <span className="text-xs text-slate-400 uppercase">{a.walletType}</span>
                      </div>
                      <p className="font-medium text-slate-800 mt-0.5">
                        {a.walletType === "bitcoin"
                          ? `${a.btcBalance.toFixed(8)} BTC`
                          : `${a.balance.toFixed(2)} ${a.currency}`
                        }
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              {/* Account summary */}
              {selAccount && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account</span>
                    <code className="text-xs">{selAccount.accountNumber}</code>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500">Balance</span>
                    <span className="font-medium">
                      {isBTC
                        ? `${selAccount.btcBalance.toFixed(8)} BTC`
                        : `${selAccount.balance.toFixed(2)} ${selAccount.currency}`
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Type selector */}
              <div>
                <Label className="mb-2 block">Transaction type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TX_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTxType(t.value)}
                      className={`rounded-lg border p-2.5 text-left transition-colors
                        ${txType === t.value
                          ? "border-[#1A2CCE] bg-[#1A2CCE]/5"
                          : "border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <p className={`text-sm font-semibold ${t.color}`}>{t.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-tight">{t.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="ct-amount">
                  Amount ({isBTC ? "BTC" : currency})
                </Label>
                <Input
                  id="ct-amount"
                  type="number"
                  step={isBTC ? "0.00000001" : "0.01"}
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
                {/* Balance preview */}
                {amountNum > 0 && selAccount && (
                  <p className={`text-xs ${afterBal < 0 ? "text-red-600" : "text-slate-500"}`}>
                    After: {isBTC
                      ? `${afterBal.toFixed(8)} BTC`
                      : `${afterBal.toFixed(2)} ${currency}`
                    }
                    {afterBal < 0 && " — INSUFFICIENT BALANCE"}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="ct-desc">Description <span className="text-red-500">*</span></Label>
                <Input
                  id="ct-desc"
                  placeholder="Brief description of this transaction…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Custom reference */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customRef}
                    onChange={(e) => setCustomRef(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-slate-700">Use custom reference</span>
                </label>
                {customRef && (
                  <Input
                    placeholder="e.g. TXN-ABC123"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                )}
                {!customRef && (
                  <p className="text-xs text-slate-400">Reference will be auto-generated</p>
                )}
              </div>

              {step2Err && <p className="text-sm text-red-600">{step2Err}</p>}
            </>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm divide-y divide-slate-100">
                {selAccount && (
                  <>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Account</span>
                      <code className="text-xs">{selAccount.accountNumber}</code>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium capitalize">{txType.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Amount</span>
                  <span className={`font-bold ${isDebit ? "text-red-600" : "text-emerald-600"}`}>
                    {isDebit ? "-" : "+"}{isBTC
                      ? `${amountNum.toFixed(8)} BTC`
                      : `${amountNum.toFixed(2)} ${currency}`
                    }
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Description</span>
                  <span className="text-slate-700 text-right max-w-48 truncate">{description}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">New balance</span>
                  <span className={`font-medium ${afterBal < 0 ? "text-red-600" : ""}`}>
                    {isBTC ? `${afterBal.toFixed(8)} BTC` : `${afterBal.toFixed(2)} ${currency}`}
                  </span>
                </div>
              </div>

              {submitErr && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {submitErr}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step > 1 && !prefilledAccountId && (
            <Button variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} disabled={submitting}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>

          {step === 1 && (
            <Button
              onClick={proceedToStep2}
              disabled={!selAccount}
              className="bg-[#1A2CCE] hover:bg-[#1A2CCE]/90 text-white"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {step === 2 && (
            <Button
              onClick={() => {
                if (validateStep2()) setStep(3)
              }}
              disabled={afterBal < 0}
              className="bg-[#1A2CCE] hover:bg-[#1A2CCE]/90 text-white"
            >
              Review <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={handleSubmit}
              disabled={submitting || afterBal < 0}
              className="bg-[#1A2CCE] hover:bg-[#1A2CCE]/90 text-white"
            >
              {submitting ? "Creating…" : "Confirm & create"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
