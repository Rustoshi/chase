import { NextRequest, NextResponse } from "next/server"
import { z }                   from "zod"
import { adminGuard }          from "@/lib/middleware/adminGuard"
import { resetUserPassword }   from "@/lib/services/user.service"

type Ctx = { params: Promise<{ id: string }> }

const Schema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: NextRequest, { params }: Ctx) {
  const { user: admin, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 422 })
  }

  try {
    await resetUserPassword(id, parsed.data.newPassword, admin.id, admin.email, req)
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to reset password"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
