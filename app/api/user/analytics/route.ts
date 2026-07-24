import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSpendingAnalytics } from "@/lib/services/dashboard-user.service"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const period = req.nextUrl.searchParams.get("period") || "30d"
    const validPeriods = ["7d", "30d", "90d"] as const
    const p = validPeriods.includes(period as "7d" | "30d" | "90d")
      ? (period as "7d" | "30d" | "90d")
      : "30d"

    const data = await getSpendingAnalytics(session.user.id, p)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[Analytics API]", err)
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 })
  }
}
