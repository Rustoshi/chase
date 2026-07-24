"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw } from "lucide-react"

const REFRESH_MS = 5 * 60 * 1000

// Render a price in its actual currency (e.g. "£47,481", "$64,039"). The BTC rate
// endpoint returns the price in the platform's default currency, so we must label
// it with that currency rather than assuming USD.
function formatPrice(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    // Unknown/unsupported currency code — fall back to code + number.
    return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`
  }
}

export function LiveBtcPrice() {
  const [price,     setPrice]     = useState<number | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [error,     setError]     = useState(false)

  const fetchPrice = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      // Always quote BTC in USD — the familiar market reference — regardless of
      // the platform's default currency.
      const res  = await fetch("/api/wallet/btc-rate?currency=USD", { cache: "no-store" })
      if (!res.ok) throw new Error()
      const data = await res.json() as { usd?: number; price?: number; rate?: number }
      const p    = data.usd ?? data.price ?? data.rate ?? null
      if (typeof p === "number") { setPrice(p); setUpdatedAt(new Date()) }
      else throw new Error()
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrice()
    const id = setInterval(fetchPrice, REFRESH_MS)
    return () => clearInterval(id)
  }, [fetchPrice])

  function timeAgo(d: Date): string {
    const secs = Math.floor((Date.now() - d.getTime()) / 1000)
    if (secs < 60)  return "just now"
    if (secs < 120) return "1 minute ago"
    return `${Math.floor(secs / 60)} minutes ago`
  }

  return (
    <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      <span className="text-amber-500 font-bold text-base">₿</span>
      {error ? (
        <span className="text-red-500 text-xs">Price unavailable</span>
      ) : price === null ? (
        <span className="text-gray-400 text-xs animate-pulse">Loading…</span>
      ) : (
        <>
          <span className="font-semibold text-gray-900">
            1 BTC = {formatPrice(price, "USD")}
          </span>
          {updatedAt && (
            <span className="text-gray-400 text-xs">· Updated {timeAgo(updatedAt)}</span>
          )}
        </>
      )}
      <button
        type="button"
        onClick={fetchPrice}
        disabled={loading}
        className="ml-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
        title="Refresh price"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  )
}
