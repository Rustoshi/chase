"use client"

import { useState, useEffect, useRef } from "react"
import { Lock, Eye, EyeOff } from "lucide-react"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"
import { BANK_NAME } from "@/lib/brand"

interface AccountData {
  _id:           string
  walletType:    "fiat" | "bitcoin"
  accountNumber: string
  currency:      string
  balance:       number
  btcAddress?:   string
  btcBalance:    number
  isFrozen:      boolean
}

interface WalletCardProps {
  account:     AccountData
  btcUsdRate?: number
  onTap?:      () => void
  userName?:   string
}

function useCardCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(target * eased)
      if (p < 1) requestAnimationFrame(tick)
      else setVal(target)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return val
}

export function WalletCard({ account, btcUsdRate, onTap, userName }: WalletCardProps) {
  const { symbol: currencySymbol, formatAmount } = useCurrency()
  const isBtc = account.walletType === "bitcoin"
  const rawBalance = isBtc ? account.btcBalance : account.balance
  const animated = useCardCountUp(rawBalance)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setHidden(localStorage.getItem("nova_privacy") === "1")
  }, [])

  const togglePrivacy = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !hidden
    setHidden(next)
    localStorage.setItem("nova_privacy", next ? "1" : "0")
  }

  const formattedBalance = isBtc
    ? animated.toFixed(8)
    : animated.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const last4 = account.accountNumber.slice(-4)
  const usdEquiv = isBtc && btcUsdRate
    ? (account.btcBalance * btcUsdRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null

  const gradient = isBtc
    ? "linear-gradient(135deg, #F7931A 0%, #B5670F 50%, #3d1a00 100%)"
    : "linear-gradient(135deg, #2A3BD4 0%, #1A2CCE 45%, #101828 100%)"

  const glow1 = isBtc ? "rgba(247,144,9,0.25)" : "rgba(26,44,206,0.2)"
  const glow2 = isBtc ? "rgba(251,191,36,0.12)" : "rgba(18,183,106,0.15)"

  // Only render an outer <button> when the card is actually tappable — otherwise
  // the inner privacy-toggle button would be nested inside a button (invalid HTML).
  const interactive = typeof onTap === "function"
  const Wrapper: React.ElementType = interactive ? "button" : "div"

  return (
    <Wrapper
      {...(interactive ? { type: "button", onClick: onTap } : {})}
      className={`wallet-shimmer relative w-full overflow-hidden text-left text-white${interactive ? " transition-transform active:scale-[0.98]" : ""}`}
      style={{
        background: gradient,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.1)",
        minHeight: 190,
        padding: "20px 20px 16px",
      }}
    >
      {/* Glow circles */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 180, height: 180,
          top: -40, right: -40,
          background: glow1,
          filter: "blur(40px)",
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 120, height: 120,
          bottom: -30, left: -30,
          background: glow2,
          filter: "blur(30px)",
        }}
      />

      {/* Top row */}
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.8)" }}>
            {isBtc ? "BITCOIN WALLET" : BANK_NAME.toUpperCase()}
          </p>
          {userName && (
            <p className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              {userName}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
            {isBtc ? "Crypto Account" : "Fiat Account"}
          </p>
          <p className="text-[12px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
            {isBtc ? "₿ BTC" : `**** ${last4}`}
          </p>
        </div>
      </div>

      {/* Balance */}
      <div className="relative mt-5">
        <p className="text-[12px] font-medium uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.5)" }}>
          {isBtc ? "Bitcoin Balance" : "Available Balance"}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-[36px] font-bold tabular-nums leading-none" style={{
            opacity: account.isFrozen ? 0.5 : 1,
            textDecoration: account.isFrozen ? "line-through" : "none",
          }}>
            {hidden ? "••••••" : isBtc ? `${formattedBalance}` : `${currencySymbol}${formattedBalance}`}
          </p>
          <button
            onClick={togglePrivacy}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            {hidden
              ? <EyeOff className="h-4 w-4" style={{ color: "rgba(255,255,255,0.6)" }} />
              : <Eye className="h-4 w-4" style={{ color: "rgba(255,255,255,0.6)" }} />
            }
          </button>
        </div>
        {usdEquiv && !hidden && (
          <p className="mt-1 text-[14px] tabular-nums" style={{ color: "rgba(255,255,255,0.6)" }}>
            ≈ {currencySymbol}{usdEquiv}
          </p>
        )}
      </div>

      {/* Bottom row */}
      <div className="relative mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-[6px] w-[6px] rounded-full" style={{ background: account.isFrozen ? "#F04438" : "#12B76A" }} />
          <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.8)" }}>
            {account.isFrozen ? "Frozen" : "Active"}
          </span>
        </div>
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          {isBtc && btcUsdRate
            ? `1 BTC = ${formatAmount(btcUsdRate)}`
            : `Last updated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          }
        </span>
      </div>

      {/* Frozen overlay */}
      {account.isFrozen && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.55)", borderRadius: 20 }}>
          <Lock className="h-7 w-7 mb-1" style={{ color: "rgba(255,255,255,0.8)" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.9)" }}>Frozen</span>
        </div>
      )}
    </Wrapper>
  )
}
