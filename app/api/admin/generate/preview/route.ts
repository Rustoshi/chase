import { NextRequest, NextResponse } from "next/server"
import { z }                        from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { previewGeneration }        from "@/lib/services/historyGenerator.service"

const schema = z.object({
  startingBalance:         z.number().min(0),
  endingBalance:           z.number().min(0),
  minAmount:               z.number().min(0.01),
  maxAmount:               z.number().min(0.01),
  startDate:               z.string().min(1),
  endDate:                 z.string().min(1),
  includeCardTransactions: z.boolean(),
  hasActiveCards:          z.boolean(),
})

export async function POST(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })
  }

  const preview = previewGeneration(parsed.data)
  return NextResponse.json(preview)
}
