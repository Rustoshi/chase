import { NextRequest, NextResponse } from "next/server"
import { z }                        from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { updateCardLimits }         from "@/lib/services/card.service"

const schema = z.object({
  creditLimit:   z.number().positive().optional(),
  spendingLimit: z.number().positive().optional(),
}).refine((d) => d.creditLimit != null || d.spendingLimit != null, {
  message: "At least one limit must be provided",
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })

  try {
    const card = await updateCardLimits(id, parsed.data, user.id, user.email, req)
    return NextResponse.json(card)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
