import { NextRequest, NextResponse } from "next/server"
import { adminGuard }    from "@/lib/middleware/adminGuard"
import { unsuspendUser } from "@/lib/services/user.service"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const { user: admin, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  try {
    await unsuspendUser(id, admin.id, admin.email, req)
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to unsuspend user"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
