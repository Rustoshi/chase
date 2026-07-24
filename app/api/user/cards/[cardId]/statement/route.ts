import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import CardApplication from "@/lib/models/CardApplication"
import CardTransaction from "@/lib/models/CardTransaction"
import User from "@/lib/models/User"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { cardId } = await params
    const { searchParams } = new URL(req.url)
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))

    await connectDB()

    // Verify card belongs to user
    const [card, user] = await Promise.all([
      CardApplication.findOne({
        _id: cardId,
        userId: session.user.id,
      }).lean(),
      User.findById(session.user.id).select("firstName lastName email").lean(),
    ])

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    // Get transactions for the specified month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const transactions = await CardTransaction.find({
      cardId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .lean()

    const cardData = card as Record<string, unknown>
    const userData = user as Record<string, unknown>

    // Calculate totals
    let totalSpent = 0
    let totalPayments = 0
    let totalRefunds = 0

    transactions.forEach((tx: Record<string, unknown>) => {
      const amount = (tx.amount as number) / 100
      switch (tx.type) {
        case "purchase":
        case "fee":
          totalSpent += amount
          break
        case "payment":
          totalPayments += amount
          break
        case "refund":
        case "cashback":
          totalRefunds += amount
          break
      }
    })

    const serializedTx = transactions.map((tx: Record<string, unknown>) => ({
      id: String(tx._id),
      type: tx.type,
      amount: (tx.amount as number) / 100,
      currency: tx.currency || "USD",
      status: tx.status,
      merchantName: tx.merchantName || null,
      description: tx.description,
      reference: tx.reference,
      date: tx.createdAt,
    }))

    return NextResponse.json({
      statement: {
        period: {
          month,
          year,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        card: {
          last4: (cardData.cardNumber as string)?.slice(-4) || "****",
          cardType: cardData.cardType,
          cardNetwork: cardData.cardNetwork || "visa",
          creditLimit: cardData.creditLimit || 0,
          currentBalance: (cardData.balance as number || 0) / 100,
        },
        account: {
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
        },
        summary: {
          totalSpent,
          totalPayments,
          totalRefunds,
          netActivity: totalSpent - totalPayments - totalRefunds,
          transactionCount: transactions.length,
        },
        transactions: serializedTx,
      },
    })
  } catch (err) {
    console.error("[GET /api/user/cards/[cardId]/statement]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate statement" },
      { status: 500 }
    )
  }
}
