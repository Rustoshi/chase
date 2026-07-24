import { NextRequest, NextResponse }             from "next/server"
import { adminGuard }                            from "@/lib/middleware/adminGuard"
import { getVolumeChartData, getUserGrowthData } from "@/lib/services/dashboard.service"
import { getTransactionChartData }               from "@/lib/services/transaction.service"

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  const { searchParams } = req.nextUrl
  const type    = searchParams.get("type")    ?? "volume"
  const days    = Math.min(365, Math.max(7, Number(searchParams.get("days") ?? "30")))
  const groupBy = (searchParams.get("groupBy") ?? "day") as "day" | "week" | "month"

  try {
    let data
    if (type === "growth") {
      data = await getUserGrowthData(days)
    } else if (type === "transactions") {
      data = await getTransactionChartData(groupBy, days)
    } else {
      data = await getVolumeChartData(days)
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("[dashboard/charts]", err)
    return NextResponse.json({ error: "Failed to load chart data" }, { status: 500 })
  }
}
