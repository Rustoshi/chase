"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  ArrowLeft, ArrowRight, Loader2, Check,
  RefreshCw, CreditCard, Bitcoin, Repeat,
} from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { GenerationResultChart } from "./GenerationResultChart"
import { WipeHistoryPanel }      from "./WipeHistoryPanel"
import type { GenerateHistoryResult, GenerationPreview } from "@/lib/services/historyGenerator.service"

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserHit {
  id:    string
  email: string
  firstName: string
  lastName:  string
}

interface AccountOption {
  id:         string
  currency:   string
  walletType: string
  balance:    number
  btcBalance: number
}

interface CardInfo {
  id: string
  cardType: string
  cardNumber?: string
  status: string
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={[
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
        done   ? "bg-emerald-500 text-white"  :
        active ? "bg-indigo-600   text-white ring-2 ring-indigo-300" :
                 "bg-gray-100   text-gray-400",
      ].join(" ")}>
        {done ? <Check className="w-3.5 h-3.5" /> : n}
      </div>
    </div>
  )
}

function StepBar({ step }: { step: number }) {
  const labels = ["Select user & account", "Configure generation", "Preview & generate"]
  return (
    <div className="flex items-center gap-2 mb-8">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2">
            <StepDot n={i + 1} active={step === i + 1} done={step > i + 1} />
            <span className={[
              "text-xs hidden sm:block",
              step === i + 1 ? "font-medium text-gray-800" :
              step > i + 1   ? "text-emerald-600" : "text-gray-400",
            ].join(" ")}>{label}</span>
          </div>
          {i < labels.length - 1 && (
            <div className={[
              "flex-1 h-px",
              step > i + 1 ? "bg-emerald-400" : "bg-gray-200",
            ].join(" ")} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function GeneratorClient() {
  const { toast } = useToast()

  const [step,    setStep]    = useState(1)
  const [result,  setResult]  = useState<GenerateHistoryResult | null>(null)
  const [preview, setPreview] = useState<GenerationPreview | null>(null)

  // Step 1 - User & Account selection
  const [userSearch,   setUserSearch]   = useState("")
  const [userResults,  setUserResults]  = useState<UserHit[]>([])
  const [searchingUser,setSearchingUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserHit | null>(null)
  const [accounts,     setAccounts]     = useState<AccountOption[]>([])
  const [selectedAcct, setSelectedAcct] = useState<AccountOption | null>(null)
  const [userCards,    setUserCards]    = useState<CardInfo[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Step 2 - Configuration (use strings for inputs to allow empty state)
  const [startingBalance, setStartingBalance] = useState("")
  const [endingBalance,   setEndingBalance]   = useState("")
  const [minAmount,       setMinAmount]       = useState("5")
  const [maxAmount,       setMaxAmount]       = useState("500")
  // Default: 6 months ago to today
  const [startDate,       setStartDate]       = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 6)
    return d.toISOString().split("T")[0]
  })
  const [endDate,         setEndDate]         = useState(() => new Date().toISOString().split("T")[0])
  const [includeSwaps,    setIncludeSwaps]    = useState(false)
  const [includeCards,    setIncludeCards]    = useState(false)
  const [seed,            setSeed]            = useState<string>("")
  
  // Parse string values to numbers for API calls
  const startingBalanceNum = parseFloat(startingBalance) || 0
  const endingBalanceNum   = parseFloat(endingBalance) || 0
  const minAmountNum       = parseFloat(minAmount) || 0
  const maxAmountNum       = parseFloat(maxAmount) || 0

  // Derived state
  const isBtcMode = selectedAcct?.walletType === "bitcoin"
  const hasActiveCards = userCards.filter(c => c.status === "active").length > 0

  // Step 3
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [generating,     setGenerating]     = useState(false)

  // ── User search ─────────────────────────────────────────────────────────────

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setUserResults([]); return }
    setSearchingUser(true)
    try {
      const res  = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=8`)
      const data = await res.json()
      setUserResults(data.users ?? [])
    } finally {
      setSearchingUser(false)
    }
  }, [])

  const handleUserSearchChange = (val: string) => {
    setUserSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  const selectUser = async (u: UserHit) => {
    setSelectedUser(u)
    setUserSearch(u.email)
    setUserResults([])
    setSelectedAcct(null)
    setUserCards([])

    try {
      const res  = await fetch(`/api/admin/users/${u.id}`)
      const data = await res.json()
      setAccounts((data.accounts ?? []).filter((a: AccountOption) => a.walletType !== "loan"))
      // Extract card applications
      const cards = (data.cardApplications ?? []).map((c: { _id?: string; id?: string; cardType: string; cardNumber?: string; status: string }) => ({
        id: c._id || c.id,
        cardType: c.cardType,
        cardNumber: c.cardNumber,
        status: c.status,
      }))
      setUserCards(cards)
    } catch {
      setAccounts([])
      setUserCards([])
    }
  }

  // Set starting balance when account is selected
  useEffect(() => {
    if (selectedAcct) {
      if (selectedAcct.walletType === "bitcoin") {
        const btcBal = selectedAcct.btcBalance || 0
        setStartingBalance(String(btcBal))
        setEndingBalance(String(btcBal || 0.5))
        setMinAmount("0.0001")
        setMaxAmount("0.1")
      } else {
        const fiatBal = selectedAcct.balance || 0
        setStartingBalance(String(fiatBal))
        setEndingBalance(String(fiatBal || 1000))
        setMinAmount("5")
        setMaxAmount("500")
      }
    }
  }, [selectedAcct])

  // ── Preview ─────────────────────────────────────────────────────────────────

  const loadPreview = useCallback(async () => {
    if (!selectedAcct) return
    setLoadingPreview(true)
    setPreview(null)
    try {
      const res = await fetch("/api/admin/generate/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startingBalance: startingBalanceNum,
          endingBalance: endingBalanceNum,
          minAmount: minAmountNum,
          maxAmount: maxAmountNum,
          startDate,
          endDate,
          includeCardTransactions: includeCards,
          hasActiveCards,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Preview failed")
      setPreview(data)
    } catch (err) {
      toast({ title: "Preview error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setLoadingPreview(false)
    }
  }, [selectedAcct, startingBalanceNum, endingBalanceNum, minAmountNum, maxAmountNum, startDate, endDate, includeCards, hasActiveCards, toast])

  useEffect(() => {
    if (step === 3) loadPreview()
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate ────────────────────────────────────────────────────────────────

  const generate = async () => {
    if (!selectedUser || !selectedAcct) return
    setGenerating(true)
    try {
      if (isBtcMode) {
        const res = await fetch("/api/admin/generate/bitcoin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUser.id,
            btcAccountId: selectedAcct.id,
            startingBalance: startingBalanceNum,
            endingBalance: endingBalanceNum,
            minAmount: minAmountNum,
            maxAmount: maxAmountNum,
            startDate,
            endDate,
            includeSwaps,
            seed: seed ? Number(seed) : undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Generation failed")
        toast({ title: "Bitcoin history generated!", description: `${data.transactionsCreated} transactions created.` })
        setResult({
          transactionsCreated: data.transactionsCreated,
          cardTransactionsCreated: 0,
          finalBalance: data.finalBtcBalance,
          incomeTotal: 0,
          expensesTotal: 0,
          monthBreakdown: [],
        })
      } else {
        const res = await fetch("/api/admin/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUser.id,
            accountId: selectedAcct.id,
            startingBalance: startingBalanceNum,
            endingBalance: endingBalanceNum,
            minAmount: minAmountNum,
            maxAmount: maxAmountNum,
            startDate,
            endDate,
            includeSwaps,
            includeCardTransactions: includeCards,
            seed: seed ? Number(seed) : undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Generation failed")
        const cardMsg = data.cardTransactionsCreated > 0 ? ` + ${data.cardTransactionsCreated} card transactions` : ""
        toast({ title: "History generated!", description: `${data.transactionsCreated} transactions${cardMsg} created.` })
        setResult(data)
      }
      setStep(4)
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Generation failed", variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  const reset = () => {
    setStep(1); setResult(null); setPreview(null)
    setSelectedUser(null); setSelectedAcct(null)
    setUserSearch(""); setAccounts([]); setUserCards([])
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">History Generator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Seed realistic synthetic transaction histories into any user account for demos and testing.
        </p>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {step < 4 && <StepBar step={step} />}

        {/* ── Step 1: User + account selection ── */}
        {step === 1 && (
          <div className="space-y-5 max-w-lg">
            <div className="relative">
              <Label className="mb-1.5 block text-sm">Search user</Label>
              <Input
                value={userSearch}
                onChange={(e) => handleUserSearchChange(e.target.value)}
                placeholder="Name or email…"
                className="pr-8"
              />
              {searchingUser && (
                <Loader2 className="w-4 h-4 absolute right-2 top-[2.15rem] text-gray-400 animate-spin" />
              )}
              {userResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedUser && (
              <div>
                <Label className="mb-1.5 block text-sm">Select account</Label>
                {accounts.length === 0 && (
                  <p className="text-sm text-gray-400">No accounts available</p>
                )}
                <div className="space-y-2">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedAcct(acc)}
                      className={[
                        "w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all",
                        selectedAcct?.id === acc.id
                          ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400"
                          : "border-gray-200 bg-white hover:border-gray-300",
                      ].join(" ")}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {acc.walletType === "bitcoin" ? "Bitcoin" : acc.currency} account
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{acc.id.slice(-10)}</p>
                      </div>
                      <div className="text-right">
                        {acc.walletType === "bitcoin" ? (
                          <p className="text-sm font-medium text-gray-800">
                            {acc.btcBalance.toFixed(8)} BTC
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-gray-800">
                            ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => setStep(2)}
              disabled={!selectedAcct}
              className="gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Configuration ── */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Account type indicator */}
            {isBtcMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
                <Bitcoin className="w-4 h-4" />
                Bitcoin account selected — generating BTC transaction history
              </div>
            )}

            {/* Balance configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Balance Configuration</h3>
              <div className="grid grid-cols-2 gap-4 max-w-lg">
                <div>
                  <Label className="mb-1.5 block text-sm">
                    Starting Balance {isBtcMode ? "(BTC)" : "($)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={isBtcMode ? 0.00000001 : 0.01}
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Current balance or custom start</p>
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">
                    Ending Balance {isBtcMode ? "(BTC)" : "($)"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={isBtcMode ? 0.00000001 : 0.01}
                    value={endingBalance}
                    onChange={(e) => setEndingBalance(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Target balance after generation</p>
                </div>
              </div>
            </div>

            {/* Transaction amount limits */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Transaction Amounts</h3>
              <div className="grid grid-cols-2 gap-4 max-w-lg">
                <div>
                  <Label className="mb-1.5 block text-sm">
                    Min Amount {isBtcMode ? "(BTC)" : "($)"}
                  </Label>
                  <Input
                    type="number"
                    min={isBtcMode ? 0.00000001 : 0.01}
                    step={isBtcMode ? 0.0001 : 1}
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">
                    Max Amount {isBtcMode ? "(BTC)" : "($)"}
                  </Label>
                  <Input
                    type="number"
                    min={isBtcMode ? 0.00000001 : 0.01}
                    step={isBtcMode ? 0.01 : 10}
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">History Date Range</h3>
              <div className="grid grid-cols-2 gap-4 max-w-lg">
                <div>
                  <Label className="mb-1.5 block text-sm">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {(() => {
                  const start = new Date(startDate)
                  const end = new Date(endDate)
                  const diffMs = end.getTime() - start.getTime()
                  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                  const months = Math.floor(diffDays / 30)
                  const days = diffDays % 30
                  if (diffDays <= 0) return "Please select a valid date range"
                  return `Duration: ${months > 0 ? `${months} month${months > 1 ? "s" : ""}` : ""}${months > 0 && days > 0 ? " and " : ""}${days > 0 ? `${days} day${days > 1 ? "s" : ""}` : ""}`
                })()}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Options</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeSwaps}
                    onChange={(e) => setIncludeSwaps(e.target.checked)}
                    className="rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-indigo-500" />
                    <div>
                      <span className="text-sm text-gray-700 font-medium">Include fiat ↔ BTC swaps</span>
                      <p className="text-xs text-gray-400">Generate swap transactions between fiat and bitcoin</p>
                    </div>
                  </div>
                </label>

                {!isBtcMode && (
                  <label className={[
                    "flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors",
                    hasActiveCards 
                      ? "border-gray-200 hover:bg-gray-50" 
                      : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed",
                  ].join(" ")}>
                    <input
                      type="checkbox"
                      checked={includeCards}
                      onChange={(e) => setIncludeCards(e.target.checked)}
                      disabled={!hasActiveCards}
                      className="rounded"
                    />
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-500" />
                      <div>
                        <span className="text-sm text-gray-700 font-medium">Include card transactions</span>
                        <p className="text-xs text-gray-400">
                          {hasActiveCards 
                            ? `Generate transactions for ${userCards.filter(c => c.status === "active").length} active card(s)`
                            : "User has no active credit/debit cards"
                          }
                        </p>
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Seed */}
            <div className="max-w-xs">
              <Label className="mb-1.5 block text-sm">Seed (optional)</Label>
              <Input
                type="number"
                placeholder="e.g. 42"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">For reproducible generation</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2">
                Preview <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Preview & generate ── */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Config summary banner */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap gap-4 text-sm">
              <span>
                <span className="text-gray-500">User: </span>
                <span className="font-medium">{selectedUser?.firstName} {selectedUser?.lastName}</span>
              </span>
              <span>
                <span className="text-gray-500">Account: </span>
                <span className="font-medium">
                  {selectedAcct?.walletType === "bitcoin" ? "Bitcoin" : selectedAcct?.currency}
                </span>
              </span>
              <span>
                <span className="text-gray-500">Period: </span>
                <span className="font-medium">
                  {new Date(startDate).toLocaleDateString()} → {new Date(endDate).toLocaleDateString()}
                </span>
              </span>
              <span>
                <span className="text-gray-500">Balance: </span>
                <span className="font-medium">
                  {isBtcMode ? `${startingBalance} → ${endingBalance} BTC` : `$${startingBalanceNum.toLocaleString()} → $${endingBalanceNum.toLocaleString()}`}
                </span>
              </span>
            </div>

            {/* Preview data */}
            {loadingPreview && (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating preview…
              </div>
            )}
            {preview && !loadingPreview && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Est. transactions</p>
                    <p className="text-lg font-semibold text-gray-900">{preview.estimatedTransactions.toLocaleString()}</p>
                  </div>
                  {preview.estimatedCardTransactions > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs text-purple-600 mb-0.5">Card transactions</p>
                      <p className="text-lg font-semibold text-purple-700">{preview.estimatedCardTransactions.toLocaleString()}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Total months</p>
                    <p className="text-lg font-semibold text-gray-900">{preview.totalMonths}</p>
                  </div>
                  <div className={[
                    "border rounded-lg p-3",
                    preview.balanceDelta >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200",
                  ].join(" ")}>
                    <p className={["text-xs mb-0.5", preview.balanceDelta >= 0 ? "text-emerald-600" : "text-red-600"].join(" ")}>
                      Balance change
                    </p>
                    <p className={["text-lg font-semibold", preview.balanceDelta >= 0 ? "text-emerald-700" : "text-red-700"].join(" ")}>
                      {preview.balanceDelta >= 0 ? "+" : ""}
                      {isBtcMode 
                        ? `${preview.balanceDelta.toFixed(8)} BTC`
                        : `$${preview.balanceDelta.toLocaleString()}`
                      }
                    </p>
                  </div>
                </div>

                {/* Summary info */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm text-indigo-700">
                  <p>
                    <strong>~{preview.avgTransactionsPerMonth}</strong> transactions per month will be generated.
                    {includeCards && hasActiveCards && (
                      <span> Card transactions will also be created and visible on the user&apos;s card details page.</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
              Generating will <strong>delete all existing generated transactions</strong> for this account and replace them.
              Real (non-generated) transactions are untouched.
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={generate}
                disabled={generating}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                ) : (
                  <><Check className="w-4 h-4" /> Generate history</>
                )}
              </Button>
              <Button variant="outline" onClick={loadPreview} disabled={loadingPreview} className="gap-1 ml-auto">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? "animate-spin" : ""}`} />
                Refresh preview
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Results ── */}
        {step === 4 && result && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">History generated successfully</p>
                <p className="text-sm text-gray-500">
                  {result.transactionsCreated} transactions
                  {result.cardTransactionsCreated > 0 && ` + ${result.cardTransactionsCreated} card transactions`}
                  {" "}created for {selectedUser?.firstName} {selectedUser?.lastName}
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500">Transactions</p>
                <p className="text-lg font-semibold">{result.transactionsCreated.toLocaleString()}</p>
              </div>
              {result.cardTransactionsCreated > 0 && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-purple-600">Card Transactions</p>
                  <p className="text-lg font-semibold text-purple-700">{result.cardTransactionsCreated.toLocaleString()}</p>
                </div>
              )}
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <p className="text-xs text-emerald-600">Final Balance</p>
                <p className="text-lg font-semibold text-emerald-700">
                  {isBtcMode 
                    ? `${result.finalBalance.toFixed(8)} BTC`
                    : `$${result.finalBalance.toLocaleString()}`
                  }
                </p>
              </div>
              {!isBtcMode && (
                <>
                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                    <p className="text-xs text-indigo-600">Total Income</p>
                    <p className="text-lg font-semibold text-indigo-700">${result.incomeTotal.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-red-600">Total Expenses</p>
                    <p className="text-lg font-semibold text-red-700">${result.expensesTotal.toLocaleString()}</p>
                  </div>
                </>
              )}
            </div>

            {result.monthBreakdown.length > 0 && (
              <GenerationResultChart result={result} />
            )}

            <div className="flex gap-2">
              <Button onClick={reset} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" /> Generate another
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`/admin/transactions?userId=${selectedUser?.id}`, "_blank")}
              >
                View transactions
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Wipe panel */}
      <WipeHistoryPanel />
    </div>
  )
}
