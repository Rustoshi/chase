import { NextResponse } from "next/server"
import mongoose, { Model, Schema } from "mongoose"
import { connectDB } from "@/lib/db/connection"
import AppSettings from "@/lib/models/AppSettings"

// ── Inline FxRate model (lightweight, no separate file needed) ────────────────

interface IFxRate {
  baseCurrency: string
  rates:        Record<string, number>
  fetchedAt:    Date
}

const FxRateSchema = new Schema<IFxRate>({
  baseCurrency: { type: String, required: true, unique: true },
  rates:        { type: Schema.Types.Mixed, default: {} },
  fetchedAt:    { type: Date, default: () => new Date() },
})

const FxRate: Model<IFxRate> =
  (mongoose.models.FxRate as Model<IFxRate>) ??
  mongoose.model<IFxRate>("FxRate", FxRateSchema)

// ── Handler ───────────────────────────────────────────────────────────────────

const CACHE_TTL = 60_000 // 60 seconds

export async function GET(request: Request) {
  try {
    await connectDB()

    // Get platform default currency and fallback rate
    const settings = await AppSettings.findOne({})
    // An optional ?currency=XXX param overrides the platform default so callers
    // (e.g. a user sending BTC) can get the rate in their preferred currency.
    const requestedCurrency = new URL(request.url).searchParams.get("currency")
    const defaultCurrency = (requestedCurrency || settings?.defaultCurrency || "USD").toUpperCase()
    const currencyCode = defaultCurrency.toLowerCase()
    const fallbackRate = settings?.fallbackBtcRate || 65000

    const existing = await FxRate.findOne({ baseCurrency: "BTC" })

    // Check if cache is fresh and has the requested currency
    if (existing && Date.now() - existing.fetchedAt.getTime() < CACHE_TTL && existing.rates[defaultCurrency]) {
      const cachedRate = existing.rates[defaultCurrency]
      return NextResponse.json({
        usd: cachedRate,
        currency: defaultCurrency,
        fetchedAt: existing.fetchedAt.toISOString(),
      })
    }

    // Fetch fresh price from CoinGecko in the configured currency
    let price = existing?.rates?.[defaultCurrency] || fallbackRate

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currencyCode}`,
        { next: { revalidate: 0 } }
      )

      if (res.ok) {
        const json = await res.json()
        const coinGeckoPrice = json?.bitcoin?.[currencyCode]
        if (coinGeckoPrice && coinGeckoPrice > 0) {
          price = coinGeckoPrice
        } else {
          console.warn("[BTC Rate] CoinGecko returned invalid price, using fallback:", fallbackRate)
          price = fallbackRate
        }
      } else {
        console.warn("[BTC Rate] CoinGecko fetch failed, using fallback:", fallbackRate)
        price = fallbackRate
      }
    } catch (err) {
      // CoinGecko unreachable — use fallback
      console.warn("[BTC Rate] CoinGecko unreachable, using fallback:", fallbackRate)
      price = fallbackRate
    }

    const now = new Date()

    // Upsert with the currency rate
    const rates = existing?.rates || {}
    rates[defaultCurrency] = price

    await FxRate.findOneAndUpdate(
      { baseCurrency: "BTC" },
      { rates, fetchedAt: now },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      usd: price,
      currency: defaultCurrency,
      fetchedAt: now.toISOString(),
    })
  } catch (err) {
    console.error("[BTC Rate API]", err)
    // Return fallback rate even on error
    const settings = await AppSettings.findOne({})
    const fallbackRate = settings?.fallbackBtcRate || 65000
    return NextResponse.json({ 
      usd: fallbackRate, 
      currency: settings?.defaultCurrency || "USD", 
      fetchedAt: new Date().toISOString() 
    }, { status: 200 })
  }
}
