import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import CardApplication from "@/lib/models/CardApplication"
import Account from "@/lib/models/Account"
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
    await connectDB()

    const [card, user, fiatAccount] = await Promise.all([
      CardApplication.findOne({
        _id: cardId,
        userId: session.user.id,
      }).lean(),
      User.findById(session.user.id).select("firstName lastName email phone").lean(),
      Account.findOne({ userId: session.user.id, walletType: "fiat" }).select("balance currency").lean(),
    ])

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    const cardData = card as Record<string, unknown>
    const userData = user as Record<string, unknown>

    return NextResponse.json({
      card: {
        id: String(cardData._id),
        cardNetwork: cardData.cardNetwork || "visa",
        cardType: cardData.cardType,
        status: cardData.status,
        cardNumber: cardData.cardNumber || null,
        cvv: cardData.cvv || null,
        expiryMonth: cardData.expiryMonth || null,
        expiryYear: cardData.expiryYear || null,
        cardholderName: cardData.cardholderName || null,
        cardPin: cardData.cardPin || null,
        isVirtual: cardData.isVirtual ?? true,
        creditLimit: cardData.creditLimit || 0,
        spendingLimit: cardData.spendingLimit || 0,
        dailySpendLimit: cardData.dailySpendLimit || 0,
        balance: (cardData.balance as number || 0) / 100,
        billingAddress: cardData.billingAddress || null,
        deliveryStatus: cardData.deliveryStatus || null,
        appliedAt: cardData.appliedAt,
        approvedAt: cardData.approvedAt || null,
        adminNote: cardData.adminNote || null,
      },
      user: {
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        phone: userData.phone || null,
      },
      accountBalance: fiatAccount ? ((fiatAccount as Record<string, unknown>).balance as number) / 100 : 0,
      currency: fiatAccount ? ((fiatAccount as Record<string, unknown>).currency as string) || "USD" : "USD",
    })
  } catch (err) {
    console.error("[GET /api/user/cards/[cardId]]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch card" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const { action, spendingLimit, dailySpendLimit, newPin } = body

    await connectDB()

    const card = await CardApplication.findOne({
      _id: cardId,
      userId: session.user.id,
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    // Handle different actions
    switch (action) {
      case "freeze":
        if (card.status !== "active") {
          return NextResponse.json({ error: "Only active cards can be frozen" }, { status: 400 })
        }
        card.status = "frozen"
        await card.save()
        return NextResponse.json({ success: true, status: "frozen" })

      case "unfreeze":
        if (card.status !== "frozen") {
          return NextResponse.json({ error: "Only frozen cards can be unfrozen" }, { status: 400 })
        }
        card.status = "active"
        await card.save()
        return NextResponse.json({ success: true, status: "active" })

      case "update_limits":
        if (spendingLimit !== undefined) {
          card.spendingLimit = spendingLimit
        }
        if (dailySpendLimit !== undefined) {
          card.dailySpendLimit = dailySpendLimit
        }
        await card.save()
        return NextResponse.json({
          success: true,
          spendingLimit: card.spendingLimit,
          dailySpendLimit: card.dailySpendLimit,
        })

      case "change_pin":
        if (typeof newPin !== "string" || !/^\d{4}$/.test(newPin)) {
          return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 })
        }
        if (!["active", "frozen"].includes(card.status)) {
          return NextResponse.json({ error: "PIN can only be changed on an active card" }, { status: 400 })
        }
        card.cardPin = newPin
        await card.save()
        return NextResponse.json({ success: true, cardPin: newPin })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (err) {
    console.error("[PATCH /api/user/cards/[cardId]]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Action failed" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { cardId } = await params
    await connectDB()

    const card = await CardApplication.findOne({
      _id: cardId,
      userId: session.user.id,
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    // A blocked card is under an admin hold — the user cannot cancel it themselves
    if (card.status === "blocked") {
      return NextResponse.json({
        error: "This card has been blocked by an administrator. Please contact support.",
      }, { status: 403 })
    }

    // Check if card has outstanding balance (for credit cards)
    if (card.cardType === "credit" && card.balance > 0) {
      return NextResponse.json({ 
        error: "Cannot delete card with outstanding balance. Please pay off the balance first." 
      }, { status: 400 })
    }

    // Mark as cancelled instead of deleting
    card.status = "cancelled"
    card.cancelledAt = new Date()
    await card.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/user/cards/[cardId]]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete card" },
      { status: 500 }
    )
  }
}
