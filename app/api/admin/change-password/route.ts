import { NextRequest, NextResponse } from "next/server"
import { auth }       from "@/lib/auth"
import { connectDB }  from "@/lib/db/connection"
import User           from "@/lib/models/User"
import bcrypt         from "bcryptjs"
import { z }          from "zod"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

// ── POST /api/admin/change-password ────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

  const parsed = passwordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid data" },
      { status: 400 }
    )
  }

  try {
    await connectDB()

    const user = await User.findById(session.user.id).select("passwordHash")
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const newHash = await bcrypt.hash(parsed.data.newPassword, 12)

    // Update password
    await User.findByIdAndUpdate(session.user.id, {
      $set: { passwordHash: newHash },
    })

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (err) {
    console.error("[admin/change-password POST]", err)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
