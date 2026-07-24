import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import CardApplication from "@/lib/models/CardApplication"
import CardTransaction from "@/lib/models/CardTransaction"

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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    await connectDB()

    // Verify card belongs to user
    const card = await CardApplication.findOne({
      _id: cardId,
      userId: session.user.id,
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    const [transactions, total] = await Promise.all([
      CardTransaction.find({ cardId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CardTransaction.countDocuments({ cardId }),
    ])

    const serialized = transactions.map((tx: Record<string, unknown>) => ({
      id: String(tx._id),
      type: tx.type,
      amount: (tx.amount as number) / 100,
      currency: tx.currency || "USD",
      status: tx.status,
      merchantName: tx.merchantName || null,
      merchantCategory: tx.merchantCategory || null,
      description: tx.description,
      reference: tx.reference,
      createdAt: tx.createdAt,
    }))

    return NextResponse.json({
      transactions: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error("[GET /api/user/cards/[cardId]/transactions]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}
