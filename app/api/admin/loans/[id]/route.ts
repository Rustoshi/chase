import { NextRequest, NextResponse } from "next/server"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { getLoanById }              from "@/lib/services/loan.service"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await adminGuard()
  if (error) return error

  const { id } = await params
  const loan = await getLoanById(id)
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(loan)
}
