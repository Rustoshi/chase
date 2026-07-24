import { NextRequest, NextResponse } from "next/server"
import { z }            from "zod"
import { adminGuard }   from "@/lib/middleware/adminGuard"
import {
  getUserAlertForAdmin,
  upsertUserAlert,
  deactivateUserAlert,
} from "@/lib/services/alert.service"

type Ctx = { params: Promise<{ id: string }> }

const schema = z.object({
  title:              z.string().trim().min(1, "Title is required").max(120),
  body:               z.string().trim().min(1, "Message is required").max(2000),
  severity:           z.enum(["info", "warning", "critical"]).optional(),
  isActive:           z.boolean().optional(),
  requireAcknowledge: z.boolean().optional(),
  blockTransactions:  z.boolean().optional(),
  sendEmail:          z.boolean().optional(),
})

// Current alert for this user (returned even when switched off)
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await adminGuard()
  if (error) return error

  const { id } = await params
  const alert = await getUserAlertForAdmin(id)
  return NextResponse.json({ alert })
}

// Create / replace the alert
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { user, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const alert = await upsertUserAlert(id, parsed.data, user.id, user.email, req)
    return NextResponse.json({ alert })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}

// Switch the alert off (content is kept so it can be re-enabled)
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { user, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  try {
    const alert = await deactivateUserAlert(id, user.id, user.email, req)
    return NextResponse.json({ alert })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
