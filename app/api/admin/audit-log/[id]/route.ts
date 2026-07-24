import { NextResponse }        from "next/server"
import { adminGuard }          from "@/lib/middleware/adminGuard"
import { getAuditLogById }     from "@/lib/services/auditLog.service"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await adminGuard()
  if (error) return error

  try {
    const { id } = await params
    const log = await getAuditLogById(id)
    if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(log)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 })
  }
}
