import { NextRequest, NextResponse } from "next/server"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { unfreezeCard }             from "@/lib/services/card.service"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  try {
    const card = await unfreezeCard(id, user.id, user.email, req)
    return NextResponse.json(card)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
