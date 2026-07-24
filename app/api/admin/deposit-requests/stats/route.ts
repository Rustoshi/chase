import { NextResponse }   from "next/server"
import { adminGuard }     from "@/lib/middleware/adminGuard"
import { getDepositStats } from "@/lib/services/deposit.service"

export async function GET() {
  const { error } = await adminGuard()
  if (error) return error

  try {
    const stats = await getDepositStats()
    return NextResponse.json(stats)
  } catch (err) {
    console.error("[deposit-requests/stats GET]", err)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
