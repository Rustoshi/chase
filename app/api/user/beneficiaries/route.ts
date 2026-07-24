import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import mongoose from "mongoose"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import Beneficiary from "@/lib/models/Beneficiary"

// Schema for creating a beneficiary
const createSchema = z.object({
  type: z.enum(["local", "international"]),
  nickname: z.string().min(1).max(100),
  // Local fields
  accountNumber: z.string().optional(),
  recipientName: z.string().optional(),
  bankName: z.string().optional(),
  // International fields
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  routingNumber: z.string().optional(),
  bankAddress: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
})

// GET: List user's beneficiaries
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") // "local" | "international" | null (all)

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(session.user.id),
      isActive: true,
    }

    if (type && (type === "local" || type === "international")) {
      filter.type = type
    }

    const beneficiaries = await Beneficiary.find(filter)
      .sort({ lastUsedAt: -1, createdAt: -1 })
      .limit(50)
      .lean()

    const serialized = beneficiaries.map((b) => ({
      id: String(b._id),
      type: b.type,
      nickname: b.nickname,
      accountNumber: b.accountNumber,
      recipientName: b.recipientName,
      bankName: b.bankName,
      iban: b.iban,
      swiftCode: b.swiftCode,
      routingNumber: b.routingNumber,
      bankAddress: b.bankAddress,
      country: b.country,
      currency: b.currency,
      lastUsedAt: b.lastUsedAt?.toISOString() || null,
      transferCount: b.transferCount,
      createdAt: b.createdAt.toISOString(),
    }))

    return NextResponse.json({ beneficiaries: serialized })
  } catch (err) {
    console.error("[GET /api/user/beneficiaries]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Create a new beneficiary
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const data = parsed.data

    // Validate required fields based on type
    if (data.type === "local") {
      if (!data.accountNumber || !data.recipientName) {
        return NextResponse.json(
          { error: "Account number and recipient name are required for local transfers" },
          { status: 400 }
        )
      }
    } else if (data.type === "international") {
      if (!data.recipientName || !data.bankName) {
        return NextResponse.json(
          { error: "Recipient name and bank name are required for international transfers" },
          { status: 400 }
        )
      }
      // Need either account number or IBAN
      if (!data.accountNumber && !data.iban) {
        return NextResponse.json(
          { error: "Account number or IBAN is required for international transfers" },
          { status: 400 }
        )
      }
    }

    await connectDB()

    // Check for duplicate nickname
    const existing = await Beneficiary.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
      nickname: data.nickname,
    })

    if (existing) {
      return NextResponse.json(
        { error: "A beneficiary with this nickname already exists" },
        { status: 409 }
      )
    }

    const beneficiary = await Beneficiary.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      type: data.type,
      nickname: data.nickname,
      accountNumber: data.accountNumber,
      recipientName: data.recipientName,
      bankName: data.bankName,
      iban: data.iban,
      swiftCode: data.swiftCode,
      routingNumber: data.routingNumber,
      bankAddress: data.bankAddress,
      country: data.country,
      currency: data.currency || "USD",
    })

    return NextResponse.json({
      id: String(beneficiary._id),
      message: "Beneficiary saved successfully",
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/user/beneficiaries]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
