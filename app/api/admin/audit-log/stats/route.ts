import { NextResponse }        from "next/server"
import { adminGuard }          from "@/lib/middleware/adminGuard"
import { getAuditLogStats }    from "@/lib/services/auditLog.service"

export async function GET() {
  const { error } = await adminGuard()
  if (error) return error

  try {
    const stats = await getAuditLogStats()
    return NextResponse.json(stats)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 })
  }
}
