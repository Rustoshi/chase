import { NextRequest, NextResponse } from "next/server"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import {
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
} from "@/lib/services/paymentMethod.service"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await adminGuard()
  if (error) return error

  const { id } = await params
  const method = await getPaymentMethodById(id)
  if (!method) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(method)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  try {
    const updated = await updatePaymentMethod(id, body as Record<string, unknown>, user.id, user.email, req)
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  try {
    await deletePaymentMethod(id, user.id, user.email, req)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
