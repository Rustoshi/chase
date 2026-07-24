"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpDown, Loader2, X, AlertTriangle,
  Check, Shield, Lock, TrendingUp, TrendingDown,
  RefreshCcw, ChevronDown, Delete,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { BANK_NAME } from "@/lib/brand"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"

// ── Types ────────────────────────────────────────────────────────────────────

interface AccountInfo {
  _id: string
  walletType: "fiat" | "bitcoin"
  accountNumber: string
  currency: string
  balance: number
  btcBalance: number
}

type Direction = "buy" | "sell"

// ── Component ────────────────────────────────────────────────────────────────

export default function SwapPage() {
  const router = useRouter()
  const colors = useThemeColors()
  const { currency, symbol: currencySymbol } = useCurrency()

  // State
  const [accounts, setAccounts]   = useState<AccountInfo[]>([])
  const [loading, setLoading]     = useState(true)
  const [direction, setDirection] = useState<Direction>("buy")
  const [amount, setAmount]       = useState("")
  const [btcRate, setBtcRate]     = useState(0)
  const [rateLoading, setRateLoading] = useState(true)
  const [rateFetchedAt, setRateFetchedAt] = useState("")
  const [feePercent, setFeePercent] = useState(1.5)

  // PIN flow
  const [showPin, setShowPin]       = useState(false)
  const [pin, setPin]               = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState("")

  // Success
  const [result, setResult] = useState<{
    direction: Direction
    fiatAmount: number
    btcAmount: number
    fee: number
    rate: number
    reference: string
  } | null>(null)

  // Fetch accounts
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/user/dashboard")
        if (res.ok) {
          const data = await res.json()
          setAccounts(data.accounts || [])
        }
      } catch { /* */ }
      setLoading(false)
    })()
  }, [])

  // Fetch BTC rate
  const fetchRate = useCallback(async () => {
    setRateLoading(true)
    try {
      const res = await fetch("/api/wallet/btc-rate")
      if (res.ok) {
        const data = await res.json()
        setBtcRate(data.usd || 0)
        setRateFetchedAt(data.fetchedAt || "")
      }
    } catch { /* */ }
    setRateLoading(false)
  }, [])

  useEffect(() => { fetchRate() }, [fetchRate])

  // Auto-refresh rate every 30s
  useEffect(() => {
    const iv = setInterval(fetchRate, 30_000)
    return () => clearInterval(iv)
  }, [fetchRate])

  // Fetch swap fee
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) {
          const data = await res.json()
          setFeePercent(data.swapFeePercent ?? 1.5)
        }
      } catch { /* */ }
    })()
  }, [])

  const fiatAcct = accounts.find((a) => a.walletType === "fiat")
  const btcAcct  = accounts.find((a) => a.walletType === "bitcoin")

  const fiatBalance = fiatAcct ? fiatAcct.balance / 100 : 0
  const btcBalance  = btcAcct ? btcAcct.btcBalance / 1e8 : 0

  const numAmount   = parseFloat(amount) || 0
  const fee         = numAmount * (feePercent / 100)
  const net         = numAmount - fee

  // Computed output
  const btcOutput = direction === "buy" && btcRate > 0
    ? net / btcRate
    : 0
  const fiatOutput = direction === "sell" && btcRate > 0
    ? net
    : 0
  const btcInput = direction === "sell" && btcRate > 0
    ? numAmount / btcRate
    : 0

  const canSwap = numAmount > 0 && btcRate > 0 && (
    direction === "buy"
      ? numAmount <= fiatBalance
      : btcInput <= btcBalance
  )

  // Flip direction
  const flipDirection = () => {
    setDirection((d) => d === "buy" ? "sell" : "buy")
    setAmount("")
    setError("")
  }

  // Quick amounts
  const quickAmounts = direction === "buy"
    ? [50, 100, 250, 500]
    : [50, 100, 250, 500]

  // PIN handlers
  const addPinDigit = useCallback((digit: string) => {
    setPin((prev) => prev.length >= 4 ? prev : prev + digit)
    setError("")
  }, [])
  const removePinDigit = useCallback(() => {
    setPin((prev) => prev.slice(0, -1))
  }, [])

  // Submit swap
  const handleSubmit = useCallback(async () => {
    if (pin.length !== 4 || !numAmount || !btcRate) return
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/user/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          amount: numAmount,
          btcRate,
          pin,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Swap failed")
        setPin("")
        setSubmitting(false)
        return
      }

      setResult(data)
    } catch {
      setError("Network error. Please try again.")
      setPin("")
    }
    setSubmitting(false)
  }, [pin, numAmount, btcRate, direction])

  // Auto-submit when PIN complete
  useEffect(() => {
    if (pin.length === 4 && showPin) handleSubmit()
  }, [pin, showPin, handleSubmit])

  // ── Success Screen ──────────────────────────────────────────────────────────

  if (result) {
    const isBuy = result.direction === "buy"
    return (
      <>
        <UserHeader title="Swap" showBack />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 120px" }}>
          <div style={{ paddingTop: 40, textAlign: "center" }}>
            {/* Success circle */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
              background: colors.greenBg,
              border: `2px solid ${colors.green}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check style={{ width: 32, height: 32, color: colors.green }} />
            </div>

            <p style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Swap Complete</p>
            <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 28px" }}>
              Your swap has been processed successfully
            </p>

            {/* Summary card */}
            <div style={{
              background: colors.bgElevated, border: `1px solid ${colors.border}`,
              borderRadius: 20, padding: "20px 16px", marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>Direction</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  background: isBuy ? colors.greenBg : colors.redBg,
                  color: isBuy ? colors.green : colors.red,
                }}>
                  {isBuy ? "Buy BTC" : "Sell BTC"}
                </span>
              </div>
              {[
                { label: isBuy ? `${currency} Spent` : "BTC Sold", value: isBuy ? `${currencySymbol}${result.fiatAmount.toFixed(2)}` : `${result.btcAmount.toFixed(8)} BTC` },
                { label: isBuy ? "BTC Received" : `${currency} Received`, value: isBuy ? `${result.btcAmount.toFixed(8)} BTC` : `${currencySymbol}${result.fiatAmount.toFixed(2)}` },
                { label: "Fee", value: `${currencySymbol}${result.fee.toFixed(2)}` },
                { label: "Rate", value: `${currencySymbol}${result.rate.toLocaleString()}` },
                { label: "Reference", value: result.reference },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${colors.border}` }}>
                  <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>{row.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/app/dashboard")}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #1A2CCE 0%, #1522A5 100%)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── PIN Screen ──────────────────────────────────────────────────────────────

  if (showPin) {
    return (
      <>
        <UserHeader title="Confirm Swap" showBack />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" }}>
          <div style={{ paddingTop: 32, textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px",
              background: colors.blueBg, border: `1px solid ${colors.blue}26`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Lock style={{ width: 24, height: 24, color: colors.blue }} />
            </div>

            <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Enter PIN</p>
            <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 32px" }}>
              Confirm your {direction === "buy" ? "BTC purchase" : "BTC sale"}
            </p>

            {/* PIN dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: i < pin.length ? colors.blue : colors.bgHover,
                  border: `2px solid ${i < pin.length ? colors.blue : colors.border}`,
                  transition: "all 200ms ease",
                  transform: i < pin.length ? "scale(1.1)" : "scale(1)",
                }} />
              ))}
            </div>

            {/* Error */}
            {error && (
              <p style={{ fontSize: 13, color: colors.red, margin: "12px 0" }}>{error}</p>
            )}

            {submitting && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, margin: "12px 0" }}>
                <Loader2 style={{ width: 18, height: 18, color: colors.blue, animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 13, color: colors.textSecondary }}>Processing swap...</span>
              </div>
            )}

            {/* Keypad */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10, maxWidth: 280, margin: "24px auto 0",
            }}>
              {["1","2","3","4","5","6","7","8","9","","0","back"].map((k) => {
                if (k === "") return <div key="empty" />
                if (k === "back") {
                  return (
                    <button
                      key="back" onClick={removePinDigit}
                      style={{
                        height: 56, borderRadius: 14, border: "none",
                        background: colors.bgElevated, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Delete style={{ width: 20, height: 20, color: colors.textSecondary }} />
                    </button>
                  )
                }
                return (
                  <button
                    key={k} onClick={() => addPinDigit(k)}
                    style={{
                      height: 56, borderRadius: 14, border: "none",
                      background: colors.bgElevated, cursor: "pointer",
                      fontSize: 22, fontWeight: 600, color: colors.textPrimary,
                    }}
                  >
                    {k}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => { setShowPin(false); setPin(""); setError("") }}
              style={{
                marginTop: 20, background: "none", border: "none", color: colors.textTertiary,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── Main Swap Interface ──────────────────────────────────────────────────

  const fromLabel    = direction === "buy" ? currency : "BTC"
  const toLabel      = direction === "buy" ? "BTC" : currency
  const fromBalance  = direction === "buy" ? fiatBalance : btcBalance
  const fromDecimals = direction === "buy" ? 2 : 8
  const outputValue  = direction === "buy"
    ? (btcOutput > 0 ? btcOutput.toFixed(8) : "0.00000000")
    : (fiatOutput > 0 ? fiatOutput.toFixed(2) : "0.00")

  return (
    <>
      <UserHeader title="Swap" showBack />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 120px" }}>

        {/* Live rate banner */}
        <div style={{
          margin: "16px 0 20px",
          background: colors.blueBg,
          border: `1px solid ${colors.blue}1A`,
          borderRadius: 16, padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: "rgba(247,147,26,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14 }}>₿</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, fontWeight: 500 }}>BTC / USD</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, margin: 0, fontFamily: "'SF Mono', 'Fira Code', monospace", whiteSpace: "nowrap" }}>
                {rateLoading ? "..." : `${currencySymbol}${btcRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>
          <button
            onClick={fetchRate}
            disabled={rateLoading}
            style={{
              background: colors.bgElevated, border: `1px solid ${colors.border}`,
              borderRadius: 10, width: 36, height: 36, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <RefreshCcw style={{
              width: 14, height: 14, color: colors.textMuted,
              animation: rateLoading ? "spin 1s linear infinite" : "none",
            }} />
          </button>
        </div>

        {/* Error banner */}
        {error && !showPin && (
          <div style={{
            background: colors.redBg, border: `1px solid ${colors.red}33`,
            borderRadius: 12, padding: "10px 14px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <AlertTriangle style={{ width: 16, height: 16, color: colors.red, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: colors.red }}>{error}</span>
            <X onClick={() => setError("")} style={{ width: 14, height: 14, color: colors.red, opacity: 0.6, marginLeft: "auto", cursor: "pointer" }} />
          </div>
        )}

        {/* Swap Card */}
        <div style={{
          background: colors.bgElevated,
          border: `1px solid ${colors.border}`,
          borderRadius: 24, overflow: "hidden", position: "relative",
        }}>

          {/* FROM section */}
          <div style={{ padding: "20px 20px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>You Pay</span>
              <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>
                Balance: {direction === "buy"
                  ? `${currencySymbol}${fiatBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  : `${btcBalance.toFixed(8)} BTC`
                }
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError("") }}
                placeholder="0.00"
                style={{
                  flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none",
                  fontSize: 32, fontWeight: 700, color: colors.textPrimary, padding: 0,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                }}
              />

              {/* Currency badge */}
              <div style={{
                background: direction === "buy" ? colors.blueBg : "rgba(247,147,26,0.12)",
                border: `1px solid ${direction === "buy" ? `${colors.blue}33` : "rgba(247,147,26,0.2)"}`,
                borderRadius: 12, padding: "8px 14px",
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              }}>
                <span style={{ fontSize: 14 }}>{direction === "buy" ? currencySymbol : "₿"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{fromLabel}</span>
              </div>
            </div>

            {/* Quick amount buttons */}
            <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
              {quickAmounts.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  style={{
                    background: numAmount === v ? colors.blueBg : colors.bgHover,
                    border: `1px solid ${numAmount === v ? colors.blue : colors.border}`,
                    borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                    color: numAmount === v ? colors.blue : colors.textMuted,
                  }}
                >
                  {currencySymbol}{v}
                </button>
              ))}
              <button
                onClick={() => {
                  if (direction === "buy") setAmount(String(fiatBalance))
                  else setAmount(String(Math.floor(btcBalance * btcRate * 100) / 100))
                }}
                style={{
                  background: colors.bgHover, border: `1px solid ${colors.border}`,
                  borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, color: colors.textMuted,
                }}
              >
                Max
              </button>
            </div>
          </div>

          {/* Flip Button */}
          <div style={{
            display: "flex", justifyContent: "center",
            position: "relative", height: 0,
          }}>
            <button
              onClick={flipDirection}
              style={{
                position: "absolute", top: "-20px", zIndex: 2,
                width: 44, height: 44, borderRadius: 14,
                background: "linear-gradient(135deg, #1A2CCE 0%, #1522A5 100%)",
                border: `3px solid ${colors.bgBase}`,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 20px rgba(26,44,206,0.25)",
                transition: "transform 200ms ease",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "rotate(180deg) scale(0.9)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "rotate(180deg) scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
            >
              <ArrowUpDown style={{ width: 18, height: 18, color: "#fff" }} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: colors.border }} />

          {/* TO section */}
          <div style={{ padding: "20px 20px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>You Receive</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <p style={{
                flex: 1, minWidth: 0, fontSize: 32, fontWeight: 700, margin: 0, padding: 0,
                color: numAmount > 0 ? colors.textPrimary : colors.textMuted,
                fontFamily: "'SF Mono', 'Fira Code', monospace", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {numAmount > 0 ? outputValue : "0.00"}
              </p>

              <div style={{
                background: direction === "sell" ? colors.blueBg : "rgba(247,147,26,0.12)",
                border: `1px solid ${direction === "sell" ? `${colors.blue}33` : "rgba(247,147,26,0.2)"}`,
                borderRadius: 12, padding: "8px 14px",
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              }}>
                <span style={{ fontSize: 14 }}>{direction === "sell" ? currencySymbol : "₿"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{toLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rate & Fee breakdown */}
        {numAmount > 0 && btcRate > 0 && (
          <div style={{
            background: colors.bgHover, border: `1px solid ${colors.border}`,
            borderRadius: 16, padding: "14px 16px", marginTop: 12,
          }}>
            {[
              { label: "Exchange Rate", value: `1 BTC = ${currencySymbol}${btcRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
              { label: `Fee (${feePercent}%)`, value: `${currencySymbol}${fee.toFixed(2)}` },
              { label: "You receive", value: direction === "buy" ? `${btcOutput.toFixed(8)} BTC` : `${currencySymbol}${fiatOutput.toFixed(2)}`, highlight: true },
            ].map((row) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", padding: "5px 0",
              }}>
                <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>{row.label}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: row.highlight ? colors.green : colors.textSecondary,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Insufficient balance warning */}
        {numAmount > 0 && !canSwap && (
          <div style={{
            background: colors.redBg, border: `1px solid ${colors.red}1F`,
            borderRadius: 12, padding: "10px 14px", marginTop: 12,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <AlertTriangle style={{ width: 14, height: 14, color: colors.red, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: colors.red }}>
              Insufficient {direction === "buy" ? currency : "BTC"} balance
            </span>
          </div>
        )}

        {/* Swap button */}
        <button
          onClick={() => canSwap && setShowPin(true)}
          disabled={!canSwap}
          style={{
            width: "100%", padding: "16px 0", borderRadius: 16, border: "none", marginTop: 20,
            background: canSwap
              ? "linear-gradient(135deg, #1A2CCE 0%, #1522A5 100%)"
              : colors.bgHover,
            color: canSwap ? "#fff" : colors.textMuted,
            fontSize: 16, fontWeight: 700, cursor: canSwap ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: canSwap ? "0 8px 32px rgba(26,44,206,0.2)" : "none",
            transition: "all 200ms ease",
          }}
        >
          <Shield style={{ width: 16, height: 16 }} />
          {direction === "buy" ? "Buy Bitcoin" : "Sell Bitcoin"}
        </button>

        {/* Security notice */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          marginTop: 14, opacity: 0.5,
        }}>
          <Lock style={{ width: 11, height: 11, color: colors.textMuted }} />
          <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 500 }}>
            Secured by {BANK_NAME} · Instant settlement
          </span>
        </div>
      </div>
    </>
  )
}
