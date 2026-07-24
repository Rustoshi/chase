import { NextRequest, NextResponse } from "next/server"
import { z }                        from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { wipeHistory, wipeAllHistory } from "@/lib/services/generator.service"

const schema = z.object({
  userId:    z.string().min(1),
  accountId: z.string().optional(),
  wipeAll:   z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const { user, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  console.log("[wipe] Received body:", JSON.stringify(body))

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    console.error("[wipe] Validation failed:", JSON.stringify(parsed.error.flatten()))
    return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })
  }

  const { userId, accountId, wipeAll } = parsed.data

  // Validate: either wipeAll or accountId must be provided
  if (!wipeAll && !accountId) {
    return NextResponse.json({ error: "Either accountId or wipeAll must be provided" }, { status: 422 })
  }

  try {
    const adminId    = user.id
    const adminEmail = user.email

    if (wipeAll) {
      const result = await wipeAllHistory(userId, adminId, adminEmail, req)
      return NextResponse.json(result)
    } else {
      const result = await wipeHistory(userId, accountId!, adminId, adminEmail, req)
      return NextResponse.json(result)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Wipe failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
