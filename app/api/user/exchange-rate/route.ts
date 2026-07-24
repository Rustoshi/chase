import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Static rates for demo — in production these would come from an external API
const RATES: Record<string, Record<string, number>> = {
  USD: { EUR: 0.92, GBP: 0.79, JPY: 149.50, CAD: 1.36, AUD: 1.53, CHF: 0.88, BTC: 0.000015, NGN: 1550 },
  EUR: { USD: 1.087, GBP: 0.859, JPY: 162.60, CAD: 1.48, AUD: 1.66, CHF: 0.957, BTC: 0.0000163, NGN: 1685 },
  GBP: { USD: 1.265, EUR: 1.164, JPY: 189.20, CAD: 1.72, AUD: 1.93, CHF: 1.113, BTC: 0.000019, NGN: 1960 },
  BTC: { USD: 66700, EUR: 61340, GBP: 52750, JPY: 9972150, CAD: 90712, AUD: 102051, CHF: 58696, NGN: 103385000 },
  NGN: { USD: 0.000645, EUR: 0.000594, GBP: 0.000510, BTC: 0.00000000968, JPY: 0.0964, CAD: 0.000877, AUD: 0.000987 },
}

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "BTC", name: "Bitcoin", symbol: "₿", flag: "₿" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
]

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    return NextResponse.json({ rates: RATES, currencies: CURRENCIES })
  } catch (err) {
    console.error("[GET /api/user/exchange-rate]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
