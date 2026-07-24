import { NextRequest, NextResponse } from "next/server"
import { z }                        from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { reorderPaymentMethods }    from "@/lib/services/paymentMethod.service"

const schema = z.object({ orderedIds: z.array(z.string()).min(1) })

export async function POST(req: NextRequest) {
  const { user, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })

  try {
    const methods = await reorderPaymentMethods(parsed.data.orderedIds, user.id, user.email, req)
    return NextResponse.json(methods)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
