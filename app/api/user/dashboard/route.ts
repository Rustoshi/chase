import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserDashboardData } from "@/lib/services/dashboard-user.service"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await getUserDashboardData(session.user.id)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[Dashboard API]", err)
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 })
  }
}
