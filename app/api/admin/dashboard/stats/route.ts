import { NextResponse }       from "next/server"
import { adminGuard }         from "@/lib/middleware/adminGuard"
import { getDashboardStats }  from "@/lib/services/dashboard.service"

export async function GET() {
  const { error } = await adminGuard()
  if (error) return error

  try {
    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (err) {
    console.error("[dashboard/stats]", err)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
