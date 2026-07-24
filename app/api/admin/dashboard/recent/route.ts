import { NextRequest, NextResponse }                    from "next/server"
import { adminGuard }                                   from "@/lib/middleware/adminGuard"
import { getRecentTransactions, getRecentUsers, getPendingActions } from "@/lib/services/dashboard.service"

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  const { searchParams } = req.nextUrl
  const type  = searchParams.get("type")  ?? "transactions"
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "10")))

  try {
    if (type === "users") {
      const data = await getRecentUsers(limit)
      return NextResponse.json(data)
    }
    if (type === "pending") {
      const data = await getPendingActions()
      return NextResponse.json(data)
    }
    const data = await getRecentTransactions(limit)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[dashboard/recent]", err)
    return NextResponse.json({ error: "Failed to load recent data" }, { status: 500 })
  }
}
