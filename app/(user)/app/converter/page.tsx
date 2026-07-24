"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowUpDown, RefreshCw } from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"

interface Currency { code: string; name: string; symbol: string; flag: string }

export default function ConverterPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [rates, setRates] = useState<Record<string, Record<string, number>>>({})
  const [from, setFrom] = useState("USD")
  const [to, setTo] = useState("EUR")
  const [amount, setAmount] = useState("1000")
  const [loading, setLoading] = useState(true)

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch("/api/user/exchange-rate")
      if (res.ok) {
        const data = await res.json()
        setRates(data.rates)
        setCurrencies(data.currencies)
      }
    } catch { /* */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchRates() }, [fetchRates])

  const rate = rates[from]?.[to] || 0
  const result = (parseFloat(amount) || 0) * rate

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  const fromCurrency = currencies.find((c) => c.code === from)
  const toCurrency = currencies.find((c) => c.code === to)

  return (
    <div style={{ background: "#F5F6F8", minHeight: "100vh" }}>
      <UserHeader title="Currency Converter" />

      <div className="px-4 py-5 lg:px-6 max-w-[600px] mx-auto space-y-5">
        {loading ? (
          <div className="space-y-3">
            <div className="h-40 rounded-2xl skeleton-shimmer" />
            <div className="h-32 rounded-2xl skeleton-shimmer" />
          </div>
        ) : (
          <>
            {/* Converter card */}
            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", borderRadius: 16, boxShadow: "0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)" }}>
              {/* From */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide mb-2" style={{ color: "#98A2B3" }}>From</p>
                <div className="flex gap-3 items-center">
                  <select
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="flex-shrink-0"
                    style={{ width: 120, appearance: "none", cursor: "pointer", background: "#F9FAFB", border: "1px solid #EAECF0", borderRadius: 10, color: "#101828", padding: "10px 12px", fontSize: 14 }}
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code} style={{ background: "#FFFFFF", color: "#101828" }}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 text-right text-[18px] font-semibold tabular-nums"
                    placeholder="0"
                    style={{ background: "#F9FAFB", border: "1px solid #EAECF0", borderRadius: 10, color: "#101828", padding: "10px 12px" }}
                  />
                </div>
              </div>

              {/* Swap button */}
              <div className="flex items-center justify-center my-4">
                <button
                  onClick={swap}
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-90"
                  style={{ background: "#EEF0FE", border: "1px solid #D0D5DD" }}
                >
                  <ArrowUpDown className="h-4 w-4" style={{ color: "#1A2CCE" }} />
                </button>
              </div>

              {/* To */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide mb-2" style={{ color: "#98A2B3" }}>To</p>
                <div className="flex gap-3 items-center">
                  <select
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="flex-shrink-0"
                    style={{ width: 120, appearance: "none", cursor: "pointer", background: "#F9FAFB", border: "1px solid #EAECF0", borderRadius: 10, color: "#101828", padding: "10px 12px", fontSize: 14 }}
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code} style={{ background: "#FFFFFF", color: "#101828" }}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <div className="flex-1 text-right">
                    <p className="text-[22px] font-bold tabular-nums" style={{ color: "#101828" }}>
                      {to === "BTC"
                        ? result.toFixed(8)
                        : result.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate info */}
            <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", borderRadius: 16, boxShadow: "0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px]" style={{ color: "#667085" }}>Exchange rate</span>
                <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#101828" }}>
                  1 {from} = {to === "BTC" ? rate.toFixed(8) : rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {to}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid #EAECF0" }}>
                <span className="text-[13px]" style={{ color: "#667085" }}>Inverse</span>
                <span className="text-[13px] font-medium tabular-nums" style={{ color: "#667085" }}>
                  1 {to} = {rates[to]?.[from]
                    ? (from === "BTC"
                        ? rates[to][from].toFixed(8)
                        : rates[to][from].toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 }))
                    : "—"
                  } {from}
                </span>
              </div>
            </div>

            {/* Popular pairs */}
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.06em] mb-3" style={{ color: "#667085" }}>
                Popular pairs
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { f: "USD", t: "EUR" }, { f: "USD", t: "GBP" },
                  { f: "USD", t: "BTC" }, { f: "EUR", t: "GBP" },
                  { f: "USD", t: "NGN" }, { f: "BTC", t: "USD" },
                ].map(({ f, t }) => {
                  const r = rates[f]?.[t]
                  return (
                    <button
                      key={`${f}-${t}`}
                      onClick={() => { setFrom(f); setTo(t) }}
                      className="rounded-xl p-3 text-left transition-all active:scale-[0.98]"
                      style={{
                        background: from === f && to === t ? "#EEF0FE" : "#FFFFFF",
                        border: from === f && to === t ? "1px solid #1A2CCE" : "1px solid #EAECF0",
                        borderRadius: 12,
                      }}
                    >
                      <p className="text-[13px] font-medium" style={{ color: "#101828" }}>{f}/{t}</p>
                      <p className="text-[12px] tabular-nums mt-0.5" style={{ color: "#667085" }}>
                        {r ? (t === "BTC" ? r.toFixed(8) : r.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })) : "—"}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
