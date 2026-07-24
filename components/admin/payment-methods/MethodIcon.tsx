import { Building2, Coins, Gift } from "lucide-react"
import type { PaymentMethodType } from "@/lib/models/PaymentMethod"

interface Props {
  type: PaymentMethodType
  name: string
  size?: "sm" | "md" | "lg"
}

const SIZE_PX: Record<string, number> = { sm: 24, md: 40, lg: 56 }

const FONT: Record<string, string> = { sm: "text-xs", md: "text-sm font-semibold", lg: "text-base font-bold" }

interface TypeConfig {
  bg:   string
  text: string
  label: string | null
  icon?: "building" | "coin" | "gift"
}

const TYPE_CONFIG: Record<PaymentMethodType, TypeConfig> = {
  bank_transfer: { bg: "bg-indigo-600",    text: "text-white",  label: null, icon: "building" },
  paypal:        { bg: "bg-indigo-500",    text: "text-white",  label: "PP"  },
  bitcoin:       { bg: "bg-amber-500",   text: "text-white",  label: "BTC" },
  venmo:         { bg: "bg-teal-500",    text: "text-white",  label: "V"   },
  cash_app:      { bg: "bg-emerald-600", text: "text-white",  label: "$"   },
  zelle:         { bg: "bg-purple-600",  text: "text-white",  label: "Z"   },
  wire:          { bg: "bg-[#1A2CCE]",   text: "text-white",  label: "W"   },
  crypto_other:  { bg: "bg-orange-500",  text: "text-white",  label: null, icon: "coin" },
  giftcard:      { bg: "bg-pink-500",    text: "text-white",  label: null, icon: "gift" },
}

export function MethodIcon({ type, name, size = "md" }: Props) {
  const px     = SIZE_PX[size]
  const config = TYPE_CONFIG[type]
  const font   = FONT[size]

  const fallback = name.slice(0, 2).toUpperCase()

  return (
    <div
      className={`flex-shrink-0 rounded-lg flex items-center justify-center ${config.bg} ${config.text} ${font}`}
      style={{ width: px, height: px }}
    >
      {config.icon === "building" ? (
        <Building2 style={{ width: px * 0.5, height: px * 0.5 }} />
      ) : config.icon === "coin" ? (
        <Coins style={{ width: px * 0.5, height: px * 0.5 }} />
      ) : config.icon === "gift" ? (
        <Gift style={{ width: px * 0.5, height: px * 0.5 }} />
      ) : (
        <span>{config.label ?? fallback}</span>
      )}
    </div>
  )
}
