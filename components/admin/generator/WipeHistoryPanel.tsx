"use client"

import { useState, useCallback, useRef } from "react"
import { AlertTriangle, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { Button }  from "@/components/ui/button"
import { Input }   from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

interface UserResult {
  _id:   string
  email: string
  name:  string
  accounts: Array<{ id: string; currency: string; walletType: string }>
}

export function WipeHistoryPanel() {
  const { toast } = useToast()

  const [open,          setOpen]          = useState(false)
  const [search,        setSearch]        = useState("")
  const [searching,     setSearching]     = useState(false)
  const [user,          setUser]          = useState<UserResult | null>(null)
  const [wipingId,      setWipingId]      = useState<string | null>(null)
  const [wipingAll,     setWipingAll]     = useState(false)
  const [confirmAll,    setConfirmAll]    = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchUser = useCallback(async (q: string) => {
    if (!q.trim()) { setUser(null); return }
    setSearching(true)
    try {
      const res  = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=1`)
      const data = await res.json()
      if (data.users?.[0]) {
        const u      = data.users[0]
        const detRes = await fetch(`/api/admin/users/${u.id}`)
        const det    = await detRes.json()
        setUser({ _id: u.id, email: u.email, name: `${u.firstName} ${u.lastName}`, accounts: det.accounts ?? [] })
      } else {
        setUser(null)
      }
    } finally {
      setSearching(false)
    }
  }, [])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setUser(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchUser(val), 500)
  }

  const wipeAccount = async (accountId: string) => {
    if (!user) return
    setWipingId(accountId)
    try {
      const res  = await fetch("/api/admin/generate/wipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, accountId, wipeAll: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Wipe failed")
      toast({ title: "Wiped", description: `Deleted ${data.deletedCount} generated transaction(s).` })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Wipe failed", variant: "destructive" })
    } finally {
      setWipingId(null)
    }
  }

  const wipeAll = async () => {
    if (!user || !confirmAll) return
    setWipingAll(true)
    try {
      const res  = await fetch("/api/admin/generate/wipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, wipeAll: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Wipe failed")
      const cardMsg = data.cardTxDeleted ? ` and ${data.cardTxDeleted} card transaction(s)` : ""
      toast({ title: "All history wiped", description: `Deleted ${data.deletedCount} transaction(s)${cardMsg}. All balances reset to $0.` })
      setConfirmAll(false)
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Wipe failed", variant: "destructive" })
    } finally {
      setWipingAll(false)
    }
  }

  return (
    <div className="border border-red-200 rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium text-sm flex-1 text-left">Danger zone — wipe generated history</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="p-4 space-y-4 bg-white">
          <p className="text-xs text-gray-500">
            Permanently deletes all synthetic (generated) transactions and resets account balances to $0.
            Real transactions are untouched.
          </p>

          {/* User search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search user by email or name</label>
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="user@example.com"
              className="text-sm"
            />
            {searching && <p className="text-xs text-gray-400 mt-1">Searching…</p>}
            {!searching && search && !user && (
              <p className="text-xs text-red-500 mt-1">No user found</p>
            )}
          </div>

          {user && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-gray-500 text-xs">{user.email}</p>
              </div>

              {/* Per-account wipe */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Wipe by account</p>
                {user.accounts.length === 0 && (
                  <p className="text-xs text-gray-400">No accounts found</p>
                )}
                {user.accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-xs font-medium text-gray-800">
                        {acc.walletType === "bitcoin" ? "Bitcoin" : acc.currency} account
                      </span>
                      <p className="text-xs text-gray-400 font-mono">{acc.id.slice(-8)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => wipeAccount(acc.id)}
                      disabled={wipingId === acc.id}
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {wipingId === acc.id ? "Wiping…" : "Wipe"}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Wipe all */}
              <div className="border border-red-200 rounded-lg p-3 space-y-2 bg-red-50">
                <p className="text-xs font-semibold text-red-700">Wipe ALL accounts for this user</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmAll}
                    onChange={(e) => setConfirmAll(e.target.checked)}
                    className="rounded border-red-300"
                  />
                  <span className="text-xs text-red-700">
                    I understand this will reset all balances to $0 and delete all generated transactions
                  </span>
                </label>
                <Button
                  size="sm"
                  onClick={wipeAll}
                  disabled={!confirmAll || wipingAll}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 w-full"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {wipingAll ? "Wiping all…" : "Wipe all generated history"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
