import { NextRequest, NextResponse } from "next/server"
import { z }            from "zod"
import { adminGuard }   from "@/lib/middleware/adminGuard"
import { suspendUser }  from "@/lib/services/user.service"

type Ctx = { params: Promise<{ id: string }> }

const Schema = z.object({ reason: z.string().min(1, "Reason is required") })

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
    return NextResponse.json({ error: "Reason is required" }, { status: 422 })
  }

  try {
    await suspendUser(id, parsed.data.reason, admin.id, admin.email, req)
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to suspend user"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
