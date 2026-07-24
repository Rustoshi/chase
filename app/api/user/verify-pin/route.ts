import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import User from "@/lib/models/User"

const pinSchema = z.object({
  pin: z.string().min(4).max(6),
})

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

    const parsed = pinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid PIN format" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(session.user.id).select("transferPin isActive isSuspended").lean()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const u = user as { transferPin?: string; isActive?: boolean; isSuspended?: boolean }

    if (!u.isActive || u.isSuspended) {
      return NextResponse.json({ error: "Your account is suspended" }, { status: 403 })
    }

    if (!u.transferPin) {
      return NextResponse.json({ error: "Transfer PIN not set. Please contact support." }, { status: 400 })
    }

    if (u.transferPin !== parsed.data.pin) {
      return NextResponse.json({ error: "Invalid transfer PIN" }, { status: 403 })
    }

    return NextResponse.json({ valid: true })
  } catch (err) {
    console.error("[Verify PIN Error]", err)
    return NextResponse.json({ error: "Failed to verify PIN" }, { status: 500 })
  }
}
