import { NextRequest, NextResponse } from "next/server"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { markLoanDefaulted }        from "@/lib/services/loan.service"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const { user, error } = await adminGuard()
  if (error) return error

  const { id } = await params

  try {
    const loan = await markLoanDefaulted(id, user.id, user.email, req)
    return NextResponse.json(loan)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
