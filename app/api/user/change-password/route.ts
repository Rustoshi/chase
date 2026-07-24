import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { changePassword } from "@/lib/services/user-auth.service"

const schema = z
  .object({
    currentPassword:    z.string().min(1, "Current password is required"),
    newPassword:        z.string().min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path:    ["confirmNewPassword"],
  })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body   = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 })
    }

    await changePassword(
      session.user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword
    )

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Password change failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
