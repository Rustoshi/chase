import { NextRequest, NextResponse } from "next/server"
import { z }                        from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { updateTransactionStatus }  from "@/lib/services/transaction.service"

type Ctx = { params: Promise<{ id: string }> }

const Schema = z.object({
  status:    z.enum(["completed", "failed", "processing"]),
  adminNote: z.string().max(500).default(""),
})

export async function PATCH(req: NextRequest, { params }: Ctx) {
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
    const tx = await updateTransactionStatus(
      id,
      parsed.data.status,
      parsed.data.adminNote,
      admin.id,
      admin.email,
      req
    )
    return NextResponse.json({ transaction: tx })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Status update failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
