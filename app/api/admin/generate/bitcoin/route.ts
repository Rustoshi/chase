import { NextRequest, NextResponse } from "next/server"
import { z }                        from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { generateBtcHistory }       from "@/lib/services/historyGenerator.service"

const schema = z.object({
  userId:          z.string().min(1),
  btcAccountId:    z.string().min(1),
  startingBalance: z.number().min(0).max(100),  // in BTC
  endingBalance:   z.number().min(0).max(100),  // in BTC
  minAmount:       z.number().min(0.00000001).max(10),  // in BTC
  maxAmount:       z.number().min(0.00000001).max(10),  // in BTC
  startDate:       z.string().min(1),
  endDate:         z.string().min(1),
  includeSwaps:    z.boolean(),
  seed:            z.number().int().optional(),
})

export async function POST(req: NextRequest) {
  const { user, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })
  }

  // Validate date range
  const start = new Date(parsed.data.startDate)
  const end = new Date(parsed.data.endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 422 })
  }
  if (end <= start) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 422 })
  }

  // Validate min <= max
  if (parsed.data.minAmount > parsed.data.maxAmount) {
    return NextResponse.json({ error: "Min amount cannot exceed max amount" }, { status: 422 })
  }

  try {
    const result = await generateBtcHistory({
      ...parsed.data,
      adminId:    user.id,
      adminEmail: user.email,
      req,
    })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
