import { NextRequest, NextResponse } from "next/server"
import { auth }       from "@/lib/auth"
import { connectDB }  from "@/lib/db/connection"
import User           from "@/lib/models/User"
import { z }          from "zod"

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName:  z.string().min(1).optional(),
  phone:     z.string().optional(),
})

// ── PATCH /api/admin/profile ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    await connectDB()

    const updateData: Record<string, unknown> = {}
    if (parsed.data.firstName) updateData.firstName = parsed.data.firstName
    if (parsed.data.lastName)  updateData.lastName  = parsed.data.lastName
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || undefined

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true }
    ).select("firstName lastName email phone")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id:        user._id.toString(),
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        phone:     user.phone,
      },
    })
  } catch (err) {
    console.error("[admin/profile PATCH]", err)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}

// ── GET /api/admin/profile ─────────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()

    const user = await User.findById(session.user.id).select(
      "firstName lastName email phone createdAt"
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id:        user._id.toString(),
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      phone:     user.phone,
      createdAt: user.createdAt,
    })
  } catch (err) {
    console.error("[admin/profile GET]", err)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
