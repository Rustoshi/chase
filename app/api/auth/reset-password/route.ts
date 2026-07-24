import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { resetPassword } from "@/lib/services/user-auth.service"

const schema = z
  .object({
    token:           z.string().min(1, "Token is required"),
    password:        z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  })

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 })
    }

    await resetPassword(parsed.data.token, parsed.data.password)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Password reset failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
