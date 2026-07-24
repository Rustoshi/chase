import { NextRequest, NextResponse } from "next/server"
import { adminGuard }   from "@/lib/middleware/adminGuard"
import { getUserById, updateUser, deleteUser } from "@/lib/services/user.service"

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/admin/users/[id] ─────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await adminGuard()
  if (error) return error

  const { id } = await params

  try {
    const user = await getUserById(id)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json(user)
  } catch (err) {
    console.error("[admin/users/[id] GET]", err)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

// ── PATCH /api/admin/users/[id] ───────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { user: admin, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    const updated = await updateUser(id, body as Parameters<typeof updateUser>[1], admin.id, admin.email, req)
    return NextResponse.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update user"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ── DELETE /api/admin/users/[id] ──────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { user: admin, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  try {
    await deleteUser(id, admin.id, admin.email, req)
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete user"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
