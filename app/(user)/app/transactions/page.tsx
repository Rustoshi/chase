"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Search, Filter, ChevronDown } from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { TransactionRow } from "@/components/user/shared/TransactionRow"
import { useThemeColors } from "@/components/shared/ThemeProvider"

interface TxItem {
  _id: string; type: string; status: string; amount: number;
  currency: string; description: string; createdAt: string;
}

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "deposit", label: "Deposits" },
  { value: "transfer_out", label: "Sent" },
  { value: "transfer_in", label: "Received" },
  { value: "swap_in", label: "Swaps" },
  { value: "admin_deposit", label: "Admin" },
]

export default function TransactionsPage() {
  const sp = useSearchParams()
  const initialAccountId = sp.get("accountId") || ""
  const colors = useThemeColors()

  const [transactions, setTransactions] = useState<TxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [typeFilter, setTypeFilter] = useState("")
  const [accountId] = useState(initialAccountId)
  const [showFilter, setShowFilter] = useState(false)
  const loadingMore = useRef(false)

  const fetchTx = useCallback(async (p: number, append: boolean) => {
    if (loadingMore.current) return
    loadingMore.current = true

    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" })
      if (typeFilter) params.set("type", typeFilter)
      if (accountId) params.set("accountId", accountId)

      const res = await fetch(`/api/user/transactions?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (append) {
          setTransactions((prev) => [...prev, ...data.transactions])
        } else {
          setTransactions(data.transactions)
        }
        setHasMore(data.transactions.length === 20)
      }
    } catch { /* */ }

    setLoading(false)
    loadingMore.current = false
  }, [typeFilter, accountId])

  useEffect(() => {
    setPage(1)
    setLoading(true)
    fetchTx(1, false)
  }, [fetchTx])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchTx(next, true)
  }

  return (
    <>
      <UserHeader
        title="Transactions"
        showBack
        rightElement={
          <button
            onClick={() => setShowFilter((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: showFilter ? colors.blueBg : colors.bgElevated }}
          >
            <Filter className="h-4 w-4" style={{ color: showFilter ? colors.blue : colors.textSecondary }} />
          </button>
        }
      />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 120px" }}>
        {/* Filter strip */}
        {showFilter && (
          <div style={{ paddingTop: 16, paddingBottom: 8 }}>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className="flex-shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all"
                  style={{
                    background: typeFilter === f.value ? colors.blueBg : colors.bgElevated,
                    border: `1px solid ${typeFilter === f.value ? colors.blue : colors.border}`,
                    color: typeFilter === f.value ? colors.blue : colors.textSecondary,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ paddingTop: 20 }} className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl" style={{ background: colors.bgElevated }} />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ paddingTop: 80, textAlign: "center" }}>
            <Search className="h-10 w-10 mx-auto mb-3" style={{ color: colors.textMuted }} />
            <p style={{ fontSize: 16, fontWeight: 500, color: colors.textPrimary }}>No transactions found</p>
            <p style={{ marginTop: 4, fontSize: 14, color: colors.textTertiary }}>
              {typeFilter ? "Try a different filter" : "Your transactions will appear here"}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl mt-4 overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
              {transactions.map((tx, i) => (
                <div key={tx._id}>
                  <TransactionRow transaction={tx} index={i} />
                  {i < transactions.length - 1 && (
                    <div className="ml-[72px] mr-5 h-px" style={{ background: colors.border }} />
                  )}
                </div>
              ))}
            </div>

            {hasMore && (
              <div style={{ paddingTop: 16 }}>
                <button
                  onClick={loadMore}
                  className="w-full h-11 rounded-xl text-[14px] font-medium transition-all active:scale-[0.98]"
                  style={{ background: colors.bgElevated, border: `1px solid ${colors.border}`, color: colors.textSecondary }}
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
