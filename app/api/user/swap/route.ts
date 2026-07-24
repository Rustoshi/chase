import { NextRequest, NextResponse } from "next/server"
import { z }         from "zod"
import mongoose      from "mongoose"
import { auth }      from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import User          from "@/lib/models/User"
import Account       from "@/lib/models/Account"
import Transaction   from "@/lib/models/Transaction"
import AppSettings, { APP_SETTINGS_ID } from "@/lib/models/AppSettings"

const swapSchema = z.object({
  direction: z.enum(["buy", "sell"]), // buy BTC with fiat, or sell BTC for fiat
  amount:    z.number().positive(),   // fiat amount (USD)
  btcRate:   z.number().positive(),
  pin:       z.string().length(4),
})

async function generateRef(prefix: string): Promise<string> {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
    const ref = `${prefix}-${suffix}`
    const exists = await Transaction.findOne({ reference: ref }).lean()
    if (!exists) return ref
  }
  throw new Error("Failed to generate unique reference")
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const parsed = swapSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
    }

    const { direction, amount, btcRate, pin } = parsed.data
    const userId = new mongoose.Types.ObjectId(session.user.id)

    // Verify PIN
    const user = await User.findById(userId).select("transferPin isSuspended").lean() as Record<string, unknown> | null
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (user.isSuspended) return NextResponse.json({ error: "Account suspended" }, { status: 403 })
    if (!user.transferPin) return NextResponse.json({ error: "Transfer PIN not set. Contact support." }, { status: 400 })
    if (String(user.transferPin) !== String(pin)) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 })

    // Get settings
    const settings = await AppSettings.findById(new mongoose.Types.ObjectId(APP_SETTINGS_ID)).lean()
    const feePercent = settings?.swapFeePercent ?? 1.5
    const minAmount  = settings?.swapMinAmount ?? 10
    const maxAmount  = settings?.swapMaxAmount ?? 1000000

    if (amount < minAmount) return NextResponse.json({ error: `Minimum swap amount is $${minAmount}` }, { status: 400 })
    if (amount > maxAmount) return NextResponse.json({ error: `Maximum swap amount is $${maxAmount}` }, { status: 400 })

    // Get accounts
    const fiatAcct = await Account.findOne({ userId, walletType: "fiat" })
    const btcAcct  = await Account.findOne({ userId, walletType: "bitcoin" })
    if (!fiatAcct || !btcAcct) return NextResponse.json({ error: "Accounts not found" }, { status: 404 })
    if (fiatAcct.isFrozen || btcAcct.isFrozen) return NextResponse.json({ error: "Account is frozen" }, { status: 403 })

    // Calculate
    const feeAmount    = Math.round(amount * (feePercent / 100) * 100) / 100  // fiat fee
    const netAmount    = amount - feeAmount // net fiat after fee
    const fiatCents    = Math.round(amount * 100)
    const feeCents     = Math.round(feeAmount * 100)
    const netCents     = fiatCents - feeCents
    const btcSatoshis  = Math.round((netAmount / btcRate) * 1e8)

    const baseRef = await generateRef("SWP")
    const refOut = `${baseRef}-O`
    const refIn  = `${baseRef}-I`

    if (direction === "buy") {
      // Buy BTC: deduct fiat, credit BTC
      // Balance is stored in cents in database
      console.log("[Swap Buy] Balance check:", {
        balanceCents: fiatAcct.balance,
        balanceDollars: fiatAcct.balance / 100,
        amountCents: fiatCents,
        amountDollars: amount,
        sufficient: fiatAcct.balance >= fiatCents
      })
      if (fiatAcct.balance < fiatCents) {
        return NextResponse.json({ 
          error: `Insufficient USD balance. Available: $${(fiatAcct.balance / 100).toFixed(2)}, Required: $${amount.toFixed(2)}` 
        }, { status: 400 })
      }

      const fiatBefore = fiatAcct.balance
      const btcBefore  = btcAcct.btcBalance

      fiatAcct.balance   -= fiatCents
      btcAcct.btcBalance += btcSatoshis
      await fiatAcct.save()
      await btcAcct.save()

      // Create swap_out (fiat) and swap_in (btc) transactions
      await Transaction.create({
        accountId: fiatAcct._id, userId, type: "swap_out",
        amount: fiatCents, currency: fiatAcct.currency, status: "completed",
        description: `Swap: Bought ${(btcSatoshis / 1e8).toFixed(8)} BTC`,
        reference: refOut, toAccountId: btcAcct._id, swapFromWallet: "fiat", swapToWallet: "bitcoin",
        btcRateAtTime: btcRate, feeAmount: feeCents, feePercent,
        exchangeRate: btcRate, convertedAmount: btcSatoshis, convertedCurrency: "BTC",
        processedAt: new Date(),
      })

      await Transaction.create({
        accountId: btcAcct._id, userId, type: "swap_in",
        amount: btcSatoshis, currency: "BTC", status: "completed",
        description: `Swap: Bought ${(btcSatoshis / 1e8).toFixed(8)} BTC for $${amount.toFixed(2)}`,
        reference: refIn, fromAccountId: fiatAcct._id, swapFromWallet: "fiat", swapToWallet: "bitcoin",
        btcRateAtTime: btcRate, feeAmount: feeCents, feePercent,
        exchangeRate: btcRate, convertedAmount: fiatCents, convertedCurrency: fiatAcct.currency,
        processedAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        direction: "buy",
        fiatAmount: amount,
        btcAmount: btcSatoshis / 1e8,
        fee: feeAmount,
        rate: btcRate,
        reference: baseRef,
      })

    } else {
      // Sell BTC: deduct BTC, credit fiat
      console.log("[Swap Sell] Balance check:", {
        btcBalanceSatoshis: btcAcct.btcBalance,
        btcBalanceBtc: btcAcct.btcBalance / 1e8,
        requiredSatoshis: btcSatoshis,
        requiredBtc: btcSatoshis / 1e8,
        sufficient: btcAcct.btcBalance >= btcSatoshis
      })
      if (btcAcct.btcBalance < btcSatoshis) {
        return NextResponse.json({
          error: `Insufficient BTC balance. Available: ${(btcAcct.btcBalance / 1e8).toFixed(8)} BTC, Required: ${(btcSatoshis / 1e8).toFixed(8)} BTC`
        }, { status: 400 })
      }

      // For sell: amount is fiat they want to receive (before fee)
      // BTC deducted = amount / btcRate (in satoshis)
      const sellBtcSats   = Math.round((amount / btcRate) * 1e8)
      const sellFiatCents = Math.round((amount - feeAmount) * 100) // net fiat credited

      if (btcAcct.btcBalance < sellBtcSats) {
        return NextResponse.json({ error: "Insufficient BTC balance" }, { status: 400 })
      }

      btcAcct.btcBalance -= sellBtcSats
      fiatAcct.balance   += sellFiatCents
      await btcAcct.save()
      await fiatAcct.save()

      await Transaction.create({
        accountId: btcAcct._id, userId, type: "swap_out",
        amount: sellBtcSats, currency: "BTC", status: "completed",
        description: `Swap: Sold ${(sellBtcSats / 1e8).toFixed(8)} BTC for $${(sellFiatCents / 100).toFixed(2)}`,
        reference: refOut, toAccountId: fiatAcct._id, swapFromWallet: "bitcoin", swapToWallet: "fiat",
        btcRateAtTime: btcRate, feeAmount: feeCents, feePercent,
        exchangeRate: btcRate, convertedAmount: sellFiatCents, convertedCurrency: fiatAcct.currency,
        processedAt: new Date(),
      })

      await Transaction.create({
        accountId: fiatAcct._id, userId, type: "swap_in",
        amount: sellFiatCents, currency: fiatAcct.currency, status: "completed",
        description: `Swap: Received $${(sellFiatCents / 100).toFixed(2)} from ${(sellBtcSats / 1e8).toFixed(8)} BTC`,
        reference: refIn, fromAccountId: btcAcct._id, swapFromWallet: "bitcoin", swapToWallet: "fiat",
        btcRateAtTime: btcRate, feeAmount: feeCents, feePercent,
        exchangeRate: btcRate, convertedAmount: sellBtcSats, convertedCurrency: "BTC",
        processedAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        direction: "sell",
        fiatAmount: sellFiatCents / 100,
        btcAmount: sellBtcSats / 1e8,
        fee: feeAmount,
        rate: btcRate,
        reference: baseRef,
      })
    }
  } catch (err) {
    console.error("[Swap API]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
