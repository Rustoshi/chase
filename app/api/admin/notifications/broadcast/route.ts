import { NextRequest, NextResponse }   from "next/server"
import { z }                           from "zod"
import { adminGuard }                 from "@/lib/middleware/adminGuard"
import { broadcastNotification }      from "@/lib/services/notification.service"

const schema = z.discriminatedUnion("targetAudience", [
  z.object({
    targetAudience:  z.literal("specific_users"),
    specificUserIds: z.array(z.string()).min(1).max(100),
    subject:         z.string().min(1).max(100),
    body:            z.string().min(1).max(1000),
    type:            z.enum(["system", "marketing"]),
  }),
  z.object({
    targetAudience: z.enum(["all", "verified", "unverified"]),
    subject:        z.string().min(1).max(100),
    body:           z.string().min(1).max(1000),
    type:           z.enum(["system", "marketing"]),
  }),
])

export async function POST(req: NextRequest) {
  const { user, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })

  try {
    const result = await broadcastNotification(parsed.data, user.id, user.email, req)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
