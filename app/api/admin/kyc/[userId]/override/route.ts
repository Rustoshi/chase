import { NextRequest, NextResponse } from "next/server"
import { z }                         from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { overrideKycStatus }        from "@/lib/services/kyc.service"

const schema = z.object({
  kycStatus: z.string().min(1),
  kycTier:   z.union([z.literal(1), z.literal(2), z.literal(3)]),
  reason:    z.string().min(1),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const { user, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })

  try {
    const updated = await overrideKycStatus(userId, parsed.data.kycStatus, parsed.data.kycTier, parsed.data.reason, user.id, user.email, req)
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
