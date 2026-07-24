import { NextRequest, NextResponse }    from "next/server"
import { z }                            from "zod"
import { adminGuard }                   from "@/lib/middleware/adminGuard"
import { confirmDepositRequest }        from "@/lib/services/deposit.service"

type Ctx = { params: Promise<{ id: string }> }

const Schema = z.object({
  confirmedAmount: z.number().positive("Amount must be positive"),
  adminNote:       z.string().max(500).optional().default(""),
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
    const result = await confirmDepositRequest(
      id,
      parsed.data.confirmedAmount,
      parsed.data.adminNote,
      admin.id,
      admin.email,
      req
    )
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to confirm request"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
