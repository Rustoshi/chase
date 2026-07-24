import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserTransactionFeed } from "@/lib/services/dashboard-user.service"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sp = req.nextUrl.searchParams

    const data = await getUserTransactionFeed(session.user.id, {
      page:      parseInt(sp.get("page") || "1", 10),
      limit:     Math.min(parseInt(sp.get("limit") || "20", 10), 50),
      accountId: sp.get("accountId") || undefined,
      type:      sp.get("type") || undefined,
      dateFrom:  sp.get("dateFrom") || undefined,
      dateTo:    sp.get("dateTo") || undefined,
    })

    return NextResponse.json(data)
  } catch (err) {
    console.error("[Transactions API]", err)
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 })
  }
}
