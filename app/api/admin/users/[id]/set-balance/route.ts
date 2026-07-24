import { NextRequest, NextResponse } from "next/server"
import { z }                         from "zod"
import { adminGuard }                from "@/lib/middleware/adminGuard"
import { setAccountBalanceDirectly } from "@/lib/services/user.service"

type Ctx = { params: Promise<{ id: string }> }

const Schema = z.object({
  accountId:  z.string().min(1, "Account ID is required"),
  newBalance: z.number().min(0, "Balance cannot be negative"),
})

export async function POST(req: NextRequest, { params }: Ctx) {
  const { user: admin, error } = await adminGuard()
  if (error) return error

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
    const result = await setAccountBalanceDirectly(
      parsed.data.accountId,
      parsed.data.newBalance,
      admin.id,
      admin.email,
      req
    )
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to set balance"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
