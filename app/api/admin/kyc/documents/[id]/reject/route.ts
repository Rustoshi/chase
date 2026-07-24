import { NextRequest, NextResponse } from "next/server"
import { z }                         from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { rejectKycDocument }        from "@/lib/services/kyc.service"

const schema = z.object({ reason: z.string().min(5, "Reason must be at least 5 characters") })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })

  try {
    const doc = await rejectKycDocument(id, parsed.data.reason, user.id, user.email, req)
    return NextResponse.json(doc)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
