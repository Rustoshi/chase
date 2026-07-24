import { NextRequest, NextResponse } from "next/server"
import { z }                        from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { reverseTransaction }       from "@/lib/services/transaction.service"

type Ctx = { params: Promise<{ id: string }> }

const Schema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
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
    const result = await reverseTransaction(id, parsed.data.reason, admin.id, admin.email, req)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Reversal failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
