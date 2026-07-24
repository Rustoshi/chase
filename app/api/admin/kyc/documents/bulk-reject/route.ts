import { NextRequest, NextResponse }    from "next/server"
import { z }                            from "zod"
import { adminGuard }                  from "@/lib/middleware/adminGuard"
import { bulkRejectKycDocuments }      from "@/lib/services/kyc.service"

const schema = z.object({
  documentIds: z.array(z.string()).min(1).max(50),
  reason:      z.string().trim().min(1, "Rejection reason is required").max(1000),
})

export async function POST(req: NextRequest) {
  const { user, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })

  try {
    const result = await bulkRejectKycDocuments(parsed.data.documentIds, parsed.data.reason, user.id, user.email, req)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
