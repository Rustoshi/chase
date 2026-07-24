"use client"

import { useState, useEffect, useRef } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface BalanceDisplayProps {
  amount:    number
  currency:  string
  size?:     "sm" | "md" | "lg"
  blur?:     boolean
}

const SIZE_MAP = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-[40px]",
} as const

// Currencies where symbol goes before the amount
const PREFIX_CURRENCIES: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥",
  CAD: "C$", AUD: "A$", HKD: "HK$", SGD: "S$",
}

// Currencies where symbol goes after the amount
const SUFFIX_CURRENCIES: Record<string, string> = {
  BTC: "BTC", ETH: "ETH", SEK: "kr", NOK: "kr", DKK: "kr",
  PLN: "zł", CZK: "Kč", TRY: "₺", BRL: "R$",
}

function formatAmount(amount: number, currency: string): string {
  const isCrypto = currency === "BTC" || currency === "ETH"
  const decimals = isCrypto ? 8 : 2

  return amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function getCurrencyParts(currency: string): { prefix: string; suffix: string } {
  if (PREFIX_CURRENCIES[currency]) return { prefix: PREFIX_CURRENCIES[currency], suffix: "" }
  if (SUFFIX_CURRENCIES[currency]) return { prefix: "", suffix: " " + SUFFIX_CURRENCIES[currency] }
  return { prefix: "", suffix: " " + currency }
}

function useCountUp(target: number, duration: number = 800): number {
  const [value, setValue] = useState(0)
  const prevTarget = useRef(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const start = prevTarget.current
    const diff = target - start
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(start + diff * eased)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        prevTarget.current = target
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration])

  return value
}

function usePrivacyMode() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("novapay_privacy_mode")
      if (stored === "true") setHidden(true)
    } catch { /* */ }
  }, [])

  const toggle = () => {
    setHidden((prev) => {
      const next = !prev
      try { localStorage.setItem("novapay_privacy_mode", String(next)) } catch { /* */ }
      return next
    })
  }

  return { hidden, toggle }
}

export function BalanceDisplay({ amount, currency, size = "md", blur: initialBlur }: BalanceDisplayProps) {
  const { hidden, toggle } = usePrivacyMode()
  const isHidden = initialBlur !== undefined ? initialBlur : hidden
  const animated = useCountUp(amount)
  const { prefix, suffix } = getCurrencyParts(currency)

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-baseline gap-0.5 font-bold tabular-nums tracking-tight transition-all",
          SIZE_MAP[size]
        )}
        style={{ color: "#101828" }}
      >
        {isHidden ? (
          <span className="select-none">
            {prefix}••••••{suffix}
          </span>
        ) : (
          <>
            {prefix && <span style={{ opacity: 0.5 }}>{prefix}</span>}
            <span>{formatAmount(animated, currency)}</span>
            {suffix && <span className="text-[0.6em] ml-1" style={{ opacity: 0.5 }}>{suffix}</span>}
          </>
        )}
      </span>

      <button
        type="button"
        onClick={toggle}
        className="flex-shrink-0 p-1 transition-colors"
        aria-label={isHidden ? "Show balance" : "Hide balance"}
      >
        {isHidden ? (
          <EyeOff className="h-[18px] w-[18px]" style={{ color: "#98A2B3" }} />
        ) : (
          <Eye className="h-[18px] w-[18px]" style={{ color: "#1A2CCE" }} />
        )}
      </button>
    </span>
  )
}
