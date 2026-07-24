import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import CardApplication from "@/lib/models/CardApplication"
import CardTransaction from "@/lib/models/CardTransaction"
import Account from "@/lib/models/Account"
import Transaction from "@/lib/models/Transaction"

async function generateTxRef(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let ref = "PAY"
  for (let i = 0; i < 12; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  const exists = await Transaction.exists({ reference: ref })
  return exists ? generateTxRef() : ref
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { cardId } = await params
    const body = await req.json()
    const { amount } = body

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 })
    }

    await connectDB()

    // Find the card
    const card = await CardApplication.findOne({
      _id: cardId,
      userId: session.user.id,
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    if (card.cardType !== "credit") {
      return NextResponse.json({ error: "Only credit cards have a balance to pay" }, { status: 400 })
    }

    if (card.status !== "active") {
      return NextResponse.json({ error: "Card is not active" }, { status: 400 })
    }

    if (card.balance <= 0) {
      return NextResponse.json({ error: "No balance to pay" }, { status: 400 })
    }

    // Calculate actual payment (can't pay more than owed)
    const paymentAmount = Math.min(amount, card.balance)
    const paymentCents = Math.round(paymentAmount * 100)

    // Find user's fiat account
    const fiatAccount = await Account.findOne({
      userId: session.user.id,
      walletType: "fiat",
    })

    if (!fiatAccount) {
      return NextResponse.json({ error: "No account found" }, { status: 400 })
    }

    if (fiatAccount.balance < paymentCents) {
      return NextResponse.json({ 
        error: `Insufficient balance. You have $${(fiatAccount.balance / 100).toFixed(2)} available.` 
      }, { status: 400 })
    }

    // Start transaction
    const dbSession = await mongoose.startSession()
    try {
      dbSession.startTransaction()

      // Deduct from fiat account
      await Account.findByIdAndUpdate(
        fiatAccount._id,
        { $inc: { balance: -paymentCents } },
        { session: dbSession }
      )

      // Reduce card balance
      await CardApplication.findByIdAndUpdate(
        card._id,
        { $inc: { balance: -paymentCents } },
        { session: dbSession }
      )

      // Create transaction record
      const reference = await generateTxRef()
      const last4 = card.cardNumber?.slice(-4) || "****"
      
      await Transaction.create([{
        accountId: fiatAccount._id,
        userId: session.user.id,
        type: "card_payment",
        amount: paymentCents,
        currency: fiatAccount.currency,
        status: "completed",
        description: `Credit card payment — Card ending in ${last4}`,
        reference,
        metadata: {
          cardId: card._id.toString(),
          cardLast4: last4,
        },
      }], { session: dbSession })

      // Create card transaction record (shows as credit/payment on card history)
      await CardTransaction.create([{
        cardId: card._id,
        userId: session.user.id,
        type: "payment",
        amount: paymentCents,
        currency: fiatAccount.currency,
        status: "completed",
        description: `Payment received — Thank you`,
        reference,
      }], { session: dbSession })

      await dbSession.commitTransaction()

      // Get updated balances
      const updatedCard = await CardApplication.findById(card._id)
      const updatedAccount = await Account.findById(fiatAccount._id)

      return NextResponse.json({
        success: true,
        paymentAmount,
        newCardBalance: (updatedCard?.balance || 0) / 100,
        newAccountBalance: (updatedAccount?.balance || 0) / 100,
        reference,
      })
    } catch (err) {
      await dbSession.abortTransaction()
      throw err
    } finally {
      dbSession.endSession()
    }
  } catch (err) {
    console.error("[POST /api/user/cards/[cardId]/pay]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment failed" },
      { status: 500 }
    )
  }
}
