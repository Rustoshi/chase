import { NextRequest, NextResponse }    from "next/server"
import { z }                            from "zod"
import { adminGuard }                   from "@/lib/middleware/adminGuard"
import { rejectDepositRequest }         from "@/lib/services/deposit.service"

type Ctx = { params: Promise<{ id: string }> }

const Schema = z.object({
  adminNote: z.string().min(10, "Please provide a reason of at least 10 characters"),
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
    const request = await rejectDepositRequest(
      id,
      parsed.data.adminNote,
      admin.id,
      admin.email,
      req
    )
    return NextResponse.json(request)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to reject request"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
