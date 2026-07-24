import { NextRequest, NextResponse } from "next/server"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { getCardById, adminUpdateCard, type AdminCardUpdate } from "@/lib/services/card.service"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await adminGuard()
  if (error) return error

  const { id } = await params
  const card = await getCardById(id)
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(card)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  let body: AdminCardUpdate
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  try {
    const updated = await adminUpdateCard(id, body, user.id, user.email, req)
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 400 })
  }
}
