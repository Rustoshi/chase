import { NextRequest, NextResponse } from "next/server"
import { z }                    from "zod"
import { adminGuard }           from "@/lib/middleware/adminGuard"
import { adjustUserBalance }    from "@/lib/services/user.service"

type Ctx = { params: Promise<{ id: string }> }

const Schema = z.object({
  accountId:   z.string().min(1),
  amount:      z.number().int("Amount must be a whole number (cents or satoshis)").refine((n) => n !== 0, "Amount cannot be zero"),
  description: z.string().min(1, "Description is required").max(500),
})

export async function POST(req: NextRequest, { params }: Ctx) {
  const { user: admin, error } = await adminGuard()
  if (error) return error

  // params.id is the userId — we validate accountId belongs to that user in service
  await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 422 })
  }

  try {
    const tx = await adjustUserBalance(
      parsed.data.accountId,
      parsed.data.amount,
      parsed.data.description,
      admin.id,
      admin.email,
      req
    )
    return NextResponse.json(tx)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Balance adjustment failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
