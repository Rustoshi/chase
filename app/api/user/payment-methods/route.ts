import { NextResponse } from "next/server"
import { auth }        from "@/lib/auth"
import { connectDB }   from "@/lib/db/connection"
import PaymentMethod   from "@/lib/models/PaymentMethod"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()
    const methods = await PaymentMethod.find({ isEnabled: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean()

    const serialized = methods.map((m: Record<string, unknown>) => ({
      _id:           String(m._id),
      name:          m.name,
      slug:          m.slug,
      type:          m.type,
      instructions:  m.instructions || "",
      depositTarget: m.depositTarget || "fiat",
      icon:          m.icon || null,
      logoUrl:       m.logoUrl || null,
      minAmount:     m.minAmount || 0,
      maxAmount:     m.maxAmount || 0,
      feePercent:    m.feePercent || 0,
      feeFixed:      m.feeFixed || 0,
      paymentInfo:   m.paymentInfo || null,
    }))

    return NextResponse.json({ methods: serialized })
  } catch (err) {
    console.error("[GET /api/user/payment-methods]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
