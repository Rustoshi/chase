import { NextRequest, NextResponse } from "next/server"
import { adminGuard }   from "@/lib/middleware/adminGuard"
import { getAuditLogs } from "@/lib/services/auditLog.service"

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  const p = req.nextUrl.searchParams
  try {
    const result = await getAuditLogs({
      page:       Number(p.get("page")       ?? 1),
      limit:      Number(p.get("limit")      ?? 50),
      adminId:    p.get("adminId")    ?? undefined,
      action:     p.get("action")     ?? undefined,
      targetType: p.get("targetType") ?? undefined,
      targetId:   p.get("targetId")   ?? undefined,
      dateFrom:   p.get("dateFrom")   ?? undefined,
      dateTo:     p.get("dateTo")     ?? undefined,
      search:     p.get("search")     ?? undefined,
      sortOrder:  p.get("sortOrder")  ?? undefined,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 })
  }
}
