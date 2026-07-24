import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import Beneficiary from "@/lib/models/Beneficiary"

type Ctx = { params: Promise<{ id: string }> }

// GET: Get a single beneficiary
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid beneficiary ID" }, { status: 400 })
    }

    await connectDB()

    const beneficiary = await Beneficiary.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(session.user.id),
      isActive: true,
    }).lean()

    if (!beneficiary) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 })
    }

    return NextResponse.json({
      beneficiary: {
        id: String(beneficiary._id),
        type: beneficiary.type,
        nickname: beneficiary.nickname,
        accountNumber: beneficiary.accountNumber,
        recipientName: beneficiary.recipientName,
        bankName: beneficiary.bankName,
        iban: beneficiary.iban,
        swiftCode: beneficiary.swiftCode,
        routingNumber: beneficiary.routingNumber,
        bankAddress: beneficiary.bankAddress,
        country: beneficiary.country,
        currency: beneficiary.currency,
        lastUsedAt: beneficiary.lastUsedAt?.toISOString() || null,
        transferCount: beneficiary.transferCount,
        createdAt: beneficiary.createdAt.toISOString(),
      },
    })
  } catch (err) {
    console.error("[GET /api/user/beneficiaries/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Soft delete a beneficiary
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid beneficiary ID" }, { status: 400 })
    }

    await connectDB()

    const result = await Beneficiary.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(session.user.id),
      },
      { isActive: false },
      { new: true }
    )

    if (!result) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Beneficiary deleted successfully" })
  } catch (err) {
    console.error("[DELETE /api/user/beneficiaries/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH: Update last used timestamp (called after successful transfer)
export async function PATCH(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid beneficiary ID" }, { status: 400 })
    }

    await connectDB()

    const result = await Beneficiary.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(session.user.id),
        isActive: true,
      },
      {
        lastUsedAt: new Date(),
        $inc: { transferCount: 1 },
      },
      { new: true }
    )

    if (!result) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Beneficiary updated" })
  } catch (err) {
    console.error("[PATCH /api/user/beneficiaries/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
